<?php

use Prosper\Middleware\Relay;
use Core\Middleware\Session;

$app = 'company_profile';
$prequal = Core\System\Control::loadAppFile($app, 'config/routes.php');
if(is_array($prequal)) {
    $prequal[$app]['key'] = "^relay$";
    $prequal[$app]['rules'] = [Relay::isResource("company_profile")];
    $prequal[$app]["middleware"] = array_merge(
        [
            Session::validate(),
            Session::checkAccount(),
        ], $prequal[$app]["middleware"] ?? []
    );
    return $prequal[$app];
}
return [];
