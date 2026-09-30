<?php

use Core\Layer\Http\Incoming;
use Core\Router;

/** Renew a password */
$_SERVER["HTTP_HOST"] = "prosper.test";
$_SERVER["REQUEST_URI"] = "/company_checks/email_exists/prosper1@c-link.com";


$action = Router::matchRoute(new Incoming())->matchAction();
if($action->get("key") !== "^email_exists\/(?<email>.*)$") {
    exit("Failed to find route for email exists");
}
$error = false;
try{
    $action->exec();
}
catch(\Exception $e) {
    $error =  $e;
}

if($error) {
    echo "Failed to reset password due to error" . $error->getMessage();
    exit();
}
