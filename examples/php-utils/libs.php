<?php

$path = getenv('LD_LIBRARY_PATH') ?? '';
$paths = explode(':', $path);

foreach ($paths as $path) {
    if (!is_dir($path)) {
        echo "No folder: $path<br>";
    } else {
        $files = scandir($path);
        echo "Scan folder: $path<br>";
        array_map(function($file) {
            echo "- $file <br>";
        }, $files);
    }
    echo "<hr>";
}
