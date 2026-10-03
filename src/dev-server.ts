import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import net from 'net';
import path from 'path';
import type { StartDevServer } from '@vercel/build-utils';

// Windows treats environment names case-insensitively, but Node's child_process
// only passes the first spelling. Merge overrides without retaining duplicates.
function localEnvironment(overrides: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const source of [process.env, overrides]) {
    for (const [key, value] of Object.entries(source)) {
      env[process.platform === 'win32' ? key.toUpperCase() : key] = value;
    }
  }
  // One PHP process per invocation. Worker children would escape pid cleanup.
  for (const key of Object.keys(env)) {
    if (key.toUpperCase() === 'PHP_CLI_SERVER_WORKERS') delete env[key];
  }
  return env;
}

async function availablePort(): Promise<number> {
  const server = net.createServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Unable to allocate a local PHP server port.'));
        return;
      }
      server.close(error => error ? reject(error) : resolve(address.port));
    });
  });
}

function stop(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
    }, 1000);
    const deadline = setTimeout(() => {
      cleanup();
      reject(new Error(`Unable to stop local PHP process ${child.pid}.`));
    }, 5000);
    const cleanup = () => {
      clearTimeout(timer);
      clearTimeout(deadline);
      child.removeListener('close', closed);
    };
    const closed = () => { cleanup(); resolve(); };
    child.once('close', closed);
    child.kill();
  });
}

function ready(child: ChildProcess, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let stderr = '';
    let socket: net.Socket | undefined;
    const timeout = setTimeout(() => finish(new Error('Local PHP server startup timed out.')), 10000);
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      socket?.destroy();
      child.removeListener('error', failed);
      child.removeListener('close', closed);
      child.stderr?.removeListener('data', output);
      error ? reject(error) : resolve();
    };
    const failed = (error: Error) => finish(new Error(
      `Unable to start local PHP. Install PHP CLI and add it to PATH, or set VERCEL_PHP_EXECUTABLE. ${error.message}`
    ));
    const closed = (code: number | null) => finish(new Error(
      `Local PHP server exited before becoming ready (code ${code}). ${stderr.trim()}`
    ));
    const output = (data: Buffer) => {
      stderr = (stderr + data.toString()).slice(-8192);
      // Wait for PHP's own startup confirmation before probing. A different
      // process could have claimed the allocated port between close and spawn.
      if (!socket && /Development Server .*started/.test(stderr)) {
        socket = net.connect(port, '127.0.0.1');
        socket.once('connect', () => finish());
        socket.once('error', error => finish(error));
      }
    };
    child.once('error', failed);
    child.once('close', closed);
    child.stderr?.on('data', output);
  });
}

export const startDevServer: StartDevServer = async ({
  entrypoint, workPath, meta = {}, publicDir, onStdout, onStderr,
}) => {
  const env = localEnvironment(meta.env || {});
  const executable = env.VERCEL_PHP_EXECUTABLE || 'php';
  const router = path.resolve(workPath, entrypoint);
  const docroot = path.resolve(workPath, env.VERCEL_PHP_DOCROOT || publicDir || '.');
  if (!(await fs.stat(router)).isFile()) throw new Error(`PHP entrypoint is not a file: ${router}`);
  if (!(await fs.stat(docroot)).isDirectory()) throw new Error(`PHP document root is not a directory: ${docroot}`);

  const ini = path.join(workPath, 'api', 'php.ini');
  try {
    if ((await fs.stat(ini)).isFile()) {
      // Keep the host's primary php.ini/extensions and scan project overrides
      // afterward, rather than loading Linux runtime configuration locally.
      env.PHP_INI_SCAN_DIR = `${env.PHP_INI_SCAN_DIR || ''}${path.delimiter}${path.dirname(ini)}`;
    }
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const port = await availablePort();
    const child = spawn(executable, ['-S', `127.0.0.1:${port}`, '-t', docroot, router], {
      cwd: workPath, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    });
    let shutdownPromise: Promise<void> | undefined;
    const shutdown = () => {
      process.removeListener('exit', onExit);
      if (!shutdownPromise) shutdownPromise = stop(child);
      return shutdownPromise;
    };
    // Do not accumulate per-request exit handlers after CLI shutdown.
    const onExit = () => { child.kill(); };
    process.once('exit', onExit);
    child.once('close', () => process.removeListener('exit', onExit));
    child.stdout?.on('data', onStdout || (data => process.stdout.write(data)));
    child.stderr?.on('data', onStderr || (data => process.stderr.write(data)));
    try {
      await ready(child, port);
      if (!child.pid) throw new Error('Local PHP server did not provide a process ID.');
      return { port, pid: child.pid, shutdown };
    } catch (error) {
      await shutdown();
      if (attempt < 2 && error instanceof Error && /Failed to listen/.test(error.message)) continue;
      throw error;
    }
  }
  throw new Error('Unable to allocate a local PHP server port.');
};
