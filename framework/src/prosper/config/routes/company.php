<?php

use Core\Config;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Validator;
use Core\Middleware\Generic;
use Core\Middleware\Rest;
use Core\Middleware\Conditional;
use Core\Data\Shape;
use Prosper\Middleware\Relay\CompanyHouseMiddleware;

/** We need to exclude external subs from checks, so they can sign up */
$excludeAccountTypes = function(Shape $a) {
    $exists = $a->get("exists");
    if($a->has("account")) {
        $exclude_account_types = ["external_subcontractor", "directory"];
        $type = $a->getCollection("account_types")
            ->filterByField("id", $a->get("account.type_id"))
            ->first();
        if(in_array($type->get("label"), $exclude_account_types, true)){
            $exists = false;
        }
    }
    return json_encode(["exists" => $exists]);
};

return [
    "type" => "http",
    "onError" => ["validation_error" => Generic::badRequest()],
    "middleware" => [],
    "actions" => [
        //Todo: implement a better regex for emails
        ["key"  => "^email_exists\/(?<email>.*)$",
            "middleware" => [
                Validator::isEmail("uriArgs.email", true),
                AccountMiddleware::existsByKey("uriArgs.email", "email", skipAccount:true),
                Rest::fetch("account/type", "account", saveKey: "account_types"),
                Generic::set("json", $excludeAccountTypes )
            ]
        ],
        ["key"  => "^name_exists\/(?<name>.*)$",
            "middleware" => [
                function ($a) {
                    if ((bool) intval(Config::get("signup_email_unique_company_name"))) {
                        $a->set("signup_email_unique_company_name", Config::get("signup_email_unique_company_name"));
                    }
                },
                Conditional::hasKey(
                    "signup_email_unique_company_name",
                    [
                        AccountMiddleware::existsByKey("uriArgs.name", "name"),
                        Rest::fetch("account/type", "account", saveKey: "account_types"),
                        Generic::set("json", $excludeAccountTypes)
                    ],
                    //Else
                    [
                        Generic::set("json",  function () {
                            return json_encode(["exists" => false]);
                        })
                    ]
                ),
            ]
        ],
        ["key"  => "^search\/(?<name>.*)$",
            "middleware" => [
                AccountMiddleware::loadAccountsByType(),
                CompanyHouseMiddleware::searchByName("uriArgs.name"),
                CompanyHouseMiddleware::parseResults('data'),
                Generic::set("json", function($a) {
                    $companies = $a->get("companies");
                    return json_encode([
                        "found" =>  !empty($companies),
                        "companies" => $companies,
                    ]);
                }),
            ]
        ],
        ["key"  => "^ch_check\/(?<id>(SC|NI|[0-9]{2})[0-9]{6})$",
            "middleware" => [
                function($a) {
                    Rest::fetch(
                        "/company/" . $a->get("uriArgs.id"), "company_house",
                        saveKey: "data", errorKey:"rest_fetch_error")($a);
                },
                Generic::set("json", function($a) {
                    $address =  $a->get("data.registered_office_address");
                    $res = [
                        "valid" => $a->has("data"),
                        "company_name" => $a->get("data.company_name", ""),
                        "company_address" => is_array($address) ? implode(",",$address) : "",
                    ];
                    return json_encode($res);
                })
            ]
        ]
    ]
];
