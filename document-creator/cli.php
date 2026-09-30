<?php

require_once(__DIR__."/vendor/autoload.php");

global $argv;

$src  = $argv[1] ?? false;
$dest = $argv[2] ?? __DIR__;

if(!$src) {
    exit("No Source File Supplied");
}

$file = realpath($src);
if(!is_file($file)) {
    exit("Source File incorrect path");
}

$info = pathinfo($file);
if($info["extension"] !== "json") {
    exit("Source File incorrect type, json required");
}

$json = json_decode(file_get_contents($file), true);
if(!$json) {
    exit("Json Decode Failed, invalid json supplied");
}

$pdf = (new CL\Pdf\Parser($json))->parse();
$pdf->output(__DIR__ . "/" . $info["filename"] . ".pdf", 'F');
