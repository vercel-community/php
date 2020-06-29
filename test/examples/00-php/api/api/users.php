<?php

$data = [
    ['id' => 1, 'name' => 'f3l1x'],
    ['id' => 2, 'name' => 'chemix'],
    ['id' => 3, 'name' => 'dg'],
    ['id' => 4, 'name' => 'milo'],
    ['id' => 5, 'name' => 'matej21'],
    ['id' => 6, 'name' => 'merxes'],
];

header('Content-Type: application/json');

echo json_encode($data);
