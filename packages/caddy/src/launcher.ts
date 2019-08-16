import { normalizeEvent, transformFromAwsRequest, transformToAwsResponse, isDev, getPhpDir, getUserDir } from "./helpers";
import { ChildProcess, spawn, SpawnOptions } from "child_process";
import http from 'http';
import net from 'net';

let connFpm: ChildProcess;
let connCaddy: ChildProcess;

async function startFpm() {
    if (connFpm) {
        console.log(`🐘 PHP FPM is already running`);
        return;
    }

    console.log(`🐘 Spawning: PHP-FPM`);

    // php spawn options
    const options: SpawnOptions = {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env
    };

    // now vs now-dev
    if (!isDev()) {
        options.env!.PATH = `${getPhpDir()}:${process.env.PATH}`;
        options.cwd = getPhpDir();
    } else {
        options.cwd = getUserDir();
    }

    const fpm = spawn(
        'php-fpm',
        ['-c', 'php.ini', '--fpm-config', 'php-fpm.ini', '--nodaemonize'],
        options
    );

    fpm.on('close', function (code, signal) {
        console.log(`🐘 PHP-FPM process closed code ${code} and signal ${signal}`);
    });

    fpm.on('error', function (err) {
        console.error(`🐘 PHP-FPM process errored ${err}`);
    });

    process.on('exit', () => {
        fpm.kill();
    })

    await whenPortOpens(9000, 400);

    connFpm = fpm;
}

async function startCaddy() {
    if (connCaddy) {
        console.log(`🚀 Caddy is already running`);
        return;
    }

    console.log(`🚀 Spawning Caddy`);

    const caddy = spawn(
        './caddy',
        ['-conf', 'Caddyfile', '-root', '/var/task/user'],
        {
            stdio: 'inherit',
            cwd: '/var/task',
        },
    );

    caddy.on('close', function (code, signal) {
        console.log(`🚀 Caddy process closed code ${code} and signal ${signal}`);
    });

    caddy.on('error', function (err) {
        console.error(`🚀 Caddy process errored ${err}`);
    });

    process.on('exit', () => {
        caddy.kill();
    })

    await whenPortOpens(8000, 400);

    connCaddy = caddy;
}

function whenPortOpensCallback(port: number, attempts: number, cb: (error?: string) => void) {
    const client = net.connect(port, '127.0.0.1');
    client.on('error', (error: string) => {
        if (!attempts) return cb(error);
        setTimeout(() => {
            whenPortOpensCallback(port, attempts - 1, cb);
        }, 50);
    });
    client.on('connect', () => {
        client.destroy();
        cb();
    });
}

function whenPortOpens(port: number, attempts: number): Promise<void> {
    return new Promise((resolve, reject) => {
        whenPortOpensCallback(port, attempts, (error?: string) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

async function query({ uri, headers, method, body }: PhpInput): Promise<PhpOutput> {
    if (!connFpm || !connCaddy) {
        await Promise.all([
            startFpm(),
            startCaddy()
        ]);
    }

    return new Promise(resolve => {
        const options = {
            hostname: '127.0.0.1',
            port: 8000,
            path: `${uri}`,
            method,
            headers,
        };

        const req = http.request(options, (res) => {
            const chunks: Uint8Array[] = [];

            res.on('data', (data) => {
                chunks.push(data);
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode || 200,
                    headers: res.headers,
                    body: Buffer.concat(chunks)
                });
            });
        });

        req.on('error', (error) => {
            console.error('🚀 Caddy HTTP errored', error);
            resolve({
                body: Buffer.from(`🚀 Caddy HTTP error: ${error}`),
                headers: {},
                statusCode: 500
            });
        });

        if (body) {
            req.write(body);
        }

        req.end();
    });
}

async function launcher(event: Event): Promise<AwsResponse> {
    const awsRequest = normalizeEvent(event);
    const input = await transformFromAwsRequest(awsRequest);
    const output = await query(input);
    return transformToAwsResponse(output);
}

exports.launcher = launcher;

// (async function() {
//   console.log(await launcher({
//     httpMethod: 'GET',
//     path: '/index.php'
//   }));
// })();
