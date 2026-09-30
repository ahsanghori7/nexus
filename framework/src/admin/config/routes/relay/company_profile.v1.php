<?php

use Admin\Middleware\Relay;
use Core\Middleware\Session;

$app = 'company_profile';
$middleware = Core\System\Control::loadAppFile($app, 'config/routes.php');
if(is_array($middleware)) {
    $middleware[$app]['key'] = "^relay$";
    $middleware[$app]['rules'] = [Relay::isResource("company_profile")];
    $middleware[$app]["middleware"] = array_merge(
        [
            Session::validate(),
            Session::checkAccount(),
        ], $middleware[$app]["middleware"] ?? []
    );
    return $middleware[$app];
}
return [];
