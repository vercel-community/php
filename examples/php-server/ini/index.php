<?php

foreach (ini_get_all() as $name => $group) {
    echo "<h1>$name</h1>";
    foreach ($group as $k => $v) {
        echo "$k => $v<br>";
    }
}
