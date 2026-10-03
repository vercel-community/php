# Local PHP is required for `vercel dev`

The runtime uses your installed PHP CLI for local development. It does not run the bundled Linux deployment binary on your computer. PHP-CGI is not required.

Install a supported PHP CLI version using your operating system's package manager or the [PHP installation instructions](https://www.php.net/manual/en/install.php). On Windows, install a native PHP build and its required Visual C++ runtime.

Check the executable and configuration in the terminal where you run Vercel:

```sh
php -v
php --ini
```

Add PHP to `PATH`, or set `VERCEL_PHP_EXECUTABLE` to the full executable path in that terminal's environment. For example, in PowerShell:

```powershell
$env:VERCEL_PHP_EXECUTABLE = 'C:\php\php.exe'
vercel dev
```

Install the extensions your application requires. Startup warnings about missing DLLs or shared libraries usually mean your local `php.ini` references another installation. Correct those paths or use `PHPRC` to select a local configuration. The runtime preserves your host's configuration and appends `api/*.ini` project overrides when `api/php.ini` exists; it does not merge the Linux runtime's defaults.

For Composer projects, run `composer install` locally before starting `vercel dev`. The dev hook does not install dependencies or run Composer build scripts automatically.

See the [README local development section](../README.md#-vercel-dev) for routing, environment variables, document roots and the standalone PHP-server alternative.
