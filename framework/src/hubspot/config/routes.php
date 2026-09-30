<?php

use Core\Config;
use Core\Middleware\Generic;
use Core\Middleware\Hubspot;
use Core\Middleware\Exception;
use Core\Middleware\Conditional;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\UserMiddleware;
use Hubspot\Middleware\HubspotMiddleware;

return [
    "index" => [
        "type" => "http",
        "middleware" => [],
        "default_action" => [
            "middleware" => [Generic::healthCheck()]
        ],
    ],
    "webhook" => [
        "type" => "http",
        "requires_auth" => true,
        "onError" => [
            "not_found" =>
            function ($ex, $action) {
                Generic::noRoute()($ex, $action);
                $action->set("json", json_encode(["error" => $ex->getMessage()]));
            },
            "failed_token_auth" => Generic::notAuthorised()
        ],
        "middleware" => [],
        "actions" => [
            [
                "key" => "^award_token$",
                "method" => "POST",
                "middleware" => [
                    HubspotMiddleware::validTokenData(),
                    HubspotMiddleware::setTokenContent(),
                    AccountMiddleware::loadByEmail("email", "account"),
                    Conditional::hasKey(
                        "account",
                        [AccountMiddleware::loadTokenTypes("promo")],
                        [function () {
                            throw new Exception("not_found", "Company email does not exist", 404);
                        },]
                    ),
                    UserMiddleware::loadByEmail("email", "user"),
                    Conditional::hasKey(
                        "user",
                        [
                            function ($a) {
                                $account = $a->get('account');
                                $user = $a->get('user');
                                $account->set('user', $user);
                                $account->set('token_type', $a->get("token_type"));

                                $token_url = Config::getUrl("site_url_prosper", "promo/token");

                                AccountMiddleware::createUserToken(
                                    "user.id",
                                    "token_type",
                                    $token_url,
                                    ['token_award' => $a->get("token_credit_total")]
                                )($account);

                                $a->set("account", $account);
                            }
                        ],
                        [
                            function () {
                                throw new Exception("not_found", "User email does not exist", 404);
                            },
                        ]
                    ),
                    function ($a) {
                        $hubspotEmailId = (int)Config::get("hubspot.email_promo_id");
                        Hubspot::email(
                            $hubspotEmailId,
                            'email',
                            [],
                            [
                                "account.name"    => "promo_contact_first_name",
                                "token_credit_total" => "token_award",
                                "account.token_url"    => "token_url",
                            ],
                            "prosper_hubspot"
                        )($a);
                    },
                    Generic::set("json",  function ($a) {
                        return json_encode(["success" => $a->get("account.token_url")]);
                    })
                ]
            ]
        ]
    ],
    "hubspot" => [
        "type" => "http",
        "middleware" => [],
        "actions" => [
            [
                "key" => "^check_promo_token$",
                "method" => "GET",
                "middleware" => [
                    Generic::set("json",  function ($a) {
                        return json_encode(["success" => "adasdad"]);
                    })
                ]
            ]
        ]
    ]
];
