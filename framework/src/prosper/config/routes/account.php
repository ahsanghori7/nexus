<?php

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Data;
use Core\Middleware\Exception;
use Core\Middleware\Generic;
use Core\Middleware\Form;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Conditional;
use Prosper\Form\Validation;
use Prosper\Middleware\AccountMiddleware as ProsperAccount;
use Prosper\Middleware\EmailMiddleware;
use Prosper\Middleware\Session;
use Prosper\Middleware\Relay\HubspotMiddleware;
use Core\Middleware\Hubspot;
use Core\Middleware\Stripe;
use Core\Middleware\TemplateLoader;
use Core\Middleware\Exception as MiddlewareException;
use Prosper\Middleware\Relay\TokenHistoryMiddleware;
use Core\Middleware\Service\UserMiddleware;

$prosperValidAccountTypes = Config::get("valid_account_type_ids");
$prosperWebsiteId = Config::get("website_id.prosper");
$sessionCookie = Config::getShape("cookies.session");
$reactTemplate = TemplateLoader::load(
    "page/react.php",
    "core",
    ["react_url" => Config::get("react_url"), "react_app" => "prosper"]
);
$hubspotEnabled = Config::get("services.hubspot.prosper.enabled");
$freeTokensEnabled = Config::get("free_trial.enabled");

$freeTrialRandomGroupEnabled = Config::get("free_trial.assign_random_group");
$freeTrialRandomGroups = ['A','B'];

$unsubscribe_email_id = 1;
$sendActivationEmail = $hubspotEnabled && (bool)intval(Config::get("signup_email_enabled"));

const ANZ_REGION_CODE = ['NZ', 'AUS'];
const DEFAULT_REGION_CODE_ID = 1; //UK

