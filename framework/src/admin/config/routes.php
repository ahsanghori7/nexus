<?php

use Core\Middleware\TemplateLoader;
use Admin\Middleware\Session;
use Core\Middleware\Generic;
use Core\Middleware\Form;
use Core\Config;#

use Admin\Form\Validation as FormValidation;
$loginRedirect = Generic::redirect(Config::getUrl("site_url", "login"));
$sessionCookie = Config::getShape("cookies.session");

$reactTemplate = TemplateLoader::load(
    "page/react.php", "core",
    ["react_url" => Config::get("react_url"), "react_app" => "admin"]
);

return [
    "index" => [
        "type" => "http",
        "middleware" => [
            Generic::redirect(Config::getUrl("site_url", "login"))
        ],
    ],
    "logout" => [
        "type" => "http",
        "middleware" => [
            Session::destroy(),
            Session::unsetCookie(strval($sessionCookie->get("name")), $sessionCookie),
            $loginRedirect
        ],
    ],
    "login" => [
        "type" => "http",
        "onError" => [
            "authError"      => $loginRedirect,
            "formValidation" => $loginRedirect,
        ],
        "middleware" => [
            Session::exists(function($a) {
                $type = $a->int("session.account.type_id");
                if($type === Session::ADMIN_ACCOUNT_TYPE_ID) {
                    Generic::redirect(Config::getUrl("site_url", "dashboard"))($a);
                }
            })
        ],
        "default_action" => ["middleware" => [$loginRedirect]],
        "actions" => [
            ["key" => "index",
                "middleware" => [
                    Session::CsfrInit(),
                    $reactTemplate
                ]
            ],
            ["key" => "^validate$",
                "method" => "POST",
                "middleware" => [
                    Session::CsfrValidate(),
                    Form::validate(FormValidation::getSignature("login")),
                    Session::Login(),
                    Session::setCookie(strval($sessionCookie->get("name")), "token", $sessionCookie),
                    Generic::redirect(Config::getUrl("site_url", "dashboard"))
                ]
            ]
        ]
    ],
    "dashboard" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ],
        "actions" => [["key"    => ".*"]]
    ],
    "projects" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ]
    ],
    "contractors" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ]
    ],
    "accounts" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ]
    ],
    "prosper\/dashboard" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ]
    ],
    "prosper\/supply-chain-dashboard" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ],
    ],
    "customer_health_score" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ]
    ],
    "features" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ]
    ],
    "prosper" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ]
    ],
    "search" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            $reactTemplate
        ]
    ],
        "logs" => [
            "type" => "http",
            "onError" => [
                "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
            ],
            "middleware" => [
                Session::validate(),
                $reactTemplate
            ],
        ],
    "admin" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
        ],
        "actions" => [
            ["key" => "info",
                "middleware" => [
                    Generic::set("json",  function($action) {
                        $user = $action->getShape("session")->getShape("user");
                        return json_encode(
                            [
                                "id"         => intval($user->get("id")),
                                "account_id" => intval($user->get("account_id")),
                                "firstname"  => $user->get("firstname"),
                                "lastname"   => $user->get("lastname"),
                                "display_name" => $user->get("display_name"),
                                "email"        => $user->get("email")
                            ]
                        );
                    })
                ]
            ]
        ]
    ],
    'company_checks' => Core\System\Control::loadAppFile('prosper', 'config/routes/company.php')
];
