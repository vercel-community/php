# PHP libraries

> PHP compiled binaries with static shared libraries.

These libs include PHP bins and shared modules for PHP.

**Versions**

- PHP 7.2 | @now-php/lib-72
- PHP 7.3 | @now-php/lib-73
- PHP 7.4 | @now-php/lib-74

## Usage

**Build**

- `make build72` - builds the Docker image with PHP 7.2 sources
- `make build73` - builds the Docker image with PHP 7.3 sources
- `make build74` - builds the Docker image with PHP 7.4 sources

**Compile**

- `make dist72` - separates PHP (CLI, CGI, FPM) bins with extensions and share libraries to `/v7.2` folder
- `make dist73` - separates PHP (CLI, CGI, FPM) bins with extensions and share libraries to `/v7.3` folder
- `make dist74` - separates PHP (CLI, CGI, FPM) bins with extensions and share libraries to `/v7.4` folder

**Testing**

- `make test-php` - test PHP is properly loaded and working
- `make test-fpm` - test PHP-FPM is properly loaded and working

## Publish

- `make publish72` | `make publish72-canary`
- `make publish73` | `make publish73-canary`
- `make publish74` | `make publish74-canary`
