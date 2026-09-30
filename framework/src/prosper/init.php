<?php

const SUBCONTRACTOR_TYPE_ID = 3;

//Load App dependencies
Core\System\Control::loadAppFile('prequalification', 'vendor/autoload.php');
Core\System\Control::loadAppFile("company_profile", 'vendor/autoload.php');
Core\System\Control::loadAppFile("hubspot", 'vendor/autoload.php');
Core\System\Control::loadAppFile("analytics", 'vendor/autoload.php');
Core\System\Control::loadAppFile("email", 'vendor/autoload.php');
Core\System\Control::loadAppFile("api", 'vendor/autoload.php');

Core\Config::update( require_once("config/app.php") );
Core\Service\Manager::addServices(
    require_once("config/services.php")
);
$envConfig = sprintf("%s/config/environment/%s.php", __DIR__, strval(Core\Config::get("environment")));
if(file_exists($envConfig)) {
    Core\Config::update( require_once($envConfig) );
}

//Add site messages into own config
Core\Config::update( require_once("config/messages.php"));

Core\System\Control::setHandlers(Core\Config::getCallbacks("handlers"));
Core\Middleware\TemplateLoader::setTemplatePool("prosper", __DIR__ . DS . "template" . DS);
Core\Middleware\TemplateLoader::setTemplatePool("core", dirname(__DIR__) . DS . "core" . DS. "template" . DS);
try {
    Core\Router::setRoutes(require_once("config/routes.php"));
    Core\Router::setRoutes(require_once("config/relay.php"));
}
catch(\Throwable $e) {
    exit("Failed to load routes: " . $e->getMessage() . "\n");
}
