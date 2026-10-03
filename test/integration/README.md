# Local development tests

Build the runtime before running tests:

```sh
npm run build
npx jest --runInBand test/spec/index.dev.js
```

The PHP tests use `php` on `PATH`, or `TEST_PHP_EXECUTABLE` if set. Tests that need PHP are explicitly skipped with a warning if the executable cannot run `-n -v`. Missing-executable and BuildV3 export/fallback tests always run. Set `PHPRC` when your host installation needs an isolated configuration. Tests create and remove fixtures under the ignored `.local` directory.

## Real Vercel CLI dispatch

Install Vercel CLI separately in an ignored tool directory, or use an existing installation. For example:

```sh
npm install --prefix .local/cli --ignore-scripts vercel@50.4.5
TEST_VERCEL_CLI="$PWD/.local/cli/node_modules/vercel/dist/vc.js" node test/integration/vercel-dev.js
```

In PowerShell:

```powershell
$env:TEST_VERCEL_CLI = "$PWD/.local/cli/node_modules/vercel/dist/vc.js"
$env:TEST_PHP_EXECUTABLE = 'C:\php\php.exe'
node test/integration/vercel-dev.js
```

Without `TEST_VERCEL_CLI` or runnable PHP, this script prints an explicit skip message. It invokes the unmodified CLI against generated projects using both legacy `builds` and current `functions` configurations, with this checkout's compiled runtime in the project's local builder cache. It checks direct and nested entrypoints, rewrites and query merging, form/binary bodies, concurrent endpoints, static files, `.env`, project ini overrides and the CLI's per-response PHP shutdown.

No account or deployment is used. Global config is isolated inside each fixture; the command uses a dummy token and the CLI's `__VERCEL_SKIP_DEV_CMD` test escape hatch to avoid project linking. The API URL is a loopback trap, and the test asserts that no API calls occurred. It never changes real credentials. Tool installs and generated fixtures are not part of the package or PR.

The hook follows the [Vercel CLI 50.4.5 dispatch contract](https://github.com/vercel/vercel/blob/vercel%4050.4.5/packages/cli/src/util/dev/server.ts): a hook call per matched request, original URL plus routing query parameters proxied to the returned port, and `shutdown` on response close. It does not cache a persistent PHP process across invocations.
