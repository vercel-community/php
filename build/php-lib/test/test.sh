mkdir -p /opt/now/modules

cp /usr/bin/php73 /opt/now/php
cp /opt/remi/php73/root/usr/sbin/php-fpm /opt/now/php-fpm
cp /opt/remi/php73/root/usr/lib64/php/modules/*.so /opt/now/modules/

rm -rf /usr/bin/php73
rm -rf /opt/remi/php73/root/usr/sbin/php-fpm
rm -rf /opt/remi/php73/root/usr/lib64/php/
rm -rf /etc/opt/remi/php73/php.d

./php -v
./php -m
./php -c php.ini test.php

echo "if you see 'can't connect to local mysql' - it is good - mysql library is found and used"
echo "if you see 'call to undefined function mysqli_connect' - it is bad - something went wrong"
