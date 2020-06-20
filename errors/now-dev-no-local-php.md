# It looks like you don't have PHP on your machine.

**Why This Error Occurred**

You ran `now dev` on a machine where PHP is not installed.
For the time being, this runtime requires a local PHP installation to run the runtime locally.

**Possible Ways to Fix It**

1. Install PHP to your computer

**OSX**

```
brew install php@7.4
```

**Ubuntu**

```
apt-get -y install apt-transport-https lsb-release ca-certificates
wget -O /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
sh -c 'echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/php.list'
apt-get update
apt-get install php7.4-cli php7.4-cgi php7.4-json php7.4-curl php7.4-mbstring
```

**Fedora**

```
yum install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
yum install https://rpms.remirepo.net/enterprise/remi-release-7.rpm
yum install yum-utils
yum-config-manager --enable remi-php74
yum update
yum install php74-cli php74-cgi php74-json php74-curl php74-mbstring
```

2. Start PHP built-in Development Server

```sh
php -S localhost:8000 api/index.php
```

**Check that php is in the path**

If you do have installed PHP but still get this error, check that PHP executable is added to the PATH environment variable.
