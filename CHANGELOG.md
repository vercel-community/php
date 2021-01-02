# Changelog

### [0.4.0] - 2021-01-02

- PHP 8.0
- Use `@libphp/amazon-linux-2-v80: latest`

### [0.3.2] - 2021-01-02

- Typos
- More hints in FAQ
- Fix `excludeFiles` option
- Install PHP extensions mongodb
- Use `@libphp/amazon-linux-2-v74: latest`

### [0.3.1] - 2020-07-04

- Install PHP extensions redis, msgpack, igbinary
- Use `@libphp/amazon-linux-2-v74: latest`

### [0.3.0] - 2020-06-29

- Allow to execute composer script called `vercel`

  ```json
  {
    "scripts": {
      "vercel": [
        "@php -v",
        "npm -v"
      ]
    }
  }
  ```

- Drop support of `config['php.ini']` use `api/php.ini` file instead
- Support excludeFiles (default `['node_modules/**', 'now.json', '.nowignore']`)

  ```json
  {
    "functions": {
    "api/**/*.php": {
      "runtime": "vercel-php@0.3.0",
      "excludeFiles": ["node_modules", "somedir", "foo/bar"],
    }
  }
  ```

- Restructure test folder (merge fixtures + my examples)

### [0.2.0] - 2020-06-26

- Allow to override `php.ini`

  ```sh
  project
  ├── api
  │   ├── index.php
  │   └── php.ini
  └── now.json
  ```

- Extensive update of docs
- Introduce FAQ questions
- Move caddy package to [juicyfx/juicy](https://github.com/juicyfx/juicy)
- Simplify repository structure

### [0.1.0] - 2020-06-20

- Rename repository from now-php to **vercel-php**
- Rename NPM package from now-php to **vercel-php**
- Upgrade PHP to 7.4.7 and recompile PHP extensions
- Improve readme
- Separate PHP libs to solo repository [juicyfx/libphp](https://github.com/juicyfx/libphp) (bigger plans)
- Use [php.vercel.app](https://php.vercel.app) domain for official showtime
- Use [phpshow.vercel.app](https://phpshow.vercel.app) domain for runtime showcase

### [0.0.9] - 2020-03-28

- Use PHP 7.4 for installing Composer dependencies
- Upgrade PHP 7.4 and recompile PHP extensions

### [0.0.9] - 2020-01-16

- Use PHP 7.3 for installing Composer dependencies
- Separate [examples](https://github.com/juicyfx/vercel-examples) to solo repository
- Extensions
  - Disabled ssh2
  - Added psr
  - Rebuild phalcon, swoole

### [0.0.8] - 2020-01-07

- Runtime v3
- Upgrade to PHP 7.4.x
- Node 8.x reached EOL on AWS
- Used Amazon Linux 2
- CGI launcher inherits process.env [#38]
- Drop Circle CI
- Rebuild all PHP libs

### [0.0.7] - 2019-11-08

- Rename builder to runtime
- Runtime v3

**Migration**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.php",
      "use": "now-php"
    }
  ]
}
```

➡️

```json
{
  "functions": {
    "api/*.php": {
      "runtime": "now-php@0.0.7"
    }
  },
  // Optionally provide routes
  "routes": [
    { "src": "/(.*)",  "dest": "/api/index.php" }
  ]
}
```

### [0.0.6] - 2019-11-07

- Change builds to functions

### [0.0.5] - 2019-09-30

- Added Lumen example
- Bugfix deploying PHP files in folders under different names then index.php

### [0.0.4] - 2019-09-30

- Implement intermediate caching (vendor, composer.lock, yarn.locak, package-lock.json, node_modules)
- Rewrite PHP built-in server document root

### [0.0.3] - 2019-09-04

- Bugfix passing query parameters and accessing $_GET

### [0.0.2] - 2019-08-23

- Bump now-php@latest

### [0.0.1-canary.39] - 2019-08-23

- Allow overriding php.ini
- Bugfix resolving PHP bin
- Bugfix deploying php files in subfolders

### [0.0.2-canary.2] - 2019-08-16

- Compile PHP 7.3.8

### [0.0.1-canary.5] - 2019-08-16

- First working copy of caddy server

### [0.0.1-canary.30] - 2019-08-16

- New exported method `getPhpLibFiles`
- Repair tests

### [0.0.1-canary.18] - 2019-08-02

- Bump now-php@latest

### [0.0.1-canary.18] - 2019-08-02

- Working on change response from string to Buffer
- Updated homepage

### [0.0.1-canary.17] - 2019-08-02

- Working on change response from string to Buffer

### [0.0.1-canary.15] - 2019-08-02

- CGI: REQUEST_URI contains only path, not host + path
- CGI: QUERY_STRING contains string without leading ?

### [0.0.1-canary.14] - 2019-07-29

- Tests: more tests

### [0.0.1-canary.13] - 2019-07-29

- Tests: take tests from official old builder

### [0.0.1-canary.12] - 2019-07-28

- Rewritten to TypeScript

### [0.0.1-canary.11] - 2019-07-28

- Working on `now-dev`

### [0.0.1-canary.8] - 2019-07-27

- First working `now-php` builder

### [0.0.1-canary.7] - 2019-07-27

- Working on `now` with `now-php`

### [0.0.1-canary.0] - 2019-07-27

- History begins
