<h1 align=center>PHP Runtime for <a href="https://vercel.com">Vercel</h1>

<p align=center>
  Enjoyable & powerful 🐘 PHP Runtime (<a href="https://php.vercel.app">php.vercel.app</a>) for Vercel platform.
</p>

<p align=center>
  <a href="https://www.npmjs.com/package/vercel-php"><img src="https://badgen.net/npm/v/vercel-php"></a>
  <a href="https://www.npmjs.com/package/vercel-php"><img src="https://badgen.net/npm/dt/vercel-php"></a>
  <a href="https://github.com/juicyfx/vercel-php/actions"><img src="https://badgen.net/github/checks/juicyfx/vercel-php"></a>
	<a href="https://bit.ly/f3l1xdis"><img src="https://badgen.net/badge/support/discussions/yellow"></a>
	<a href="http://bit.ly/f3l1xsponsor"><img src="https://badgen.net/badge/sponsor/donations/F96854"></a>
</p>

<p align=center>
  <a href="https://github.com/nette"><img src="https://github.com/nette.png" width="128"></a>
  <a href="https://github.com/symfony"><img src="https://github.com/symfony.png" width="128"></a>
  <a href="https://github.com/illuminate"><img src="https://github.com/illuminate.png" width="128"></a>
  <a href="https://github.com/slimphp"><img src="https://github.com/slimphp.png" width="128"></a>
  <a href="https://github.com/phalcon"><img src="https://github.com/phalcon.png" width="128"></a>
</p>

<p align=center><strong>🏋️‍♀️ It works with these frameworks and tools. Discover more at <a href="https://github.com/juicyfx/vercel-examples">examples</a>.</strong></p>

<p align=center>
Made with  ❤️  by <a href="https://github.com/f3l1x">@f3l1x</a> (<a href="https://f3l1x.io">f3l1x.io</a>) • 🐦 <a href="https://twitter.com/xf3l1x">@xf3l1x</a>
</p>

-----

## 😎 Getting Started

