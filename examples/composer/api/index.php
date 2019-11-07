<?php

require_once __DIR__ . '/../vendor/autoload.php';

Tracy\Debugger::enable(Tracy\Debugger::DEVELOPMENT);

throw new RuntimeException('Hello Tracy!');
