<?php

use Core\Middleware\Service\AccountMiddleware;
use Core\Router\Route\Helper;
use Core\Middleware\Rest;
use Api\Middleware\EmailMiddleware;
use Core\Config;

$user_status = [
    "accept"  => 2,
    "decline" => 0
];

return Helper::getTemplate(
    actions: [
        [
            "id" => "account/supply-chain/accept-decline",
            "key" => "^account\/(?<aid>[0-9]+)\/supply-chain\/(?<token>[a-zA-Z0-9]+)\/(?<action>accept|decline)$",
            "method" => "GET",
            "response_keys" => ["data" => "collection"],
            "description" => "Accept or decline a supply chain contact request",
            "middleware" => [
                AccountMiddleware::load("account/type", "", "account_types"),
                AccountMiddleware::existsByToken("uriArgs.token", "supply_chain"),
                AccountMiddleware::loadById("uriArgs.aid", "contractor"),
                function ($a){
                    $contractor = $a->get("contractor");
                    $users = $contractor->getCollection("users");
                    $subcontractor = $a->get("account");
                    if ($users->count()) {
                        $userContractor = $users->first();
                        $subcontractorAccount = $subcontractor->get("account");
                        $subcontractorUser = $subcontractor->get("user");
                        $a->set("email_data", []);
                        $a->updateShape("email_data", [
                            "id" => $userContractor->get("id"),
                            "email" => $userContractor->get("email"),
                            "subcontractor_company_name" => $subcontractorAccount["name"],
                            "main_contractor_firstname" => $userContractor->get("firstname"),
                            "contact_full_name" => $subcontractorUser["display_name"],
                            "contact_email_address" => $subcontractorUser["email"],
                        ]);
                    }
                    $email_action  = $a->get("uriArgs.action");
                    $a->set("payload", $subcontractor);
                    $a->updateShape("payload", [
                        "email"        => $subcontractor->get("user.email"),
                        "company_name" => $subcontractor->get("account.name"),
                        "firstname"    => $subcontractor->get("user.display_name"),
                        "email_data"   => ["template" => "contact_$email_action"]
                    ]);
                },
                //Get the account owner user
                Rest::fetchDynamic(
                    "account",
                    "account/{account.account.id}",
                    [],
                    "users",
                    postProcessor: function ($res, $a) {
                        $users = $res->getShape("json")->get("data.users", []);
                        $a->set("user", array_shift($users));
                    }
                ),
                function ($a){
                    if($a->get("uriArgs.action") === "decline"){
                        //decline the supply chain contact request
                        Rest::update("account", "user/{account.user_id}/profile", "status")($a);
                    }
                },
                //Make the token link inactive
                function ($a) {
                    $a->updateShape("payload", [
                        "subcontractor_name" => $a->get("user.firstname")." ".$a->get("user.lastname"),
                    ]);
                    Rest::delete("account", sprintf("token/%s", $a->get("uriArgs.token")))($a);
                    $email_action = $a->get("uriArgs.action");
                    if ($email_action === "decline") {
                        Rest::delete("account_v2", "account/{uriArgs.aid}/supply-chain/{account.account.id}/user/{account.user_id}")($a);
                        Rest::delete("account", "account/{account.account.id}/organisation/{account.user_id}/user_id")($a);
                        EmailMiddleware::sendSupplyChainEmail("email_data", "contact_decline")($a);
                    } else {
                        EmailMiddleware::sendSupplyChainEmail(template: "contact_activation")($a);
                    }
                },
                function ($a) {
                    //get the correct id by storing it in the supply chain meta
                    AccountMiddleware::loadTokenTypes("auto_loader")($a);
                    //Create an autologin token and loged in the user
                    AccountMiddleware::createUserToken(
                        "user.id",
                        "token_type",
                        Config::getUrl("site_url", "account/auto_loader")
                    )($a);
                    $redirect = sprintf("%s/redirect=dashboard", $a->get("token_url"));
                    echo "<meta http-equiv='refresh' content='0;url=$redirect'>";
                    exit;
                }
            ]
        ]
    ]
);
