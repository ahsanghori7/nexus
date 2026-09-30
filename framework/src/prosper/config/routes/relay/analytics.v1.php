<?php

use Prosper\Middleware\Relay;
use Core\Middleware\Session;

$app = 'analytics';
$middleware = Core\System\Control::loadAppFile($app, 'config/routes.php');


if(is_array($middleware)) {
    $middleware[$app]['key'] = "^relay$";
    $middleware[$app]['rules'] = [Relay::isResource("analytics")];
    $middleware[$app]["middleware"] = array_merge(
        [
            Session::validate()
        ], $middleware[$app]["middleware"] ?? []
    );

    return $middleware[$app];
}
return [];
