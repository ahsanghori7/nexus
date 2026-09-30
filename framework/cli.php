<?php
global $argv;
if(count($argv) < 2) {
    exit("Missing Arguments\n");
}

$appName = $argv[1];
$route = $argv[2] ?? false;
if(!$route) {
    exit("No route supplied\n");
}

define("APP", $appName);
require_once("init.php");
if(file_exists(APP_ROOT . "/init.php")) {
    require_once(APP_ROOT . "/init.php");
}

if(file_exists(APP_ROOT . "/config/cli.php")) {
    $cli_routes = require(APP_ROOT . "/config/cli.php");
    Core\Router::setRoutes($cli_routes);

}

if(file_exists(APP_ROOT . "/index.php")) {
    require_once(APP_ROOT . "/index.php");
}
