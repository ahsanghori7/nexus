<?php
global $argv;
if(count($argv) < 2) {
    exit("Missing Arguments\n");
}

$appName = $argv[1];
$test = $argv[2] ?? false;
if(!$test) {
    exit("No test supplied\n");
}

define("APP", $appName);
require_once("init.php");
if(file_exists(APP_ROOT . "/init.php")) {
    require_once(APP_ROOT . "/init.php");
}
$testerFile = APP_ROOT . DS . "tests" . DS . sprintf("%s.php", $test);
if(!is_file($testerFile)) {
    exit("invalid tester file $testerFile\n");
}

require_once($testerFile);