Let's picture you want to deploy your awesome microproject written in PHP and you don't know where. You have found [Vercel](https://vercel.com) it's awesome, but for static sites. Not anymore! I would like to introduce you your new best friend `vercel-php`, PHP runtime for Vercel platform.

Most simple example project is this one, using following project structure.

```sh
project
├── api
│   └── index.php
└── vercel.json
```

First file `api/index.php` is entrypoint of our application. It should be placed in **api** folder, it's very standard location for Vercel.

```php
<?php
phpinfo();
```

Second file `vercel.json` is pure gold here. Setup your project with configuration like this and voila. That's all.

```json
{
  "functions": {
    "api/*.php": {
      "runtime": "vercel-php@0.7.3"
    }
  }
}
```

Last thing you have to do is call `vercel`. If you are more interested take a look at features and usage.

```
# Install it globally
npm i -g vercel

# Log in
vercel login

# Let's fly
vercel
```

Are you ready to deploy your first PHP project to Vercel? Click & Go!

<a href="https://vercel.com/new/clone?repository-url=https://github.com/juicyfx/vercel-examples/tree/master/php"><img src="https://vercel.com/button"></a>

## 🤗 Features

- **Architecture**: PHP development server (🚀 fast enough)
- **PHP version**: 8.3 (https://example-php-8-3.vercel.app)
- **Extensions**: apcu, bcmath, brotli, bz2, calendar, Core, ctype, curl, date, dom, ds, exif, fileinfo, filter, ftp, geoip, gettext, hash, iconv, igbinary, imap, intl, json, libxml, lua, mbstring, mongodb, msgpack, mysqli, mysqlnd, openssl, pcntl, pcre, PDO, pdo_mysql, pdo_pgsql, pdo_sqlite, pgsql, phalcon, Phar, protobuf, readline, redis, Reflection, runkit7, session, SimpleXML, soap, sockets, sodium, SPL, sqlite3, standard, swoole, timecop, tokenizer, uuid, xml, xmlreader, xmlrpc, xmlwriter, xsl, Zend OPcache, zlib, zip
- **Speed**: cold ~250ms / warm ~5ms
- **Memory**: ~90mb
- **Frameworks**: Nette, Symfony, Lumen, Slim, Phalcon

> List of all installable extensions is on this page https://blog.remirepo.net/pages/PECL-extensions-RPM-status.

## 💯 Versions

- `vercel-php@0.7.3` - Node autodetect / PHP 8.3.x (https://example-php-8-3.vercel.app)
- `vercel-php@0.6.2` - Node autodetect / PHP 8.2.x (https://example-php-8-2.vercel.app)
- `vercel-php@0.5.5` - Node autodetect / PHP 8.1.x (https://example-php-8-1.vercel.app)
- `vercel-php@0.4.4` - Node autodetect / PHP 8.0.x (https://example-php-8-0.vercel.app)
- `vercel-php@0.3.6` - Node autodetect / PHP 7.4.x (https://example-php-7-4.vercel.app)

## ⚙️  Usage

Before you can start using this runtime, you should learn about Vercel and [how runtimes](https://vercel.com/docs/runtimes?query=runtime#official-runtimes) works. Take a look at blogpost about [`Serverless Functions`](https://vercel.com/blog/customizing-serverless-functions).

You should define `functions` property in `vercel.json` and list PHP files directly or using wildcard (*).
If you need to route everything to index, use `routes` property.

```json
{
  "functions": {
    "api/*.php": {
      "runtime": "vercel-php@0.7.3"
    }
  },
  "routes": [
    { "src": "/(.*)",  "dest": "/api/index.php" }
  ]
}
```

Do you have more questions (❓)? Let's move to [FAQ](#%EF%B8%8F-faq).

## 👨‍💻 `vercel dev`

For running `vercel dev` properly, you need to have PHP installed on your computer, [learn more](errors/now-dev-no-local-php.md).
But it's PHP and as you know PHP has built-in development server. It works out of box.

```
php -S localhost:8000 api/index.php
```

## 👀 Demo

- official - https://php.vercel.app/
- phpinfo - https://phpshow.vercel.app/
- extensions - https://phpshow.vercel.app/ext/
- ini - https://phpshow.vercel.app/ini/
- JSON API - https://phpshow.vercel.app/api/users.php
- test - https://phpshow.vercel.app/test.php

![PHP](https://api.microlink.io?url=https://phpshow.vercel.app&screenshot&embed=screenshot.url)

## 🎯Examples

- [PHP - fast & simple](https://github.com/juicyfx/vercel-examples/tree/master/php/)
- [Composer - install dependencies](https://github.com/juicyfx/vercel-examples/tree/master/php-composer/)
- [Framework - Laravel](https://github.com/juicyfx/vercel-examples/blob/master/php-laravel)
- [Framework - Lumen](https://github.com/juicyfx/vercel-examples/blob/master/php-lumen)
- [Framework - Nette](https://github.com/juicyfx/vercel-examples/blob/master/php-nette-tracy)
- [Framework - Phalcon](https://github.com/juicyfx/vercel-examples/blob/master/php-phalcon)
- [Framework - Slim](https://github.com/juicyfx/vercel-examples/blob/master/php-slim)
- [Framework - Symfony - Microservice](https://github.com/juicyfx/vercel-examples/blob/master/php-symfony-microservice)

Browse [more examples](https://github.com/juicyfx/vercel-examples). 👀

## 📜 Resources

- [2019/10/23 - Code Examples](https://github.com/trainit/2019-10-hubbr-zeit)
- [2019/10/19 - ZEIT - Deploy Serverless Microservices Right Now](https://slides.com/f3l1x/2019-10-19-zeit-deploy-serverless-microservices-right-now-vol2)
- [2019/08/23 - Code Examples](https://github.com/trainit/2019-08-serverless-zeit-now)
- [2019/07/07 - Bleeding Edge PHP on ZEIT Now](https://dev.to/nx1/bleeding-edge-php-on-zeit-now-565g)
- [2019/06/06 - Code Examples](https://github.com/trainit/2019-06-zeit-now)
- [2019/06/05 - ZEIT - Deploy Serverless Microservices Right Now](https://slides.com/f3l1x/2019-06-05-zeit-deploy-serverless-microservices-right-now) ([VIDEO](https://www.youtube.com/watch?v=IwhEGNDx3aE))

## 🚧 Roadmap

See [roadmap issue](https://github.com/juicyfx/vercel-php/issues/3). Help wanted.

## ⁉️ FAQ

<details>
  <summary>1. How to use more then one endpoint (index.php)?</summary>

```sh
project
├── api
│   ├── index.php
│   ├── users.php
│   └── books.php
└── vercel.json
```

```
{
  "functions": {
    "api/*.php": {
      "runtime": "vercel-php@0.7.3"
    },

    // Can be list also directly

    "api/index.php": {
      "runtime": "vercel-php@0.7.3"
    },
    "api/users.php": {
      "runtime": "vercel-php@0.7.3"
    },
    "api/books.php": {
      "runtime": "vercel-php@0.7.3"
    }
  }
}
```

</details>

<details>
  <summary>2. How to route everything to index?</summary>

```json
{
  "functions": {
    "api/index.php": {
      "runtime": "vercel-php@0.7.3"
    }
  },
  "routes": [
    { "src": "/(.*)",  "dest": "/api/index.php" }
  ]
}
```

</details>

<details>
  <summary>3. How to update memory limit?</summary>

Additional function properties are `memory`, `maxDuration`. Learn more about [functions](https://vercel.com/docs/configuration#project/functions).

```json
{
  "functions": {
    "api/*.php": {
      "runtime": "vercel-php@0.7.3",
      "memory": 3008,
      "maxDuration": 60
    }
  }
}
```

</details>

<details>
  <summary>4. How to use it with <a href="https://getcomposer.org/">Composer</a>?</summary>

Yes, [Composer](https://getcomposer.org/) is fully supported.

```sh
project
├── api
│   └── index.php
├── composer.json
└── vercel.json
```

```json
{
  "functions": {
    "api/*.php": {
      "runtime": "vercel-php@0.7.3"
    }
  }
}
```

```json
{
  "require": {
    "php": "^8.1",
    "tracy/tracy": "^2.0"
  }
}
```

It's also good thing to create `.vercelignore` file and put `/vendor` folder to this file. It will not upload
`/vendor` folder to Vercel platform.

</details>

<details>
  <summary>5. How to override <a href="https://www.php.net/manual/en/ini.list.php">php.ini</a> / <a href="https://www.php.net/manual/en/configuration.file.php">php configuration</a> ?</summary>

Yes, you can override php configuration. Take a look at [default configuration](https://phpshow.vercel.app/) at first.
Create a new file `api/php.ini` and place there your configuration. Don't worry, this particulary file will be
removed during building phase on Vercel.

```sh
project
├── api
│   ├── index.php
│   └── php.ini
└── vercel.json
```

```json
{
  "functions": {
    "api/*.php": {
      "runtime": "vercel-php@0.7.3"
    }
  }
}
```

```json
# Disable some functions
disable_functions = "exec, system"

# Update memory limit
memory_limit=1024M
```

</details>

<details>
  <summary>6. How to exclude some files or folders ?</summary>

Runtimes support excluding some files or folders, [take a look at doc](https://vercel.com/docs/configuration?query=excludeFiles#project/functions).

```json
{
  "functions": {
  "api/**/*.php": {
    "runtime": "vercel-php@0.7.3",
    "excludeFiles": "{foo/**,bar/config/*.yaml}",
  }
}
```

If you want to exclude files before uploading them to Vercel, use `.vercelignore` file.

</details>

<details>
  <summary>7. How to call composer script(s) ?</summary>

Calling composer scripts during build phase on Vercel is supported via script named `vercel`. You can easilly call php, npm or node.

```json
{
  "require": { ... },
  "require-dev": { ... },
  "scripts": {
    "vercel": [
      "@php -v",
      "npm -v"
    ]
  }
}
```

Files created during `composer run vercel` script can be used (require/include) in your PHP lambdas, but can't be accessed from browser (like assets). If you still want to access them, create fake `assets.php` lambda and require them. [Example of PHP satis](https://github.com/juicyfx/vercel-examples/tree/master/php-satis).

</details>

<details>
  <summary>8. How to include some files of folders?</summary>

If you are looking for [`config.includeFiles`](https://vercel.com/docs/configuration?query=includeFiles#project/functions) in runtime, unfortunately you can't include extra files.
All files in root folder are uploaded to Vercel, use `.vercelignore` to exclude them before upload.

</details>

<details>
  <summary>9. How to develop locally?</summary>

I think the best way at this moment is use [PHP Development Server](https://www.php.net/manual/en/features.commandline.webserver.php).

```
php -S localhost:8000 api/index.php
```

</details>

## 👨🏻‍💻CHANGELOG

Show me [CHANGELOG](./CHANGELOG.md)

## 🧙Contribution

1. Clone this repository.
   - `git clone git@github.com:juicyfx/vercel-php.git`
2. Install NPM dependencies
   - `make install`
3. Make your changes
4. Run TypeScript compiler
   - `make build`
5. Run tests
   - `make test`
6. Create a PR

## 📝 License

Copyright © 2019 [f3l1x](https://github.com/f3l1x).
This project is [MIT](LICENSE) licensed.
