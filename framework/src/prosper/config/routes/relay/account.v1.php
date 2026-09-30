<?php

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Conditional;
use Core\Middleware\Generic;
use Core\Middleware\GoogleMaps;
use Core\Middleware\Session;
use Core\Middleware\TemplateLoader;
use Core\Service\Manager;
use Core\Middleware\Service\AccountMiddleware;
use Prequalification\Middleware\PrequalificationMiddleware;
use Prosper\Middleware\EmailMiddleware;
use Prosper\Middleware\Relay;
use Prosper\Middleware\Relay\User;
use Prosper\Middleware\Relay\TokenHistoryMiddleWare;
use Prosper\Middleware\Relay\OpportunitiesMiddleware;
use Prosper\Middleware\Relay\ProjectMiddleware;
use Prosper\Middleware\Relay\TradeMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Prosper\Middleware\AccountMiddleware as ProsperAccountMiddleware;
use Core\Middleware\Form;
use Prosper\Form\Validation as FormValidation;
use CompanyProfile\Middleware\CompanyProfileMiddleware;

$referenceTemplate = TemplateLoader::load(
    "page/react.php",
    "core",
    ["react_url" => Config::get("react_url"), "react_app" => "prosper"]
);

$regionCode = Config::get("region_code");

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("account")],
    "middleware" => [],
    "type" => "http",
    "onError" => [
        "relayError" => function ($e, $a) {
            $a->set("json", $e->getMessage());
        },
        "onError" => [
            "noSession" => Generic::notAuthorised()
        ],
    ],
    "actions" => [
        [
            "key"  => "trades",
            "method" => "GET",
            "middleware" => [
                AccountMiddleware::load("trade_category", ""),
                TradeMiddleware::loadTradeCategories("account_trade_categorys"),
                Generic::set("json",  function ($action) {
                    return json_encode(["data"  => $action->get("account_trade_categorys")]);
                }),
            ]
        ],
        [
            "key"  => "regions",
            "method" => "GET",
            "middleware" => [
                AccountMiddleware::load("region/group", '', 'countries'),
                function($action) use ($regionCode) {
                    $args = $action->getRoute()->getRequest()->getArgs();
                    $idGroup = $args->get("group", $regionCode);
                    $code = $action->get("countries")->filterByField("id", $idGroup);
                    $code = $code->count() ? $code->first()->get("code") : $regionCode;
                    $country = $action->get("countries")->filterByField("code", $code);
                    if ($country && $country->count()) {
                        $country = $country->first();
                        $countryId = $country->get("id");
                        $action->set("region_group_id", $countryId);
                    }
                },
                ProjectMiddleware::loadRegions("region_group_id"),
                Generic::set("json",  function ($action) {
                    return json_encode(["data" => $action->get("regions")->getItemsAsArray()]);
                }),
            ]
        ],
        [
            "key"  => "opportunity",
            "method" => "POST",
            "middleware" => [
                function ($a) {
                    $data = $a->getRoute()->getRequest()->getData();
                    $json = $data->getShape("json");
                    $a->setItems([
                        'regions_ids' => $json->get("data.regions", []),
                        'trade_ids'   => $json->get("data.trades",  []),
                    ]);
                },
                OpportunitiesMiddleware::loadCollection(),
                AccountMiddleware::load("trade", "", "trades"),
                AccountMiddleware::load("trade_category", ""),
                TradeMiddleware::getTradesForParentCategory('trade_ids', 'account_trade_categorys', 'trade_ids'),
                function ($a) {
                    $a->set("subcontractor", [
                        'trades'  => $a->get("trade_ids"),
                        'regions' => $a->get("regions_ids"),
                    ]);
                },
                OpportunitiesMiddleware::reduceByAccountTrades(),
                OpportunitiesMiddleware::reduceByAccountRegion(),
                OpportunitiesMiddleware::loadProjectTenderData(),
                OpportunitiesMiddleware::checkByTenderHistory(),
                OpportunitiesMiddleware::loadLiveTenders(),
                OpportunitiesMiddleware::loadOpportunitiesTotal("opportunities"),
                Generic::set("json",  function ($action) {
                    $opportunities = $action->get("opportunities", 0);
                    return json_encode(["data" => [
                        "opportunities" => $opportunities,
                        "value"         => $opportunities * intval(Config::get("tender_worth_value"))
                    ]]);
                }),
            ]
        ],
        [
            "key"  => "(?<id>[0-9]{1,7})\/company\/(?<pid>[0-9]{1,7})$",
            "method" => "GET",
            "middleware" => [
                Session::validate(),
                function ($action) {
                    $action->set('aid', $action->getShape("session")->getShape("user")->get("account_id"));
                },
                TenderMiddleware::hasHistoryRelationship("aid", "uriArgs.id", "valid_access"),
                Conditional::switched(
                    "valid_access",
                    [],
                    [
                        AccountMiddleware::existInSupplyChain("aid", "uriArgs.id", "valid_access"),
                    ]
                ),
                Conditional::switched(
                    "valid_access",
                    [],
                    [
                        TokenHistoryMiddleWare::isUnlockedProject("aid", "uriArgs.pid", "valid_access"),
                    ]
                ),
                Generic::set("json",  function ($action) {
                    if (!$action->get("valid_access", false)) {
                        return json_encode(["error"  => "Access denied"]);
                    }
                    try {
                        $account = Manager::getService("account")->fetch("account/" . $action->get("uriArgs.id"))->getShape('data');
                    } catch (\Exception $e) {
                        $account = null;
                    }
                    return json_encode(["data"  => $account]);
                }),
            ]
        ],
        [
            "key"  => "unlock_project$",
            "method" => "POST",
            "middleware" => [
                Session::validate(),
                function ($action) {
                    $user = $action->getShape("session")->getShape("user");
                    $action->set('aid', $user->get("account_id"));
                    $action->set('uid', $user->get("id"));

                    $data = $action->getRoute()->getRequest()->getData();
                    $json = $data ? $data->getShape("json") : null;
                    $action->set("pid", $json ? $json->get("pid") : 0);
                },
                User::updateMembershipTokens(),
                TokenHistoryMiddleware::getTokenHistory(),
                TokenHistoryMiddleware::useToken(),
                Generic::set("json",  function ($action) {
                    return json_encode(["success" => $action->get("new_project_unlocked")]);
                }),
            ]
        ],
        [
            "key" => "update_subscription\/(?<aid>[0-9]{1,7})\/(?<id_subscription>[0-9]{1,7})$",
            "method" => "PATCH",
            "middleware" => [
                AccountMiddleware::updateSubscription("account", new Shape(["resource" => "account/membership"])),
                Generic::set("json",  function () {
                    return json_encode(["success" => true]);
                }),
            ]
        ],
        [
            "key"  => "prosper_pro_upgrade$",
            "method" => "POST",
            "middleware" => [
                Session::validate(),
                AccountMiddleware::loadTypes(),
                AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                ProsperAccountMiddleware::loadSubcontractorData(),
                function($a){
                    $account = $a->getShape("session")->getShape("account");
                    $user = $a->getShape("session")->getShape("user");
                    $user_types    = Manager::getService('account')->fetch('user/type')->getCollection('data');
                    $subscription_id = $a->getCollection("account_subscriptions")->filterByField("uid", 'activated_supply_chain')->getFirst()->get("id");
                    $flexi_label =  $a->getCollection("account_subscriptions")->filterByField("uid", 'flexi')->getFirst()->get("label");
                    if ($account->get("membership.subscription_id") === $subscription_id) {
                        ProsperAccountMiddleware::setMembership($flexi_label, "subcontractor.aid")($a);
                        $a->setItems([
                            'can_upgrade' => true,
                            "account_id"  => $account->get("id"),
                            'type_id'     => $a->getCollection("account_types")->filterByField("label", "specialist")->getFirst()->get("id"),
                            "user_id"     => $user->get("id"),
                            "user_type_id" => $user_types->filterByField('label', 'team_admin')->getFirst()->get('id'),
                        ]);

                        EmailMiddleware::send("Prosper Pro Upgrade",[
                            "sender" => $user,
                            "extra"  => new Shape([
                                'member_first_name' => $a->get("user_data.firstname"),
                                'first_name'        => $a->getShape("session")->getShape("user")->get("firstname"),
                                'name'              => $a->getShape("session")->getShape("account")->get("name")
                            ])
                        ]
                        )($a);
                    }
                },
                Conditional::isset("can_upgrade", [
                    function ($a) {
                        ProsperAccountMiddleware::updateAccountType("account_id", "type_id")($a);
                        ProsperAccountMiddleware::updateAccountType("user_id", "user_type_id", "user", "/profile")($a);
                    }
                ]),
                Generic::set("json",  function ($action) {
                    return json_encode(["data" => ["success" => true]]);
                }),
            ]
        ],
        [
            "key"  => "free_token_claim$",
            "method" => "POST",
            "middleware" => [
                Session::validate(),
                AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                ProsperAccountMiddleware::loadSubcontractorData(),
                function($a){
                    $a->setItems([
                        'top_up_tokens' => Config::get("tokens.top_up"),
                        'current_week'  => date("W"),
                    ]);
                },
                ProsperAccountMiddleware::hasTopUpTokens(),
                ProsperAccountMiddleware::canClaimFreeToken(),
                ProsperAccountMiddleware::hasTopUpTokens(),
                Conditional::isset("can_claim",[
                    function($a){
                        ProsperAccountMiddleware::setMembershipTokens($a->get("top_up_tokens"), 'subcontractor.aid', 'current_week')($a);
                    }
                ]),
                Generic::set("json",  function ($action) {
                    return json_encode(["data" => ["success" => $action->get("can_claim", false)]]);
                }),
            ]
        ],
        [
            "key" => "reference\/token\/(?<token>[0-9a-z]+)$",
            "method" => "GET",
            "middleware" => [
                AccountMiddleware::existsByToken("uriArgs.token", "prosper_reference"),
                function ($a) {
                    $reference = $a->get("account");
                    $account = $reference->get("account");
                    $a->set('aid', $reference->get("account.id"));
                    $token_meta = json_decode($reference->get("meta", ''), true);
                    $a->set("reference_id", $token_meta['reference_id'] ?? null);
                    PrequalificationMiddleware::loadCollection("aid")($a);
                    PrequalificationMiddleware::loadReferences("reference_id")($a);
                    $references = $a->get("prequalification.references");
                    $a->set("reactData", json_encode([
                        'project'                  => $references['project_name'],
                        'client'                   => $references['client_name'],
                        'email'                    => $references['contact_email'],
                        'value'                    => $references['contract_value'],
                        'completion_date'          => $references['completion_date'],
                        'description_of_works'     => $references['sow'],
                        'subcontractor_account_id' => (int)$account['id'],
                        'subcontractor_user_id'    => $account['user_id'] ?? null,
                        'subcontractor_name'       => $account['name'] ?? null,
                    ], JSON_HEX_APOS | JSON_INVALID_UTF8_SUBSTITUTE));
                    $token = $a->get("uriArgs.token");
                    $a->set("reference_activation_url", Config::getUrl("reference_activation_url", $token));
                },
                $referenceTemplate
            ]
        ],
        [
            "key" => "reference\/activate\/(?<token>[0-9a-z]+)$",
            "method" => "POST",
            "middleware" => [
                AccountMiddleware::loadTokenTypes("prosper_reference"),
                AccountMiddleware::loadSubscriptions(intval(Config::get("website_id.prosper"))),
                Form::validateJson(FormValidation::getSignature("prosper_reference")),
                AccountMiddleware::existsByToken("uriArgs.token", "prosper_reference"),
                PrequalificationMiddleware::loadSections(),
                function ($a) {
                    $meta = json_decode($a->get("account.meta", ''), true);
                    $aid = $a->get("account.account.id");
                    $summary = $a->get("validated_form")->get("summary");
                    $a->setItems([
                        'aid'              => $aid,
                        'section_id'       => $a->get("sections")->filterByField("label", 'references')->getFirst()->get("id"),
                        'section_message'  => $summary,
                        'reference_id'     => $meta['reference_id'] ?? null,
                        'reference_status' => ['status' => 'approved', 'client_summary' => $summary]
                    ]);
                    $message = $a->get('section_message');
                    PrequalificationMiddleware::updateSectionStatus('section_id', true, $message)($a);
                    if($a->get("reference_id")){
                        PrequalificationMiddleware::updateReference("reference_id", 'reference_status')($a);
                    }
                },
            ]
        ],
        [
            "key"  => "distance\/projects$",
            "method" => "POST",
            "middleware" => [
                Session::validate(),
                function($a){
                    $a->set("aid", $a->getShape("session")->getShape("account")->get("id"));
                },
                CompanyProfileMiddleware::loadCollection("aid"),
                CompanyProfileMiddleware::loadCompanyInformation(),
                function ($a) {
                    $address = $a->get("company_information.operating_company_address");
                    if(!$address){
                        $address = $a->getShape("session")->getShape("account")->get("address");
                    }
                    $a->setItems([
                        'projects' => $a->getRoute()->getRequest()->getJson()->get("projects"),
                        'origin'   => $address,
                    ]);
                },
                ProjectMiddleware::loadProjects('projects'),
                ProsperAccountMiddleware::loadDistances(),
                ProjectMiddleware::calculateDistances(),
                function ($a) {
                    $destinations = $a->get("destinations", []);
                    $distance     = $a->get("distance", []);
                    $projects     = $a->get("projects", []);
                    try {
                        if ($destinations) {
                            $origins = array_fill(0, count($destinations), $a->get("origin"));
                            $addresses = [
                                'origin'      => $origins,
                                'destination' => $destinations
                            ];
                            $distance_find = GoogleMaps::getDistances($addresses['origin'], $addresses['destination'])($a);
                            ProsperAccountMiddleware::addDistances($distance_find)($a);
                            $distances = array_merge($distance, $distance_find);
                            $a->set("distance", array_map(function($id, &$item) use ($projects) {
                                if(!isset($item['project_id']) && !$item['project_id']) {
                                    $item['project_id'] = $projects[$id] ?? null;
                                }
                                return $item;
                            }, array_keys($distances), $distances));
                        }
                    } catch (\Exception $e) {
                        $a->set("distance", null);
                    }
                },
                Generic::set("json",  function ($action) {
                    $distance = $action->get("distance");
                    return json_encode(['data' => ["success" => (bool)$distance, 'distance' => $distance]]);
                }),
            ]
        ]
    ]
];
