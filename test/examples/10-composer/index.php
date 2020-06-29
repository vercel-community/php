<?php
header('content-type: text/plain');

require_once('vendor/autoload.php');

var_dump(interface_exists('Psr\Log\LoggerInterface'));
