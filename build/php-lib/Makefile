DIST_PHP=73
DIST_PATH=./../../packages/php-lib-${DIST_PHP}
DIST_PHP_PATH=${DIST_PATH}/native/php
DIST_PHP_MODULES_PATH=${DIST_PHP_PATH}/modules
DIST_LIB_PATH=${DIST_PATH}/native/lib

DOCKER_IMAGE=juicyfx/now-php-${DIST_PHP}
DOCKER_CONTAINER=juicyfx-now-php-${DIST_PHP}

.PHONY: build72 build73 build74 dist72 dist73 dist74

# ######################
# Building Docker images
# ######################

build-all: build72 build73 build74

build72:
	$(MAKE) __build DIST_PHP=72

build73:
	$(MAKE) __build DIST_PHP=73

build74:
	$(MAKE) __build DIST_PHP=74

__build:
	docker build -t ${DOCKER_IMAGE} -f ./Dockerfile.php${DIST_PHP} .

# #################################################
# Separate PHP bins + shared libs from Docker image
# #################################################

dist72:
	$(MAKE) __distribution_v1 DIST_PHP=72

dist73:
	$(MAKE) __distribution_v1 DIST_PHP=73

dist74:
	$(MAKE) __distribution_v2 DIST_PHP=74

dist-all: dist72 dist73 dist74

__distribution_v1:
	$(MAKE) __build DIST_PHP=${DIST_PHP}

	# Cleanup distribution folder
	rm -rf ${DIST_PHP_PATH}
	rm -rf ${DIST_LIB_PATH}
	mkdir -p ${DIST_PHP_PATH}
	mkdir -p ${DIST_LIB_PATH}
	mkdir -p ${DIST_PHP_MODULES_PATH}

	# Remove old PHP container
	docker rm --force ${DOCKER_CONTAINER} || true
	# Run new one PHP container
	docker run -it -d --name ${DOCKER_CONTAINER} ${DOCKER_IMAGE} /bin/bash

	# Copy composer, php, php-cgi, php-fpm binaries
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/bin/composer > ${DIST_PHP_PATH}/composer
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/bin/php > ${DIST_PHP_PATH}/php
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/bin/php-cgi > ${DIST_PHP_PATH}/php-cgi
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/sbin/php-fpm > ${DIST_PHP_PATH}/php-fpm

	# Make these binaries executable
	chmod +x ${DIST_PHP_PATH}/composer
	chmod +x ${DIST_PHP_PATH}/php
	chmod +x ${DIST_PHP_PATH}/php-cgi
	chmod +x ${DIST_PHP_PATH}/php-fpm

	# Copy php.ini & php-fpm.ini
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/now/php.ini > ${DIST_PHP_PATH}/php.ini
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/now/php-fpm.ini > ${DIST_PHP_PATH}/php-fpm.ini

	# Copy all compiled extensions
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/apcu.so > ${DIST_PHP_MODULES_PATH}/apcu.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/bcmath.so > ${DIST_PHP_MODULES_PATH}/bcmath.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/bz2.so > ${DIST_PHP_MODULES_PATH}/bz2.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/calendar.so > ${DIST_PHP_MODULES_PATH}/calendar.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/ctype.so > ${DIST_PHP_MODULES_PATH}/ctype.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/curl.so > ${DIST_PHP_MODULES_PATH}/curl.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/dom.so > ${DIST_PHP_MODULES_PATH}/dom.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/ds.so > ${DIST_PHP_MODULES_PATH}/ds.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/exif.so > ${DIST_PHP_MODULES_PATH}/exif.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/fileinfo.so > ${DIST_PHP_MODULES_PATH}/fileinfo.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/ftp.so > ${DIST_PHP_MODULES_PATH}/ftp.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/gd.so > ${DIST_PHP_MODULES_PATH}/gd.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/gettext.so > ${DIST_PHP_MODULES_PATH}/gettext.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/iconv.so > ${DIST_PHP_MODULES_PATH}/iconv.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/imap.so > ${DIST_PHP_MODULES_PATH}/imap.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/intl.so > ${DIST_PHP_MODULES_PATH}/intl.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/json.so > ${DIST_PHP_MODULES_PATH}/json.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/mbstring.so > ${DIST_PHP_MODULES_PATH}/mbstring.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/mysqli.so > ${DIST_PHP_MODULES_PATH}/mysqli.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/mysqlnd.so > ${DIST_PHP_MODULES_PATH}/mysqlnd.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/opcache.so > ${DIST_PHP_MODULES_PATH}/opcache.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pdo.so > ${DIST_PHP_MODULES_PATH}/pdo.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pdo_mysql.so > ${DIST_PHP_MODULES_PATH}/pdo_mysql.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pdo_pgsql.so > ${DIST_PHP_MODULES_PATH}/pdo_pgsql.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pdo_sqlite.so > ${DIST_PHP_MODULES_PATH}/pdo_sqlite.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pgsql.so > ${DIST_PHP_MODULES_PATH}/pgsql.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/phar.so > ${DIST_PHP_MODULES_PATH}/phar.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/simplexml.so > ${DIST_PHP_MODULES_PATH}/simplexml.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/soap.so > ${DIST_PHP_MODULES_PATH}/soap.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/sockets.so > ${DIST_PHP_MODULES_PATH}/sockets.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/sodium.so > ${DIST_PHP_MODULES_PATH}/sodium.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/sqlite3.so > ${DIST_PHP_MODULES_PATH}/sqlite3.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/ssh2.so > ${DIST_PHP_MODULES_PATH}/ssh2.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/swoole.so > ${DIST_PHP_MODULES_PATH}/swoole.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/tokenizer.so > ${DIST_PHP_MODULES_PATH}/tokenizer.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xml.so > ${DIST_PHP_MODULES_PATH}/xml.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xmlreader.so > ${DIST_PHP_MODULES_PATH}/xmlreader.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xmlrpc.so > ${DIST_PHP_MODULES_PATH}/xmlrpc.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xmlwriter.so > ${DIST_PHP_MODULES_PATH}/xmlwriter.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xsl.so > ${DIST_PHP_MODULES_PATH}/xsl.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/phalcon.so > ${DIST_PHP_PATH}/modules/phalcon.so;

	# Copy static libraries. Needed by the extensions above.
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libXpm.so.4 > ${DIST_LIB_PATH}/libXpm.so.4
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libargon2.so.0 > ${DIST_LIB_PATH}/libargon2.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libc-client.so.2007 > ${DIST_LIB_PATH}/libc-client.so.2007
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libedit.so.0 > ${DIST_LIB_PATH}/libedit.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libgd.so.3 > ${DIST_LIB_PATH}/libgd.so.3
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libonig.so.5 > ${DIST_LIB_PATH}/libonig.so.5
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libpq.so.5 > ${DIST_LIB_PATH}/libpq.so.5
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libsodium.so.23 > ${DIST_LIB_PATH}/libsodium.so.23
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libtiff.so.3 > ${DIST_LIB_PATH}/libtiff.so.3
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libwebp.so.5 > ${DIST_LIB_PATH}/libwebp.so.5

	# Remove temporary PHP container
	docker rm --force ${DOCKER_CONTAINER} || true

