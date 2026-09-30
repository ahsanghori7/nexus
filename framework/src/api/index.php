<?php

//Route Template
use Api\Route\Template\Api;
use Core\Router\Route\Helper;

/**
 * Register the Api Route Template with shortcut structure and reusuable action, middleware and errors
 */
Helper::registerTemplate("api", Api::class);

Core\Config::update( require_once("config/app.php") );
Core\Service\Manager::addServices(
    require_once("config/services.php")
);
$envConfig = sprintf("%s/config/environment/%s.php", __DIR__, strval(Core\Config::get("environment")));
if(file_exists($envConfig)) {
    Core\Config::update( require_once($envConfig) );
}

//Load App dependencies
Core\System\Control::loadAppFile('prosper', 'vendor/autoload.php');

Core\System\Control::setHandlers(Core\Config::getCallbacks("handlers"));

//Render all responses as json by default if the action has a response_keys property
Core\System\Control::setHandler("PostActionMiddleware", function($a) {
    $responseKeys = $a->get("response_keys", []);
    if($responseKeys) {
        if(!is_array($responseKeys)) {
            $responseKeys = [$responseKeys];
        }
        $responseKeys[] = "error";
        foreach($responseKeys as $id => $key) {
            $v = $a->get($key);
            if(!is_null($v)) {
                $data[is_string($id) ? $id : $key] = $v;
            }
        }

        if($data) {
            $a->set("json", json_encode($data));
        }
    }
} );


Core\Middleware\TemplateLoader::setTemplatePool("core", dirname(__DIR__) . DS . "core" . DS. "template" . DS);

require_once("config/procedures.php");
try {
    //we should override the core router with the api router to handle cors requests
    Core\Router::setRoutes(require_once("config/routes.php"));
    Core\Router::setRoutes(require_once("config/relay.php"));
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
