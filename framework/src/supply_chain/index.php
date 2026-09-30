<?php

Core\Config::update( require_once("config/app.php") );
Core\Service\Manager::addServices(
    require_once("config/services.php")
);
$envConfig = sprintf("%s/config/environment/%s.php", __DIR__, strval(Core\Config::get("environment")));
if(file_exists($envConfig)) {
    Core\Config::update( require_once($envConfig) );
}

Core\System\Control::setHandlers(Core\Config::getCallbacks("handlers"));

//Load App dependencies
Core\System\Control::loadAppFile('prosper', 'vendor/autoload.php');

try {
    Core\Router::setRoutes(require_once("config/routes.php"));
}
catch(\Throwable $e) {
    exit("Failed to load routes: " . $e->getMessage());
}

try {

    $io = Core\System\Control::buffer(function() {
        return Core\Router::exec(Core\Layer\Factory::getIncoming("http"));
    });
    $res = $io->get("output");
    if($res instanceof \Core\Layer\ResponseAbstract) {
        $res->getTransport()->set("debug", $io->get("buffer"));
        echo $res;
    }
    Core\System\Control::callHandler("PreResponse",  $res);
    Core\System\Control::callHandler("PostResponse", $res);
}
catch(\Throwable $t) {
    error_log($t->getMessage());
    Core\System\Control::callHandler("CriticalSystemException", $t);
    exit("A critical system error has occurred");
}
