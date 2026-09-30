<?php

use Core\Layer\Http\Incoming;
use Core\Router;
use Core\System\Environment as E;
use Core\Service\Manager;

$_SERVER["HTTP_HOST"] = "prosper.test";
$_SERVER["REQUEST_URI"] = "/account/sign_up";
$_SERVER["REQUEST_METHOD"] = "POST";


$_POST = [
    'company_name' => 'Tester Company ' . uniqid(),
    'company_address' => 'WS13 8WB,  12 Healey Drive,  Lichfield,  England,  Staffordshire,  Streethay',
    'trades' => [36],
    'regions' => [4],
    'vat' => '4444',
    'utr' => '44445',
    'first_name' => 'Dan',
    'last_name'  => 'Potato',
    'email' =>  uniqid() . '@c-link.com',
    'telephone' => '0243343234',
    'password' => 'tester123@',
    'company_website' => 'www.test.com',
    'agree' => 'on',
    'mailing_list_consent' => 'on',
    'referer' => E::get("PROSPER_WP_URL"),
    'free' => false
];

$action = Router::matchRoute(new Incoming())->matchAction();
if($action->get("key") !== "^sign_up$") {
    exit("Failed to find route for sign up");
}
$error = false;
try{
    $action->exec();
}
catch(\Exception $e) {
    $error =  $e;
}


//Need to add some extra validation here to check things like region and trade mapping, membership etc worked as expected
//And general clean up procedure
$account = $action->getShape("account");
$accountId = $account->get("id");
if($accountId) {
    Manager::getService("account")->delete("account/$accountId");
    if($account->has("users")) {
        $users   = $account->getCollection("users");
        foreach ($users as $user) {
            Manager::getService("account")->delete("user/" . $user->get("id"));
        }
    }
}

if($error) {
    exit("Route Failed with message " . $error->getMessage() . "\n");
}
