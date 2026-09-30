<?php

global $argv;
require_once("../../app.constants.php");
$app = $argv[1] ?? false;
$level = $argv[2] ?? 9;
if($app) {
    $appSource = APPS_SRC . DS . $app;
    if(!is_dir($appSource)) {
        exit("Unknown App $app \n");
    }

    $code = $appSource . DS  . "code";
    if(!is_dir($code)) {
        exit("$app has no code to lint \n");
    }
}
else {
    define("APP", "core");
    $appSource = APPS_BASE;
    $code = APPS_BASE;
}

$neon = APPS_BASE . DS . "phpstan.neon";
if(is_file($appSource . DS . "phpstan.neon")) {
    $neon = $appSource . DS . "phpstan.neon";
}

$cmd = "vendor/bin/phpstan analyse";
if(is_file($neon)) {
    $cmd .= " -c $neon";
}

$cmd .= " $code";
if((int) $level) {
    $cmd .= " --level $level";
}
passthru($cmd, $status);
if($status){
    die($status);
}