return [
    "type" => "http",
    "onError" => [
        "formValidation" => Generic::badRequest(),
        "invalidToken"   => Generic::badRequest(),
        "tooManyRequests"  => Generic::tooManyRequests()
    ],

    "middleware" => [],
    "actions" => [
        [ "key"  => "^sign_up$",
            "method" => "post",
            "onError" => [
                "failedSignup" => function(MiddlewareException $ex) {
                    error_log($ex->getMessage());
                    Generic::redirect(Config::getUrl("prosper_wp_url", "signup_error"));
                }
            ],
            "middleware" => [
                function($action){
                    $regionCode = Config::get("region_code");
                    if (in_array($regionCode, ANZ_REGION_CODE)) {
                        Form::validate(Validation::getSignature("signup_anz"))($action);
                    } else {
                        Form::validate(Validation::getSignature("signup"))($action);
                    }
                },
                AccountMiddleware::loadSubscriptions($prosperWebsiteId),
                AccountMiddleware::loadTypes(),
                AccountMiddleware::loadByName("validated_form.company_name", "account"),
                function ($a) {
                    $keys = [
                        'company_name'  => "name",
                        'company_address' => "address",
                        'registered_company_number' => 'reg_number',
                        "email"
                    ];
                    $regionCode = Config::get("region_code");
                    if (in_array($regionCode, ANZ_REGION_CODE)) {
                        $keys[] = 'region_group_id';
                    }
                    //If we already have an account then it must be external conversion, otherwise an exception would be thrown
                    Conditional::hasKey(
                        "account",
                        [
                            ProsperAccount::convertProsper(['external_subcontractor', 'directory']),
                            ProsperAccount::cleanUsers(),
                            Data::set("arrived_from_supply_chain", true)
                        ],
                        //Else
                        [
                            ProsperAccount::create("validated_form", $keys),
                            Data::set("arrived_from_supply_chain", false)
                        ]
                    )($a);
                },
                function($a){
                    $a->set("user_data", [
                        'firstname' => $a->get("validated_form.firstname"),
                        'lastname'  => $a->get("validated_form.lastname"),
                        'email'     =>  $a->get("validated_form.email"),
                        'password'  =>  $a->get("validated_form.password"),
                    ], true);
                },
                AccountMiddleware::load("user/type","", "user_types"),
                ProsperAccount::createUser("user_data", [
                    'firstname',
                    'lastname',
                    'email',
                    'password'
                ]),
                function($a){
                    $regionCode = Config::get("region_code");
                    if (in_array($regionCode, ANZ_REGION_CODE)) {
                        $a->set("subscription_label_value", "National");
                        $a->set("sign_up_email_template", "ANZ New Sign Up");
                    } else {
                        $a->set("subscription_label_value", Config::get("default_subscription_label"));
                        $a->set("sign_up_email_template", "New Sign Up");
                    }
                    ProsperAccount::setMembership(strval($a->get("subscription_label_value")), "account.id")($a);
                },
                Conditional::isTrue($freeTokensEnabled, [
                    ProsperAccount::setMembershipTokens(intval(Config::get("free_trial.amount")), "account.id"),
                ]),
                Conditional::isTrue($freeTrialRandomGroupEnabled, [
                    function($a) use ($freeTrialRandomGroups){
                        $a->set("membershipGroup", $freeTrialRandomGroups[random_int(0, count($freeTrialRandomGroups) - 1)]);
                    },
                    ProsperAccount::setMembershipGroup("membershipGroup", "account.id"),
                ]),
                ProsperAccount::generateActivationLink(Config::getUrl("site_url", "account/activate"), "validated_form.email"),
                function($a){
                    $idRegion = $a->get("validated_form.region_group_id", DEFAULT_REGION_CODE_ID);
                    if ($idRegion) {
                        ProsperAccount::updateMetaToken("token", ["region_id" => $idRegion])($a);
                    }
                },
                Conditional::isTrue($hubspotEnabled, [
                    function($a){
                        $a->setItems([
                            "account_type"   => "Flexi/Token user",
                            "lifecyclestage" => "customer",
                            "business_type"  => "Prosper"
                       ]);
                    },
                    Hubspot::createObject(
                        "contacts", [
                        "user_data.firstname" => "firstname",
                        "user_data.lastname" => "lastname",
                        "account.name"       => "company",
                        "account.email"      => "email",
                        "account_type",
                        "lifecyclestage",
                        "business_type"
                    ], "prosper_hubspot",
                        //If hubspot fails due to the contact already existing we can just skip
                        onFail:function(Shape $res, string $error){
                            error_log($error);
                        }
                    )
                ]),

                //We generate the activation link in the middleware above ProsperAccount::generateActivationLink
                //If a user arrived from supply chain they need to be sent a different email
                function($a){
                    EmailMiddleware::send($a->get("sign_up_email_template"),[
                            "sender" => $a->get("new_user"),
                            'token'  => new Shape(['url' => $a->get("activation_link")])]
                    )($a);
                },
                function($a){
                    Generic::redirect(Config::getUrl("signup_email_check",  $a->get("token")))($a);
                },
            ]
        ],
        [ "key"  => "^activation_resend\/(?<token>[0-9a-z]+)$",
            "middleware" => [
                AccountMiddleware::existsByToken("uriArgs.token", "activation_link"),
                function($a){
                    $a->set("activation_link",Config::getUrl("site_url", "account/activate/" . $a->get("uriArgs.token")));
                    EmailMiddleware::send("New Sign Up",[
                            "sender" => new Shape($a->get("account.user")),
                            'token'  => new Shape(['url' => $a->get("activation_link")])]
                    )($a);
                },
                Generic::set("json", function($a){ return json_encode(["success" => "true"]); })
            ]
        ],
        [ "key"  => "^activate\/(?<token>[0-9a-z]+)$",
            "middleware" => [
                AccountMiddleware::initActivationAccountProcess($sessionCookie,"uriArgs.token"),
            ]
        ],
        //Render a form a user can request a new password reset email
        [ "key"  => "^password\/reset$", "middleware" => [
                Session::CsfrInit(),
                $reactTemplate
            ]
        ],
        //backend for handling new password supplied
        [ "key"  => "^password\/reset$",
            "method" => "post",
            "middleware" => [
                // On ECS, HTTP headers are returned in lowercase.
                // We normalize all headers to lowercase using array_change_key_case() to ensure
                // consistent behaviour across all environments.
                Session::CsfrValidate(array_change_key_case(getallheaders(), CASE_LOWER)['csfr-token'] ?? null),
                Form::validate(Validation::getSignature("password_reset")),
                AccountMiddleware::load("account/type", "", "account_types"),
                function($a){
                    $arrayData = $a->get("validated_form")->toArray();
                    $a->set("validated_form_array", $arrayData);
                    Form::sanitizeData("validated_form_array")($a);
                    $a->set("validated_form", new Shape($a->get("validated_form_array")));
                },
                AccountMiddleware::existsByKey("validated_form.email", "email", skipAccount: true),
                function ($a) {
                    //only allow prosper user to reset their password
                    $specialist_ids = $a->getCollection("account_types")->filterByExistInArray('label', ['specialist', 'external_subcontractor'])->getIds();
                    if(!in_array($a->int("account.type_id"), $specialist_ids)){
                        $a->set("exists", false);
                    }
                },
                Conditional::switched("exists", [
                        AccountMiddleware::generatePasswordResetLink("validated_form.email", Config::getUrl("site_url", "account/password/new")),
                        function($a){
                            EmailMiddleware::send("Password Reset",[
                                    "sender" => $a->get("user"),
                                    'token'  => new Shape(['url' => $a->get("token_url")])]
                            )($a);
                        },
                        Generic::set("json", function($a){ return json_encode(["success" => "true"]); })
                    ],
                    [
                        Generic::set("json", function($a){ return json_encode(["error" => "email_not_found"]); })
                    ]
                ),
            ]
        ],
        //Render a form that the user can enter a new password
        [ "key"  => "^password\/new\/(?<token>[0-9a-z]+)$", "middleware" => [$reactTemplate]],
        [ "key"  => "^password\/new$",
            "onError" => [
                //Incase a C-Link tries to login to Prosper, also useful debug hook
                "InvalidUserTypeLogin" => Generic::redirect(Config::getUrl("site_url", "login"))
            ],
            "method" => "post",
            "middleware" => [
                Form::validate(Validation::getSignature("new_password")),
                AccountMiddleware::resetPassword("validated_form.password","validated_form.token" ),
                AccountMiddleware::loadById("user.account_id"),
                ProsperAccount::logUserIn("user.email", "validated_form.password", $prosperValidAccountTypes),
                Session::setCookie(strval($sessionCookie->get("name")), "token", $sessionCookie),
                Generic::redirect(Config::getUrl("site_url", "dashboard"))
            ]
        ],
        [ "key"  => "^payment_request\/(?<plan_id>[a-z0-9]+)(\/)?$",
            "middleware" => [
                Session::validate(),
                ProsperAccount::paymentRequest("account.id"),
                Stripe::paymentRequest('uriArgs.plan_id'),
                ProsperAccount::redirectToPayment()
            ],
            "onError" => [
                "noSession"             => Generic::redirect(Config::getUrl("site_url", "login")),
                "stripeUpdateAccount"   => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
                "stripeInvalidData"     => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
                "stripePayment"         => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
                "stripePaymentRequest"  => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
                "stripeGetResponse"     => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
            ]
        ],
        [ "key"  => "^payment_verification",
            "method" => "post",
            "middleware" => [
                Stripe::getResponse(),
                Stripe::validatePayment(),
                Stripe::getSubscriptionTokens(),
                Stripe::getPaymentMetadata(),
                ProsperAccount::updateAccountMembership(),
                TokenHistoryMiddleware::issueToken(),
                Stripe::getAccountFromMetaData(),
                function($a){
                    $a->set('hubspot_data',[
                        'tokens_purchased' => true
                    ]);
                },
                HubspotMiddleware::updateByEmail("account.user.email")
            ],
            "onError" => [
                "noSession"                 => Generic::redirect(Config::getUrl("site_url", "login")),
                "stripeUpdateAccount"       => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
                "stripeInvalidData"         => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
                "stripePayment"             => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
                "stripeGetResponse"         => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
                "stripeValidatePayment"     => Generic::redirect(Config::getUrl("services.stripe.redirect.error")),
                "stripePaymentSubscription" => Generic::redirect(Config::getUrl("services.stripe.redirect.error"))
            ]
        ],
        [ "key"  => "^auto_loader\/(?<token>[0-9a-z]+)\/redirect=(?<redirect>[0-9a-z._\-\/]+)$",
            "method" => "GET",
            "middleware" => [
                function($a){
                    $a->set("args", $a->getRoute()->getRequest()->getArgs());
                },
                AccountMiddleware::autoLoader("uriArgs.token"),
                Session::setCookie(strval($sessionCookie->get("name")), "token", $sessionCookie),
                AccountMiddleware::redirect("uriArgs.redirect", "args"),
            ],
            "onError" => [
                "invalidToken" => Generic::redirect(Config::getUrl("site_url", "login")),
            ]
        ],
        [ "key"  => "^email\/(?<hash>[\w+\/=]+)\/unsubscribe\/(?<email_id>[0-9]+)$",
            "method" => "GET",
            "middleware" => [
                AccountMiddleware::unsubscribe("uriArgs.hash", "uriArgs.email_id"),
                Generic::redirect(Config::getUrl("site_url", "account/unsubscribe_success"))
            ],
            "onError" => [
                "invalidToken" => Generic::redirect(Config::getUrl("site_url", "login")),
            ]
        ],
        [ "key"  => "^request_login$",
            "middleware" => [
                Session::CsfrInit(),
                $reactTemplate
            ],
        ],
        [
            "key" => "^request_login_request$",
            "method" => "POST",
            "middleware" => [
                AccountMiddleware::load("type"),
                AccountMiddleware::loadTokenTypes("request_login"),
                function($a){
                    $form = $a->getRoute()->getRequest()->getData()->getShape("form");
                    $a->setItems([
                        "email" => $form->get("email"),
                        "token_request" => $a->get("token_type")
                    ]);
                },
                UserMiddleware::loadByEmail("email"),
                AccountMiddleware::loadByEmail("email"),
                AccountMiddleware::loadRequestedLogins(),
                function($a){
                    $allow_types = $a->get("account_types")->filterByExistInArray('label', ['specialist', 'external_subcontractor']);
                    $a->setItems([
                        "can_request" => (count($a->get("requests", [])) < Config::get("request_access_limit", 0)),
                        "email_valid" => true
                    ]);
                    if(!$a->get("account") || !in_array($a->get("account")->get("type_id"), $allow_types->values("id"))) {
                        $a->setItems([
                            "can_request" => false,
                            "email_valid" => false
                        ]);
                    }
                },
                AccountMiddleware::loadTokenTypes("auto_loader"),
                Conditional::switched("can_request", [
                    function($a){
                        //Create the request login entry
                        AccountMiddleware::createUserToken(
                            "user.id", "token_request", Config::getUrl("site_url", "account/auto_loader")
                        )($a->set("token_request", $a->get("token_request")));

                        //Create an autologin token and unsubscribe link for the email
                        AccountMiddleware::createUserToken(
                            "user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                        )($a->set("token_type", $a->get("token_type")));
                        $a->set("unsubscribe_url",
                            Config::getUrl("site_url", "account/email/". base64_encode(strval($a->get("user.email"))) ."/unsubscribe/$unsubscribe_email_id")
                        );
                        EmailMiddleware::send("Login Link Request",[
                            "sender" => $a->get("user"),
                            "token" => new Shape(["url" => $a->get("token_url")])
                        ])($a);
                    },
                ],
                    [
                        function($a){
                            if(!$a->get("email_valid") === false) {
                                throw new Exception("tooManyRequests", "Too many requests");
                            }
                        }
                    ]),
                Generic::set("json",  function ($a) {
                    return json_encode(
                        [
                            "success"     => (bool)$a->get("can_request"),
                            'email_valid' => (bool)$a->get("email_valid", false)
                        ]);
                }),
            ]
        ],
    ]
];
