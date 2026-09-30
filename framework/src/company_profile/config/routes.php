<?php

use Core\Middleware\Generic;

use CompanyProfile\Middleware\CompanyProfileMiddleware;
use CompanyProfile\Middleware\S3Middleware;
use Core\Middleware\Service\AccountMiddleware as CoreAccountMiddleware;
use Core\Config;
use Core\Middleware\Service\AccountMiddleware;
use Prosper\Middleware\Relay\TradeMiddleware;
use Core\Middleware\Conditional;

$prosperWebsiteId = Config::get("website_id.prosper");

return [
    "index" => [
        "type" => "http",
        "middleware" => [],
        "default_action" => [
            "middleware" => [Generic::healthCheck()]
        ],
    ],
    "company_profile" => [
        "type" => "http",
        "middleware" => [],
        "onError" => [
            "bad_request" => Generic::badRequest(),
            "invalid_subcontractor" => Generic::noRoute()
        ],
        "actions" => [
            [
                "key" => "(?<aid>[0-9]{1,7})$",
                "method" => "GET",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    function ($a) {
                        $account = $a->getShape("session")->getShape("account");
                        if($account->get()) {
                            $a->set("account", $account);
                        }
                    },
                    //If the requests is made from contractor supply chain company profile
                    //we need to get the account from the argument aid as we dont have the prosper session
                    Conditional::hasKey("account",
                        [],
                        [
                            AccountMiddleware::loadById("uriArgs.aid"),
                        ]
                    ),
                    CoreAccountMiddleware::loadSubscriptions($prosperWebsiteId),
                    CompanyProfileMiddleware::loadConstants(),
                    CompanyProfileMiddleware::loadRegions(),
                    CompanyProfileMiddleware::filterRegionsByAccountRegionId(),
                    CompanyProfileMiddleware::loadTrades(),
                    CompanyProfileMiddleware::loadTypes(),
                    CompanyProfileMiddleware::loadCompanyInformation(),
                    CompanyProfileMiddleware::loadCompanyRegions(),
                    CompanyProfileMiddleware::loadCompanyTrades(),
                    CompanyProfileMiddleware::loadCompanyTypes(),
                    CompanyProfileMiddleware::restrictRegionsByRegionalAccount(),
                    CompanyProfileMiddleware::updateOfferingsLabel(['trades', 'regions', 'types']),
                    Generic::set("json",  function ($action) {
                        return json_encode(["data" => $action->get("company_information")]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/filter_options$",
                "method" => "GET",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    AccountMiddleware::load("account/type", "", "account_types"),
                    function ($a) {
                        $account = $a->getShape("session")->getShape("account");
                        //if the user is an admin (ghost mode) we will get the account data not from the session
                        //we will get the account based on the account id key "aid" which is set from the url arg
                        $admin_type_id = $a->get("account_types")->filterByField('label', 'administrator')->getFirst()->get('id');
                        if($account->get() && $account->int("type_id") !== (int)$admin_type_id){
                            $a->set("account", $account);
                        }
                    },
                    //If the requests is made from contractor supply chain company profile
                    //we need to get the account from the argument aid as we dont have the prosper session
                    Conditional::hasKey("account",
                        [],
                        [
                            AccountMiddleware::loadById("uriArgs.aid"),
                        ]
                    ),
                    CompanyProfileMiddleware::loadConstants(),
                    CompanyProfileMiddleware::loadRegions(),
                    CompanyProfileMiddleware::filterRegionsByAccountRegionId(),
                    CompanyProfileMiddleware::loadTrades(),
                    CompanyProfileMiddleware::loadTypes(false),
                    Generic::set("json",  function ($action) {
                        return json_encode(["data" => [
                            "regions" => $action->get("regions"),
                            "trades" => $action->get("trades"),
                            "types" => $action->get("types"),
                        ]]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/company_information$",
                "method" => "PATCH",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    CompanyProfileMiddleware::checkUniqueCompanyName(),
                    CompanyProfileMiddleware::updateCompanyInformation(),
                    Generic::set("json",  function () {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/user_information$",
                "method" => "PATCH",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    function($action){
                        $user = $action->getShape("session")->getShape("user");
                        $action->set("uid", $user->get("id"));
                    },
                    CompanyProfileMiddleware::checkUniqueUserEmailAddress(),
                    CompanyProfileMiddleware::updateUserInformation(),
                    Generic::set("json",  function () {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/oferrings",
                "method" => "PATCH",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    CompanyProfileMiddleware::updateCompanyOfferingsTrades(),
                    CompanyProfileMiddleware::updateCompanyOfferingsRegions(),
                    CompanyProfileMiddleware::updateCompanyOfferingsTypes(),
                    Generic::set("json",  function () {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/offerings\/trades",
                "method" => "PATCH",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    function($a){
                        $data = $a->getRoute()->getRequest()->getData();
                        $a->set("new_trades", $data->getShape("json")->get("trades"));
                    },
                    AccountMiddleware::load("trade_category", "", "trades"),
                    TradeMiddleware::getTradesForParentCategory("new_trades",   "trades"),
                    CompanyProfileMiddleware::updateCompanyOfferings("trades", "trades"),
                    Generic::set("json",  function () {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/offerings\/regions",
                "method" => "PATCH",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    function($a){
                        $data = $a->getRoute()->getRequest()->getData();
                        $a->set("regions", $data->getShape("json")->get("regions"));
                    },
                    CompanyProfileMiddleware::updateCompanyOfferings("region", "regions"),
                    Generic::set("json",  function () {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/profile_logo",
                "method" => "POST",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    S3Middleware::updateLogo(),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/company_logo",
                "method" => "POST",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    S3Middleware::updateLogo(type: 'company'),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/profile_logo",
                "method" => "DELETE",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    S3Middleware::removeLogo(),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
            [
                "key" => "(?<aid>[0-9]{1,7})\/company_logo",
                "method" => "DELETE",
                "middleware" => [
                    CompanyProfileMiddleware::loadCollection(),
                    S3Middleware::removeLogo('company'),
                    Generic::set("json",  function ($action) {
                        return json_encode(["success" => true]);
                    }),
                ]
            ],
        ]
    ]
];
