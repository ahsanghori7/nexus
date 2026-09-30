<?php

require_once(realpath("../../") . "/app.constants.php");

$apps = getApps();
foreach ($apps as $app => $path) {
    if($app !== "core") {
        $composer = $path . DS . "composer.json";
        $vendor   = $path . DS . "vendor";

        if(is_file($composer) && !is_dir($vendor)) {
            passthru("cd $path && composer install");
        }
    }
}
