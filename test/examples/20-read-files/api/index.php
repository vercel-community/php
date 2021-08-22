<?php

header('Content-Type: application/json');

echo file_get_contents(__DIR__ . '/../src/users.json');
