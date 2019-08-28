<?php header ("Content-type: image/png");
$handle = ImageCreate (130, 50) or die ("Cannot Create image");
$bg_color = ImageColorAllocate ($handle, 255, 0, 0);
$txt_color = ImageColorAllocate ($handle, 255, 255, 255);
$line_color = ImageColorAllocate ($handle, 0, 0, 0);
ImageLine($handle, 65, 0, 130, 50, $line_color);
ImageString ($handle, 5, 5, 18, "PHP.About.com", $txt_color);
ImagePng ($handle);
?>