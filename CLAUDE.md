# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**vercel-php** is a PHP runtime for the Vercel platform enabling serverless PHP applications. It bundles PHP 8.3 with common extensions and supports multiple execution modes (built-in server, CGI, CLI).

## Commands

```bash
make install       # Install dependencies (npm install)
make build         # Compile TypeScript to dist/ (npm run build)
make build-watch   # Watch mode compilation (npm run watch)
make test          # Run Jest test suite (npm run test)
make test-watch    # Run tests in watch mode
make publish       # Publish to npm (latest tag)
make canary        # Publish to npm (canary tag)
```

## Architecture

### Vercel BuildV3 Runtime

The package implements Vercel's BuildV3 specification, exporting:
- `version = 3` - API version
- `build()` - Main builder function
- `prepareCache()` - Cache preparation
- `shouldServe()` - File serving decisions

### Build Flow (src/index.ts)

1. Download user files and PHP runtime (`@libphp/amazon-linux-2-v83`)
2. Run `composer install` if `composer.json` exists
3. Execute `composer run vercel` script if defined
4. Merge user `api/php.ini` with runtime defaults
5. Package everything into AWS Lambda function

### Runtime Execution Modes (src/launchers/)

- **builtin.ts** - PHP's built-in server (`php -S 0.0.0.0:3000`), proxied via Node.js. Default mode.
- **cgi.ts** - Spawns `php-cgi` per request with CGI environment variables. Stateless.
- **cli.ts** - Direct PHP CLI execution for simple scripts.

### Key Source Files

- `src/index.ts` - Build entry point implementing BuildV3
- `src/utils.ts` - Build utilities (Composer, PHP config, file collection)
- `src/launchers/helpers.ts` - Request/response transformation between Vercel events and PHP

### Type Definitions (src/types.d.ts)

Key types: `UserFiles`, `RuntimeFiles`, `Event`, `InvokedEvent`, `AwsRequest`, `AwsResponse`, `PhpInput`, `PhpOutput`, `CgiInput`

## Code Conventions

- Logging uses 🐘 emoji prefix for console output
- Exit codes: 253-255 for critical child process errors, 1 for general errors
- User files are prefixed with `/user/` in Lambda task root
- TypeScript strict mode with `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`
- 2-space indentation for JS/TS/JSON/YAML/MD files

## Testing

Tests are in `test/spec/` with example projects in `test/examples/`. Jest timeout is 10 seconds.
