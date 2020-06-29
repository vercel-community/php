const assert = require('assert');

module.exports = async ({ deploymentUrl, fetch }) => {
  const resp = await fetch(`https://${deploymentUrl}/index.php`);
  assert.equal(
    await resp.text(),
    'Core,date,libxml,openssl,pcre,zlib,filter,hash,pcntl,readline,Reflection,SPL,session,standard,cli_server,bcmath,bz2,calendar,ctype,curl,dom,mbstring,fileinfo,ftp,gd,gettext,iconv,imap,intl,json,exif,mysqlnd,PDO,pgsql,Phar,SimpleXML,soap,sockets,sodium,sqlite3,tokenizer,xml,xmlwriter,xsl,mysqli,pdo_mysql,pdo_pgsql,pdo_sqlite,xmlreader,xmlrpc,apcu,ds,phalcon,ssh2,swoole,Zend OPcache'
  );
};
