<?php

$pattern = $_GET['pattern'] ?? '*.*';

foreach (glob($pattern) as $filename) {
    echo "$filename size " . filesize($filename) . "\n";
}
