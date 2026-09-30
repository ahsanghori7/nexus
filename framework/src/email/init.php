<?php

Core\Config::update( require_once("config/app.php") );
Core\Service\Manager::addServices(
    require("config/services.php")
);
$envConfig = sprintf("%s/config/environment/%s.php", __DIR__, strval(Core\Config::get("environment")));
if(file_exists($envConfig)) {
    Core\Config::update( require_once($envConfig) );
}

Core\System\Control::setHandlers(Core\Config::getCallbacks("handlers"));
try {
    Core\Router::setRoutes(require_once("config/routes.php"));
}
catch(\Throwable $e) {
    exit("Failed4 to load routes: " . $e->getMessage() . "\n");
}
