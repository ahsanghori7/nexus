<?php

use Prosper\Middleware\Relay;
use Core\Middleware\Session;

$app = 'email';

Core\System\Control::loadAppFile($app, 'init.php');
$middleware = Core\System\Control::loadAppFile($app, 'config/routes.php');
if(is_array($middleware)) {
    $middleware[$app]['key'] = "^relay$";
    $middleware[$app]['rules'] = [Relay::isResource("email")];
    $middleware[$app]["middleware"] = array_merge(
        [
            Session::validate()
        ], $middleware[$app]["middleware"] ?? []
    );

    return $middleware[$app];
}
return [];
