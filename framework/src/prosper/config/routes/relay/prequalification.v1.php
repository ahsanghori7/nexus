<?php

use Prosper\Middleware\Relay;
use Core\Middleware\Session;
use Core\Middleware\Conditional;
use Core\Middleware\Hubspot;
use Core\Config;



$prequal = Core\System\Control::loadAppFile('prequalification', 'config/routes.php');
if(is_array($prequal)) {
    $prequal['prequalification']['key'] = "^relay$";
    $prequal['prequalification']['rules'] = [Relay::isResource("prequalification")];
    $prequal['prequalification']["middleware"] = array_merge(
        [
             function($a){
                $a->set("token", $a->get("uriArgs.token"));
             },
             Conditional::hasKey("token",
                 [
                     Session::validateToken("token"),
                 ],
                 //Else
                 [
                     Session::validate(),
                     Session::checkAccount(),
                 ]
             )

        ], $prequal['prequalification']["middleware"] ?? []
    );

    return $prequal['prequalification'];
}
return [];
