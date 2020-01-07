## [Unreleased]

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
