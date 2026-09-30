<?php

$app = defined("APP") ? APP : false;
if(!$app) {
    global $argv;
    if($argv[0] === "vendor/bin/phpstan") {
        define("APP", "core");
    }
    else {
        exit("No App defined");
    }
}

include("app.constants.php");
define("APP_ROOT",  APPS_SRC . DS . $app);

if(is_dir(APP_ROOT)) {
    if(file_exists(APP_ROOT . DS . "composer.json")) {
        $vendor = APP_ROOT . "/vendor";
        if(!is_dir($vendor)) {
            exit($app . " app not installed; Please run `composer install`");
        }
        require_once($vendor ."/autoload.php");
    }

    $coreVendor = APPS_SRC . DS . "core/vendor";
    if(!is_dir($coreVendor)) {
        exit("Core app not installed; Please run `composer install`");
    }
    require_once($coreVendor . DS . "/autoload.php");
    require_once(APPS_SRC . DS . "core/bootstrap.php");
}
else {
    exit("Invalid or unknown app $app");
}
