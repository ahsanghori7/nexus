<?php

use CompanyProfile\Middleware\CompanyProfileMiddleware;
use Core\Data\Shape;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\SubcontractorMiddleware;
use Core\Middleware\TemplateLoader;
use Prosper\Middleware\AnalyticsMiddleware;
use Prosper\Middleware\Relay\HubspotMiddleware;
use Prosper\Middleware\Relay\TokenHistoryMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Prosper\Middleware\Session;
use Prosper\Middleware\Relay\ProjectMiddleware;
use Core\Middleware\Generic;
use Core\Middleware\Form;
use Core\Service\Manager;
use Core\Config;
use \Core\Middleware\Conditional;
use Core\Middleware\Exception as MiddlewareException;
use Core\Data\Collection;
use Core\Middleware\Hubspot;
use Prosper\Form\Validation as FormValidation;
use Prosper\Middleware\AccountMiddleware as ProsperAccountMiddleware;
use Prosper\Model\TeamManager as TeamManagerModel;
use Prosper\Middleware\Relay\EnquiriesMiddleware;
use Core\Middleware\Rest;
use Api\Middleware\EmailMiddleware as ApiEmailMiddleware;

$loginRedirect = Generic::redirect(Config::getUrl("site_url", "login"));
$sessionCookie = Config::getShape("cookies.session");
$region_company_type_id = 3;

$reactTemplate = TemplateLoader::load(
    "page/react.php",
    "core",
    ["react_url" => Config::get("react_url"), "react_app" => "prosper"]
);
$reactSocialPortalTemplate = TemplateLoader::load(
    "page/social-portal.php",
    "core",
    ["webcomponents_url" => Config::get("webcomponents_url")]
);
$supplyChainPortalTemplate = TemplateLoader::load(
    "page/supply-chain-portal.php",
    "core",
    ["webcomponents_url" => Config::get("webcomponents_url")]
);

$freeTrialRandomGroupEnabled = Config::get("free_trial.assign_random_group");
$freeTrialRandomGroups = ['A','B'];
$sendActivationEmail = (bool)intval(Config::get("signup_email_enabled"));

