<?php

Core\Config::update( require_once("config/app.php") );
Core\Service\Manager::addServices(
    require("config/services.php")
);
$envConfig = sprintf("%s/config/environment/%s.php", __DIR__, strval(Core\Config::get("environment")));
if(file_exists($envConfig)) {
    Core\Config::update( require_once($envConfig) );
}
