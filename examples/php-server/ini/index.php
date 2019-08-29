<h1>php.ini</h1>

<table>
<thead>
    <tr>
        <th>option</th>
        <th>global_value</th>
        <th>local_value</th>
        <th>access</th>
    </tr>
</thead>
<tbody>
<?php
foreach (ini_get_all() as $name => $group) {
    echo "<tr>";
    echo sprintf('<td>%s</td>', $name);
    echo sprintf('<td>%s</td>', $group['global_value']);
    echo sprintf('<td>%s</td>', $group['local_value']);
    echo sprintf('<td>%s</td>', $group['access']);
    echo "</tr>";
}
?>
</tbody>
</table>
