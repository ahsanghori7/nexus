<?php

$app = $argv[1] ?? false;
if(!$app) {
    exit("No app supplied\n");
}

$testType = $argv[2] ?? false;
if(!$testType) {
    exit("No test type supplied\n");
}

define("APP", $app);
require_once(realpath(__DIR__ . "/../init.php"));

if(is_file(APP_ROOT . DS . "bootstrap.php")) {


    require_once(APP_ROOT . DS . "bootstrap.php");
}


$path = __DIR__ . "/$testType.php";
if(!is_file($path)) {
    exit("Invalid test type `$testType` supplied\n");
}
require_once($path);