return [
    "index" => [
        "type" => "http",
        "middleware" => [
            Generic::redirect(Config::getUrl("site_url", "login"))
        ],
    ],
    "account" => require("routes/account.php"),
    "company_checks" => require("routes/company.php"),
    "logout" => [
        "type" => "http",
        "middleware" => [
            Session::destroy(),
            Session::unsetCookie(strval($sessionCookie->get("name")), $sessionCookie),
            $loginRedirect
        ],
    ],
    "social-portal" => [
        "type" => "http",
        "middleware" => [
            $reactSocialPortalTemplate
        ],
    ],
    "supply-chain-portal" => [
        "type" => "http",
        "actions" => [
            [
                "key" => "^token\/(?<token>[0-9a-z]+)$",
                "middleware" => [
                    AccountMiddleware::existsByToken("uriArgs.token", "supply_chain"),
                    AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                    function ($a) {
                        $accountFromToken = $a->get("account");
                        if ($accountFromToken) {
                            $subscriptions = $a->get("account_subscriptions");
                            $account = $accountFromToken->getShape("account");
                            $membership = $account->get("membership");
                            $idSubscription = intval($membership["subscription_id"]);
                            $idExternalSubcontractor = intval($subscriptions->filterByField('uid', 'activated_supply_chain')->getFirst()->get("id"));
                            if ($idSubscription === $idExternalSubcontractor) {
                                $a->set("company_already_active", true);
                            }
                        }
                    },
                    Conditional::hasKey('company_already_active', [
                        Generic::redirect(Config::getUrl("site_url", "sign-up/contact-already-active"))
                    ], [
                        function ($a) {
                            $supply_chain      = $a->get("account");
                            $account           = $supply_chain->get("account");
                            $supply_chain_data = $supply_chain->json("meta");
                            $a->set("contractor_aid", $supply_chain_data['contractor_aid']);
                            $a->set("subcontractor_aid", $account['id']);
                            $a->set("subcontractor_id", $supply_chain->get("user.id"));
                            Rest::fetchDynamic(
                                "account_v2",
                                "account/{contractor_aid}/supply-chain/{subcontractor_aid}/user/{subcontractor_id}",
                                [],
                                "subcontractor_supply_chain"
                            )($a);

                            $a->set("supply_chain_form_data", json_encode([
                                'company_id'                => $supply_chain_data['contractor_aid'],
                                'company_name'              => $account['name'],
                                'email'                     => $a->get("subcontractor_supply_chain.email"),
                                'company_address'           => $account['address'],
                                'telephone'                 => $a->get("subcontractor_supply_chain.contact_number"),
                                'contact_name'              => $a->get("subcontractor_supply_chain.display_name"),
                                'registered_company_number' => $account['reg_number'],
                                'subcontractor_account_id'  => (int)$account['id'],
                                'subcontractor_user_id'     => $a->get("subcontractor_id")
                            ], JSON_HEX_APOS));
                            $token = $a->get("uriArgs.token");
                            $a->set("supply_chain_activation_url", Config::getUrl("supply_chaib_activation_url", $token));
                        },
                        $supplyChainPortalTemplate
                    ]),
                ]
            ],
            [
                "key" => "^activate\/(?<token>[0-9a-z]+)$",
                "method" => "post",
                "middleware" => [
                    ProsperAccountMiddleware::activateProsperAccount(),
                    function ($a) {
                        $not_activated = $a->int("account.account.membership.subscription_id") === ProsperAccountMiddleware::EXTERNAL_NOT_ACTIVATED;
                        AccountMiddleware::loadById("account.account.id", "account_data")($a);
                        // If the account is not activated, we need to get the subcontractor pending contacts and send the confirmation mail to the owner
                        AccountMiddleware::loadById("main_contractor_aid", "main_contractor")($a);
                        if($not_activated) {
                            //get all pending contacts
                            $contacts = $a->get("account_data.users");
                            $pending_contacts = array_filter($contacts, fn($item) => isset($item['status']) && (int)$item['status'] === 1);
                            $main_contractor_users = $a->get("main_contractor.users");
                            $main_contractor_user = array_shift($main_contractor_users);
                            foreach($pending_contacts as $contact){
                                $a->set("payload", new Shape([
                                    "user_id"      => $contact['id'],
                                    "email"        => $a->get("account_data.email"),
                                    "contact_email" => $contact["email"],
                                    "firstname"    => $contact['firstname'],
                                    "subcontractor_name" => $a->get("account_data.name"),
                                    "company_name" => $a->get("account_data.name"),
                                    "contractor" => [
                                        "company" => $a->get("main_contractor.name"),
                                        "name" => $main_contractor_user['firstname']
                                    ],
                                    "email_data"   => ["template" => "confirmation"]
                                ]));
                                ApiEmailMiddleware::sendSupplyChainEmail()($a);
                            }
                        }
                    },
                    function ($a) {
                        Generic::redirect($a->get("redirect_to"))($a);
                    }
                ]
            ],
        ],
    ],
    "login" => [
        "type" => "http",
        "onError" => [
            "authError" => function (MiddlewareException $error) use ($loginRedirect) {
                Session::setMessage("Invalid username or password", "error");
                $loginRedirect();
            },
            "formValidation" => $loginRedirect,
            "accountInactive" => function (MiddlewareException $error) use ($loginRedirect) {
                Session::setMessage("Account Inactive, please activate via welcome email", "error");
                $loginRedirect();
            }
        ],
        "middleware" => [
            Session::exists(Generic::redirect(Config::getUrl("site_url", "dashboard"))),
        ],
        "default_action" => ["middleware" => [$loginRedirect]],
        "actions" => [
            [
                "key" => "index",
                "middleware" => [
                    Session::CsfrInit(),
                    $reactTemplate
                ]
            ],
            [
                "key" => "^validate$",
                "method" => "POST",
                "middleware" => [
                    Session::CsfrValidate(),
                    Form::validate(FormValidation::getSignature("login")),
                    Session::Login(),
                    Session::count(),
                    Session::incrementUsage(),
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
            AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
            function ($a) {
                $a->set(
                    "activated_supply_chain_subscription",
                    $a->get("account_subscriptions")->filterByField('uid', "activated_supply_chain")->first()
                );
            },
            Conditional::isEqual("session.account.membership.subscription_id", "activated_supply_chain_subscription.id", [
                Generic::redirect(Config::getUrl("site_url", "projects/enquiries"))
            ]),
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
        ],
        "actions" => [["key"    => ".*"]]
    ],
    "my-company" => [
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
    "company_profile" => [
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
    "forgot-password" => [
        "type" => "http",
        "onError" => [],
        "middleware" => [
            $reactTemplate
        ],
        "actions" => [["key"    => ".*"]]
    ],
    "inbox" => [
        "key" => "^inbox$",
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
    "inbox-app" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            Session::validate(),
            TemplateLoader::load(
                "page/react.php",
                "core",
                ["react_url" => Config::get("react_url_v1"), "react_app" => "comms"]
            )
        ],
        "actions" => [["key"    => ".*"]]
    ],
    "subcontractor" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::notAuthorised()
        ],
        "middleware" => [
            Session::validate(),
        ],
        "actions" => [
            [
                "key" => "info",
                "middleware" => [
                    AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                    ProjectMiddleware::loadTrades(),
                    CompanyProfileMiddleware::loadRegions(),
                    CompanyProfileMiddleware::filterRegionsByAccountRegionId(),
                    ProsperAccountMiddleware::loadSubcontractorData(),
                    function($a){
                        $a->set("aid", $a->getShape("session.account")->get("id"));
                        CompanyProfileMiddleware::loadCompanyRegions()($a);
                    },
                    CompanyProfileMiddleware::updateOfferingsLabel(['regions']),
                    Conditional::isTrue($freeTrialRandomGroupEnabled, [
                        function($a) use ($freeTrialRandomGroups){
                            $a->set("membershipGroup", $freeTrialRandomGroups[random_int(0, count($freeTrialRandomGroups) - 1)]);
                        },
                    ]),
                    TokenHistoryMiddleware::getTokenUsedHistoryCount(),
                    function($a){
                        $a->setItems([
                            'free_tokens_amount' => Config::get("prosper_pro.free_tokens_amount"),
                            'top_up_tokens'      => Config::get("tokens.top_up"),
                            'current_week'       => date("W"),
                        ]);
                    },
                    ProsperAccountMiddleware::hasTopUpTokens(),
                    ProsperAccountMiddleware::canClaimFreeToken(),
                    ProsperAccountMiddleware::hasTopUpTokens(),
                    function ($a) {

                        /**
                         * @TODO refactor this with the new DB scheme
                         */
                        $aid = $a->get("aid");
                        AccountMiddleware::load("feature/accounts/$aid", "", "features_flag")($a);
                        $features = [];
                        $a->get("features_flag")->map(function($feature) use (&$features){
                            $features[] = [
                                'id'   => $feature->get("feature_id"),
                                'name' => $feature->get("feature")
                            ];
                            return $feature;
                        });
                        $a->set("features", $features);
                    },
                    AccountMiddleware::load("region/group", '', 'countries'),
                    Generic::set("json",  function ($action) {
                        $user = $action->getShape("session")->getShape("user");
                        $membership = $action->getShape("session.account.membership");
                        $account = $action->getShape("session.account");

                        $contractorId = null;
                        $meta = $account->get("meta");
                        $meta = json_decode($meta, true);
                        if ($meta) {
                            $contractorIds = array_keys($meta);
                            $contractorId = array_shift($contractorIds);
                        }

                        $tradesIds = Manager::getService('account')->fetch("account/" . $account->get("id") . "/trades")->getCollection('data');
                        $trades = [];

                        $unlockedProjects = [];
                        if ($user) {
                            $result = ProsperAccountMiddleware::getUnlockedProject([
                                'account_id' => intval($user->get("account_id")),
                                'user_id' => intval($user->get("id"))
                            ]);
                            $unlockedProjects = $result->values("project_id");
                        }

                        foreach ($tradesIds->values("trade_id") as $idTrade) {
                            $trade_exist = $action->get('trades')->filterByField('id', intval($idTrade), cast: 'int');
                            if ($trade_exist->count()) {
                                $trades[$idTrade] = $trade_exist->getItems();
                            }
                        }

                        $membership_meta = $membership->json("meta");
                        if(!$membership_meta['group']){
                            $membership_meta['group'] = $action->get("membershipGroup");
                        }

                        $tokens_checkout = (new Collection(Config::getArray("services.stripe.subscriptions"), Shape::class))->filterByField('group', $membership_meta['group']);
                        $tokens_data = array_map(function ($item) {
                            return [
                                'tokens_received' => $item['tokens_received'],
                                'price'           => $item['price'],
                                'label'           => $item['label'],
                                'checkout_url'    => Config::get('buy_tokens_url') . $item['id']
                            ];
                        }, $tokens_checkout->getItemsAsArray());

                        $subscription_id = $action->getCollection("account_subscriptions")->filterByField("uid", 'activated_supply_chain')->getFirst()->get("id");
                        $prosper_pro_banner = false;
                        if($account->get("membership.subscription_id") === $subscription_id){
                            EnquiriesMiddleware::loadTransactionsBySubcontractorId("session.account.id")($action);
                            $prosper_pro_banner = !empty($action->get("transactions"));
                        }

                        $action->set("hubspot_email", $user->get("email"));
                        HubspotMiddleware::loadContactDataByEmail("hubspot_email")($action);
                        $subscribedHowToWork = $action->get("loaded_hubspot_data");

                        return json_encode(
                            [
                                "id"         => intval($user->get("id")),
                                "account_id" => intval($user->get("account_id")),
                                "account_owner" => TeamManagerModel::isAccountOwner($user),
                                "contractor_id" => $contractorId,
                                "firstname"  => $user->get("firstname"),
                                "lastname"   => $user->get("lastname"),
                                "how_to_win_work_opted" => $subscribedHowToWork,
                                "job_description"   => $user->get("job_title"),
                                "display_name" => $user->get("display_name"),
                                "email"        => $user->get("email"),
                                "subscription_id" => intval($membership->get("subscription_id")),
                                "membership"      => $membership_meta,
                                "token_prices"    => $tokens_data,
                                "company_name"    => $account->get("name"),
                                "created_at"      => $account->get("created_at"),
                                "trades"          => $trades,
                                "regions"         => $action->get("company_information.regions"),
                                "prosper_pro_banner" => $prosper_pro_banner,
                                "can_claim_free_tokens" => $action->get("can_claim", false),
                                "unlocked_projects" => $unlockedProjects,
                                "tokens_top_up" => $action->get("top_up", 0),
                                "country" => $action->get("countries")->filterByStringField("id", $account->int("region_group_id"))->first(),
                                "features" => $action->get("features")
                            ]
                        );
                    })
                ]
            ]
        ]
    ],
    "change-password" => [
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
    "tokens" => [
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
    "resources" => [
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
    "promo" => [
        "type" => "http",
        "actions" => [
            [
                "key" => "^award_token$",
                "method" => "post",
                "middleware" => [
                    function ($a) {
                        $json = $a->getRoute()->getRequest()->getJson();
                        $res = Manager::getService('hubspot')->write("webhook/award_token?api_token=promo_tokens", $json);
                        $content = $res->get("content");
                        $success = $res->getShape("info")->get("http_code") === 200;
                        $response = $content ? json_decode($content, true) : "";
                        $a->set("success", $success);
                        $a->set("token_url", $response["success"]);
                    },
                    Generic::set("json",  function ($a) {
                        return json_encode([
                            "success" => $a->get("success"),
                            "token_url" => $a->get("token_url")
                        ]);
                    })
                ]
            ],
            [
                "key" => "^token\/(?<token>[0-9a-z]+)$",
                "onError" => [
                    "invalidToken" => function () {
                        Generic::redirect(Config::getUrl("site_url", "promo/invalid_token"))();
                    },
                ],
                "middleware" => [
                    AccountMiddleware::existsByToken("uriArgs.token", "promo"),
                    function ($a) {
                        $tokenAccount = $a->get('account');
                        $aid = $tokenAccount ? $tokenAccount->get("user.account_id") : 0;
                        AccountMiddleware::getService()->update("account/$aid", new Shape([
                            'data' => ['status' => 1]
                        ]));

                        $active = $tokenAccount ? intval($tokenAccount->get("active")) : false;
                        if ($active) {
                            $tokenCode = $a->get("uriArgs.token");
                            $token = $tokenAccount ? $tokenAccount->json("meta") : [];
                            $tokenAward = $token['token_award'] ?? 0;
                            SubcontractorMiddleware::creditToken("token_award", $tokenAward)($tokenAccount);
                            $tokenAccount->set("promo_token_code", $tokenCode);
                            $a->set("account", $tokenAccount);
                        }
                    },
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    function ($a) {
                        $tokenAccount = $a->get('account');
                        $usedPromo = $tokenAccount ? $tokenAccount->get("promo_token_already_used") : false;
                        if ($usedPromo) {
                            $promoTokenCode = $tokenAccount->get("promo_token_code");
                            //Create an autologin token and loged in the user
                            $loader_url = Config::getUrl("site_url", "account/auto_loader");
                            AccountMiddleware::createUserToken(
                                "account.user.id",
                                "token_type",
                                $loader_url
                            )($a);
                            Generic::redirect(sprintf("%s/redirect=promo/valid_token?token=$promoTokenCode", $a->get("token_url")))();
                        }
                    }
                ]
            ],
            [
                "key" => "^valid_token$",
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
            [
                "key" => "^invalid_token$",
                "type" => "http",
                "middleware" => [
                    $reactTemplate
                ],
                "actions" => [["key"    => ".*"]]
            ]
        ]
    ],
    "sign-up" => [
        "type" => "http",
        "onError" => [
            "noSession" => Generic::redirect(Config::getUrl("site_url", "login"))
        ],
        "middleware" => [
            $reactTemplate
        ],
        "actions" => [
            [
                "key"    => ".*"
            ],
            [
                "key" => "^thank-you",
                "type" => "http",
                "middleware" => [
                    Session::validate()
                ]
            ],
            [
                "key" => "^contact-already-active",
                "type" => "http",
            ]
        ]
    ],
];
