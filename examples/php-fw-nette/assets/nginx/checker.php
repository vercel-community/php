<?php
header('Content-Type: application/javascript');
?>
nginxChecker = <?php echo isset($_GET['ok']) ? 1 : 0; ?>;
