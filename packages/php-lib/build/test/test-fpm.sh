mkdir -p /opt/now/modules

cp /usr/bin/php73 /opt/now/php
cp /opt/remi/php73/root/usr/sbin/php-fpm /opt/now/php-fpm
cp /opt/remi/php73/root/usr/lib64/php/modules/*.so /opt/now/modules/

rm -rf /usr/bin/php73
rm -rf /opt/remi/php73/root/usr/sbin/php-fpm
rm -rf /opt/remi/php73/root/usr/lib64/php/
rm -rf /etc/opt/remi/php73/php.d

./php-fpm -c php.ini --fpm-config php-fpm.ini --nodaemonize
