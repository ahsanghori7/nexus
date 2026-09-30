<?php

use Core\System\Control;

try {
    Core\System\Environment::loadEnv(APPS_BASE);
    Core\Config::update(require_once("config/global.php"));
    Core\Service\Manager::addServices(require_once(__DIR__. "/config/services.php"));
}
catch(\Exception $e) {
    Control::callHandler("CoreBootstrapFailure");
    exit("Fatal System config error");
}
