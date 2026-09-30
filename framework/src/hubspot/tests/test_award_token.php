<?php


use Core\Layer\Http\Incoming;
use Core\Router;
use \Core\Data\Shape;
/** Renew a password */
$_SERVER["HTTP_HOST"] = "hubspot.test";
$_SERVER["REQUEST_URI"] = "/webhook/award_token?api_token=potato";
$_SERVER["REQUEST_METHOD"] = "POST";

$_POST = [
    //"huid" => null,
    "token" => "test_token",
    "phone_number" => "01403255988"
];

$i = new Incoming();
$i->getData()->set("json", new Shape(
    [
        "email" => "test@prosper.com"

    ]
));

$action = Router::matchRoute($i)->matchAction();

if ($action->get("key") !== "^award_token$") {
    exit("Failed to find route for Award Token");
}

$error = false;
try {
    Router::exec($i);
} catch (\Exception $e) {
    $error = $e;
}

if ($error) {
    echo "Failed to handle webhook with message: " . $error->getMessage() . "\n";
    exit();
}
