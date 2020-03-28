<h1 align=center>ZEIT Now PHP</h1>

<p align=center>
Enjoyable & powerful 🐘 PHP Runtime (<a href="https://php.now.sh">php.now.sh</a>) for ZEIT Now.
</p>

<p align=center>
🕹 <a href="https://f3l1x.io">f3l1x.io</a> | 💻 <a href="https://github.com/f3l1x">f3l1x</a> | 🐦 <a href="https://twitter.com/xf3l1x">@xf3l1x</a>
</p>

<p align=center>
  <a href="https://www.npmjs.com/package/now-php"><img alt="npm" src="https://img.shields.io/npm/dt/now-php?style=flat-square"></a>
  <a href="https://www.npmjs.com/package/now-php"><img alt="npm (latest)" src="https://img.shields.io/npm/v/now-php/latest?style=flat-square"></a>
</p>

<p align=center>
  <a href="https://github.com/nette"><img src="https://github.com/nette.png" width="128"></a>
  <a href="https://github.com/symfony"><img src="https://github.com/symfony.png" width="128"></a>
  <a href="https://github.com/illuminate"><img src="https://github.com/illuminate.png" width="128"></a>
  <a href="https://github.com/slimphp"><img src="https://github.com/slimphp.png" width="128"></a>
  <a href="https://github.com/phalcon"><img src="https://github.com/phalcon.png" width="128"></a>
</p>

<p align=center><strong>🏋️‍♀️ It works with these frameworks and tools. Discover more at <a href="https://github.com/juicyfx/now-examples">examples</strong>.</p>

-----

## 🐣 Versions

|    | Pkg     | Tag          | Stability   | Info                     |
|----|---------|--------------|-------------|--------------------------|
| ✅ | now-php | latest       | production  | Rock-solid stable.       |
| 🔥 | now-php | canary       | testing     | For early-adopters.      |
| ⚠️  | now-php | experimental | development | Testing and high danger. |

> Need to know how things are changing? Here is [changelog](./CHANGELOG.md).

## 🤗 Features

- **Architecture**: PHP development server (🚀 fast enough)
- **PHP version**: 7.4.3
- **Extensions**: apcu, bcmath, bz2, calendar, Core, ctype, curl, date, dom, ds, exif, fileinfo, filter, ftp, gettext, hash, iconv, json, libxml, mbstring, mysqli, mysqlnd, openssl, pcntl, pcre, PDO, pdo_mysql, pdo_pgsql, pdo_sqlite, phalcon (4.0.2), Phar, psr (0.7.0), readline, Reflection, session, SimpleXML, soap, sockets, sodium, SPL, sqlite3, *ssh2* (not now), standard, swoole (4.4.15), tokenizer, xml, xmlreader, xmlrpc, xmlwriter, xsl, Zend OPcache, zlib
- **Speed**: cold ~250ms / warm ~5ms
- **Memory**: ~90mb
- **Frameworks**: Nette, Symfony, Lumen, Slim, Phalcon

> List of all installable extensions is on this page https://blog.remirepo.net/pages/PECL-extensions-RPM-status.

## ⚙️ Usage

Take a look at [ZEIT's](https://zeit.co) blogpost about [`Serverless Functions`](https://zeit.co/blog/customizing-serverless-functions).

You should define `functions` property in `now.json` and list PHP files directly or using wildcard (*).

```json
{
  "functions": {
    "api/*.php": {
      "runtime": "now-php@0.0.10"
    }
  }
}
```

If you need to show index page define `routes` properly.

```json
{
  "functions": {
    "api/index.php": {
      "runtime": "now-php@0.0.10"
    }
  },
  "routes": [
    { "src": "/(.*)",  "dest": "/api/index.php" }
  ]
}
```

Additional function properties are `memory`, `maxDuration`.

```json
{
  "functions": {
    "api/*.php": {
      "runtime": "now-php@0.0.10",
      "memory": 3008,
      "maxDuration": 500
    }
  }
}
```

**Click & Go**

[![Deploy with ZEIT Now](https://zeit.co/button)](https://zeit.co/new/project?template=https://github.com/juicyfx/now-examples/tree/master/php)

## 👨‍💻`now dev`

For running `now dev` properly, you need to have PHP installed on your computer, [learn more](errors/now-dev-no-local-php.md).

## 👀 Demo

- official - https://php.now.sh/
- phpinfo - https://php.jfx.cz/
- extensions - https://php.jfx.cz/ext/
- ini - https://php.jfx.cz/ini/
- JSON API - https://php.jfx.cz/api/users.php
- test - https://php.jfx.cz/test.php

![](docs/phpinfo.png)

## 🎯Examples

- [PHP - fast & simple](https://github.com/juicyfx/now-examples/tree/master/php/)
- [Composer - install dependencies](https://github.com/juicyfx/now-examples/tree/master/php-composer/)
- [Framework - Lumen](https://github.com/juicyfx/now-examples/tree/master/php-framework-lumen/)
- [Framework - Nette](https://github.com/juicyfx/now-examples/tree/master/php-framework-nette/)
- [Framework - Slim](https://github.com/juicyfx/now-examples/tree/master/php-framework-slim/)
- [Framework - Symfony - Microservice](https://github.com/juicyfx/now-examples/tree/master/php-framework-symfony-microservice/)
- [Framework - Phalcon](https://github.com/juicyfx/now-examples/tree/master/php-framework-phalcon/)

Browse [more examples](https://github.com/juicyfx/now-examples). 👀

## 📜 Resources

- [2019/10/23 - Code Examples](https://github.com/trainit/2019-10-hubbr-zeit)
- [2019/10/19 - ZEIT - Deploy Serverless Microservices Right Now](https://slides.com/f3l1x/2019-10-19-zeit-deploy-serverless-microservices-right-now-vol2)
- [2019/08/23 - Code Examples](https://github.com/trainit/2019-08-serverless-zeit-now)
- [2019/07/07 - Bleeding Edge PHP on ZEIT Now](https://dev.to/nx1/bleeding-edge-php-on-zeit-now-565g)
- [2019/06/06 - Code Examples](https://github.com/trainit/2019-06-zeit-now)
- [2019/06/05 - ZEIT - Deploy Serverless Microservices Right Now](https://slides.com/f3l1x/2019-06-05-zeit-deploy-serverless-microservices-right-now) ([VIDEO](https://www.youtube.com/watch?v=IwhEGNDx3aE))

## 🚧 Roadmap

- next-gen PHP runtime ✅
- Composer
  - config.composer: true ✅
  - composer.json detection ✅
- zero config ✅
- `now dev` ✅
- rewrite to typescript ✅
- setup CI ✅
- configure php.ini 🚧
  - using `builds.config` ✅
  - using `build.env` 🚧
- PHP versions
  - 7.4 ✅ (used)
  - 7.3 ✅
  - 7.2 ✅

**Help wanted**

- create many examples (majority frameworks and other use-cases)

## 👨🏻‍💻CHANGELOG

Show me [CHANGELOG](./CHANGELOG.md)

## 📝 License

Copyright © 2019 [f3l1x](https://github.com/f3l1x).
This project is [MIT](LICENSE) licensed.
