<?php

use Admin\Middleware\Relay;
use Core\Middleware\Session;

$prequal = Core\System\Control::loadAppFile('prequalification', 'config/routes.php');
if(is_array($prequal)) {
    $prequal['prequalification']['key'] = "^relay$";
    $prequal['prequalification']['rules'] = [Relay::isResource("prequalification")];
    $prequal['prequalification']["middleware"] = array_merge(
        [
            Session::validate(),
            Session::checkAccount(),
        ], $prequal['prequalification']["middleware"] ?? []
    );
    return $prequal['prequalification'];
}
return [];
