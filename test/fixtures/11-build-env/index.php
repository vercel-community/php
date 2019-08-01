<?php
/*
 * What is the goal of this test?
 *
 * It should verify that build environment variables are passed along correctly.
 * So in this case the variable `COMPOSER` is set to composer.json file with a non-standard value
 * (`composer-test.json` in this case)
 *
 * An empty composer.json file is added to trigger composer installation. Since it is empty, the test fails when
 * the `COMPOSER` variable is not set.
 */

header('content-type: text/plain');

require_once('vendor/autoload.php');

var_dump(interface_exists('Psr\Log\LoggerInterface'));
