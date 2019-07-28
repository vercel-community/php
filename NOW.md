# NOW

## How to `now dev`?

### Install PHP to your computer

**OSX**

```
brew install php@7.3
```

**Ubuntu**

```
apt-get -y install apt-transport-https lsb-release ca-certificates
wget -O /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
sh -c 'echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list'
apt-get update
apt-get install php7.3-cli php7.3-cgi php7.3-json php7.3-curl php7.3-mbstring
```

**Fedora**

```
yum install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
yum install https://rpms.remirepo.net/enterprise/remi-release-7.rpm
yum install yum-utils
yum-config-manager --enable remi-php73
yum update
yum install php73-cli php73-cgi php73-json php73-curl php73-mbstring
```

### Setup minimal project

Create files `index.php` and `now.json`.

```php
<?php
phpinfo;
```

```json
{
    "version": 2,
    "builds": [
      { "src": "index.php", "use": "now-php@canary" }
    ]
  }
```