__distribution_v2:
	$(MAKE) __build DIST_PHP=${DIST_PHP}

	# Cleanup distribution folder
	rm -rf ${DIST_PHP_PATH}
	rm -rf ${DIST_LIB_PATH}
	mkdir -p ${DIST_PHP_PATH}
	mkdir -p ${DIST_LIB_PATH}
	mkdir -p ${DIST_PHP_MODULES_PATH}

	# Remove old PHP container
	docker rm --force ${DOCKER_CONTAINER} || true
	# Run new one PHP container
	docker run -it -d --name ${DOCKER_CONTAINER} ${DOCKER_IMAGE} /bin/bash

	# Copy composer, php, php-cgi, php-fpm binaries
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/bin/composer > ${DIST_PHP_PATH}/composer
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/bin/php > ${DIST_PHP_PATH}/php
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/bin/php-cgi > ${DIST_PHP_PATH}/php-cgi
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/sbin/php-fpm > ${DIST_PHP_PATH}/php-fpm

	# Make these binaries executable
	chmod +x ${DIST_PHP_PATH}/composer
	chmod +x ${DIST_PHP_PATH}/php
	chmod +x ${DIST_PHP_PATH}/php-cgi
	chmod +x ${DIST_PHP_PATH}/php-fpm

	# Copy php.ini & php-fpm.ini
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/now/php.ini > ${DIST_PHP_PATH}/php.ini
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/now/php-fpm.ini > ${DIST_PHP_PATH}/php-fpm.ini

	# Copy all compiled extensions
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/apcu.so > ${DIST_PHP_MODULES_PATH}/apcu.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/bcmath.so > ${DIST_PHP_MODULES_PATH}/bcmath.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/bz2.so > ${DIST_PHP_MODULES_PATH}/bz2.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/calendar.so > ${DIST_PHP_MODULES_PATH}/calendar.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/ctype.so > ${DIST_PHP_MODULES_PATH}/ctype.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/curl.so > ${DIST_PHP_MODULES_PATH}/curl.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/dom.so > ${DIST_PHP_MODULES_PATH}/dom.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/ds.so > ${DIST_PHP_MODULES_PATH}/ds.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/exif.so > ${DIST_PHP_MODULES_PATH}/exif.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/fileinfo.so > ${DIST_PHP_MODULES_PATH}/fileinfo.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/ftp.so > ${DIST_PHP_MODULES_PATH}/ftp.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/gd.so > ${DIST_PHP_MODULES_PATH}/gd.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/gettext.so > ${DIST_PHP_MODULES_PATH}/gettext.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/iconv.so > ${DIST_PHP_MODULES_PATH}/iconv.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/imap.so > ${DIST_PHP_MODULES_PATH}/imap.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/intl.so > ${DIST_PHP_MODULES_PATH}/intl.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/json.so > ${DIST_PHP_MODULES_PATH}/json.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/mbstring.so > ${DIST_PHP_MODULES_PATH}/mbstring.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/mysqli.so > ${DIST_PHP_MODULES_PATH}/mysqli.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/mysqlnd.so > ${DIST_PHP_MODULES_PATH}/mysqlnd.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/opcache.so > ${DIST_PHP_MODULES_PATH}/opcache.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pdo.so > ${DIST_PHP_MODULES_PATH}/pdo.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pdo_mysql.so > ${DIST_PHP_MODULES_PATH}/pdo_mysql.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pdo_pgsql.so > ${DIST_PHP_MODULES_PATH}/pdo_pgsql.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pdo_sqlite.so > ${DIST_PHP_MODULES_PATH}/pdo_sqlite.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/pgsql.so > ${DIST_PHP_MODULES_PATH}/pgsql.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/phar.so > ${DIST_PHP_MODULES_PATH}/phar.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/simplexml.so > ${DIST_PHP_MODULES_PATH}/simplexml.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/soap.so > ${DIST_PHP_MODULES_PATH}/soap.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/sockets.so > ${DIST_PHP_MODULES_PATH}/sockets.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/sodium.so > ${DIST_PHP_MODULES_PATH}/sodium.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/sqlite3.so > ${DIST_PHP_MODULES_PATH}/sqlite3.so
	#docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/ssh2.so > ${DIST_PHP_MODULES_PATH}/ssh2.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/swoole.so > ${DIST_PHP_MODULES_PATH}/swoole.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/tokenizer.so > ${DIST_PHP_MODULES_PATH}/tokenizer.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xml.so > ${DIST_PHP_MODULES_PATH}/xml.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xmlreader.so > ${DIST_PHP_MODULES_PATH}/xmlreader.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xmlrpc.so > ${DIST_PHP_MODULES_PATH}/xmlrpc.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xmlwriter.so > ${DIST_PHP_MODULES_PATH}/xmlwriter.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/xsl.so > ${DIST_PHP_MODULES_PATH}/xsl.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /opt/remi/php${DIST_PHP}/root/usr/lib64/php/modules/phalcon.so > ${DIST_PHP_PATH}/modules/phalcon.so;

	# Copy static libraries. Needed by the extensions above.
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libaudit.so.1 > ${DIST_LIB_PATH}/libaudit.so.1
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libbz2.so.1 > ${DIST_LIB_PATH}/libbz2.so.1
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libcap-ng.so.0 > ${DIST_LIB_PATH}/libcap-ng.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libc-client.so.2007 > ${DIST_LIB_PATH}/libc-client.so.2007
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libcrypt.so.1 > ${DIST_LIB_PATH}/libcrypt.so.1
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libcurl.so.4 > ${DIST_LIB_PATH}/libcurl.so.4
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libedit.so.0 > ${DIST_LIB_PATH}/libedit.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libexpat.so.1 > ${DIST_LIB_PATH}/libexpat.so.1
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libexslt.so.0 > ${DIST_LIB_PATH}/libexslt.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libfontconfig.so.1 > ${DIST_LIB_PATH}/libfontconfig.so.1
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libfreetype.so.6 > ${DIST_LIB_PATH}/libfreetype.so.6
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libgcrypt.so.11 > ${DIST_LIB_PATH}/libgcrypt.so.11
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libgd.so.3 > ${DIST_LIB_PATH}/libgd.so.3
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libgpg-error.so.0 > ${DIST_LIB_PATH}/libgpg-error.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libicudata.so.62 > ${DIST_LIB_PATH}/libicudata.so.62
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libicui18n.so.62 > ${DIST_LIB_PATH}/libicui18n.so.62
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libicuio.so.62 > ${DIST_LIB_PATH}/libicuio.so.62
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libicuuc.so.62 > ${DIST_LIB_PATH}/libicuuc.so.62
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libidn2.so.0 > ${DIST_LIB_PATH}/libidn2.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libjbig.so.2.0 > ${DIST_LIB_PATH}/libjbig.so.2.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libjpeg.so.62 > ${DIST_LIB_PATH}/libjpeg.so.62
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/liblber-2.4.so.2 > ${DIST_LIB_PATH}/liblber-2.4.so.2
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libldap-2.4.so.2 > ${DIST_LIB_PATH}/libldap-2.4.so.2
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libldap_r-2.4.so.2 > ${DIST_LIB_PATH}/libldap_r-2.4.so.2
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/liblzma.so.5 > ${DIST_LIB_PATH}/liblzma.so.5
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libncurses.so.5 > ${DIST_LIB_PATH}/libncurses.so.5
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libnghttp2.so.14 > ${DIST_LIB_PATH}/libnghttp2.so.14
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libnss3.so > ${DIST_LIB_PATH}/libnss3.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libonig.so.5 > ${DIST_LIB_PATH}/libonig.so.5
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libpam.so.0 > ${DIST_LIB_PATH}/libpam.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libpng15.so.15 > ${DIST_LIB_PATH}/libpng15.so.15
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libpq.so.5 > ${DIST_LIB_PATH}/libpq.so.5
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libsasl2.so.3 > ${DIST_LIB_PATH}/libsasl2.so.3
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libsmime3.so > ${DIST_LIB_PATH}/libsmime3.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libsodium.so.23 > ${DIST_LIB_PATH}/libsodium.so.23
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libsqlite3.so.0 > ${DIST_LIB_PATH}/libsqlite3.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libssh2.so.1 > ${DIST_LIB_PATH}/libssh2.so.1
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libssl3.so > ${DIST_LIB_PATH}/libssl3.so
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libtiff.so.5 > ${DIST_LIB_PATH}/libtiff.so.5
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libtinfo.so.5 > ${DIST_LIB_PATH}/libtinfo.so.5
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libunistring.so.0 > ${DIST_LIB_PATH}/libunistring.so.0
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libwebp.so.7 > ${DIST_LIB_PATH}/libwebp.so.7
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libX11.so.6 > ${DIST_LIB_PATH}/libX11.so.6
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libXau.so.6 > ${DIST_LIB_PATH}/libXau.so.6
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libxcb.so.1 > ${DIST_LIB_PATH}/libxcb.so.1
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libxml2.so.2 > ${DIST_LIB_PATH}/libxml2.so.2
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libXpm.so.4 > ${DIST_LIB_PATH}/libXpm.so.4
	docker exec ${DOCKER_CONTAINER} /bin/cat /usr/lib64/libxslt.so.1 > ${DIST_LIB_PATH}/libxslt.so.1

	# Remove temporary PHP container
	docker rm --force ${DOCKER_CONTAINER} || true

