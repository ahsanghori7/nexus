<?php

require_once("init.php");

try {

    $io = Core\System\Control::buffer(function() {
        return Core\Router::exec(Core\Layer\Factory::getIncoming(REQUEST_MODE));
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
