<?php

use Prosper\Middleware\Relay;
use Core\Middleware\Session;

$app = 'hubspot';
$prequal = Core\System\Control::loadAppFile($app, 'config/routes.php');
if(is_array($prequal)) {
    $prequal[$app]['key'] = "^relay$";
    $prequal[$app]['rules'] = [Relay::isResource("hubspot")];
    $prequal[$app]["middleware"] = array_merge(
        [
            Session::validate(),
            Session::checkAccount(),
        ], $prequal[$app]["middleware"] ?? []
    );
    return $prequal[$app];
}
return [];