# #################################################
# Separate PHP bins + shared libs from Docker image
# #################################################

publish72:
	cd ../../packages/php-lib-72/ && \
	npm publish --access public --tag latest

publish72-canary:
	cd ../../packages/php-lib-72/ && \
	npm version prerelease && \
	npm publish --access public --tag canary

publish73:
	cd ../../packages/php-lib-73/ && \
	npm publish --access public --tag latest

publish73-canary:
	cd ../../packages/php-lib-73/ && \
	npm version prerelease && \
	npm publish --access public --tag canary

publish74:
	cd ../../packages/php-lib-74/ && \
	npm publish --access public --tag latest

publish74-canary:
	cd ../../packages/php-lib-74/ && \
	npm version prerelease && \
	npm publish --access public --tag canary

publish-all: publish72 publish73 publish74

publish-all-canary: publish72-canary publish73-canary publish74-canary

# #######################################
# Testing isolated PHP libs + shared libs
# #######################################

test-runtime:
	docker run \
		-it \
		--rm \
		-v $(CURDIR)/../../packages/php-lib-74/native/php:/opt/now/ \
		-v $(CURDIR)/../../packages/php-lib-74/native/lib:/var/task/lib/ \
		-w /opt/now \
		--entrypoint /bin/bash \
		lambci/lambda:nodejs12.x

test-libs:
	docker run \
		-it \
		--rm \
		-v $(CURDIR)/../../packages/php-lib-74/native/php:/opt/now/ \
		-v $(CURDIR)/../../packages/php-lib-74/native/lib:/var/task/lib/ \
		-v $(CURDIR):/srv \
		-w /srv \
		--entrypoint /bin/bash \
		lambci/lambda:nodejs12.x
