<?php

use Admin\Middleware\Relay;
use Admin\Middleware\Relay\Account;
use Prequalification\Middleware\PrequalificationMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Prosper\Middleware\Relay\OpportunitiesMiddleware;
use Prosper\Middleware\Relay\ProjectMiddleware;
use Prosper\Middleware\AccountMiddleware as ProsperAccountMiddleware;
use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Conditional;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Core\Middleware\Form;
use Admin\Form\Validation as FormValidation;
use Api\Middleware\EmailMiddleware;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\UserMiddleware;
use Core\Data\Collection as CollectionClass;
use Core\Middleware\Rest;
use Prosper\Middleware\Relay\EnquiriesMiddleware;
use Core\System\Environment as E;

$prosperWebsiteId = Config::get("website_id.prosper");
$subcontractor_type_ids   = [3, 4];
$region_code_id           = E::get("REGION_CODE_ID", 1);
$subscription_id          = 15; //external_subcontractor
$user_status_pending_id   = 1; //pending
$organisation_default_role = 1; //CEO/Managing Director

return [
    "key"   => "^relay$",
    "rules" => [Relay::isResource("account")],
    "type" => "http",
    "onError" => [
        "relayError" => function ($e, $a) {
            $a->set("json", $e->getMessage());
        },
        "noSession" => Generic::notAuthorised(),
        "conflict" => Generic::exceptionResponse("HTTP/1.0 409"),
        "badRequest" => Generic::exceptionResponse("HTTP/1.0 400"),
    ],
    "middleware" => [
        Session::validate()
    ],
    "actions" => [
        [
            "key"    => "account",
            "method" => "post",
            "onError" => [
                "failedCreateAccount" => function (MiddlewareException $ex) {
                    error_log($ex->getMessage());
                    Generic::set("json",  function () {
                        return json_encode(["success" => false]);
                    });
                }
            ],
            "middleware" => [
                Form::validateJson(FormValidation::getSignature("new_account")),
                Form::sanitizeData(),
                AccountMiddleware::loadByName("validated_form.company_name", "company_name_exist"),
                Conditional::hasKey(
                    "company_name_exist",
                    [
                        function ($a) {
                            $a->set("error", 'Company name exist');
                        },
                    ]
                ),
                AccountMiddleware::loadByEmail("validated_form.company_email", "company_email_exist"),
                Conditional::hasKey(
                    "company_email_exist",
                    [
                        function ($a) {
                            $a->set("error", 'Company email exist');
                        },
                    ]
                ),
                UserMiddleware::loadByEmail("validated_form.email", "user_email_exist"),
                Conditional::hasKey(
                    "user_email_exist",
                    [
                        function ($a) {
                            $a->set("error", 'User email exist');
                        },
                    ]
                ),
                Conditional::hasKey(
                    "error",
                    [
                        Generic::set("json",  function ($a) {
                            return json_encode(["success" => false, 'error' => $a->get("error")]);
                        })
                    ],
                    [
                        function ($a) {

                            $service = Manager::getService('account');
                            $account_types = $service->fetch('account/type')->getCollection('data');
                            $user_types    = $service->fetch('user/type')->getCollection('data');
                            $a->set("type_id", [
                                'account' => $account_types->filterByField('label', 'main-contractor')->getFirst()->get('id'),
                                'user'    => $user_types->filterByField('label', 'team_admin')->getFirst()->get('id')
                            ]);
                        },
                        Account::createContractor("account", new Shape(["resource" => "account"])),
                        Generic::set("json",  function () {
                            return json_encode(["success" => true]);
                        }),
                    ]
                ),


            ]
        ],
        [
            "key"    => "account\/type$",
            "middleware" => [
                Relay::passthru("account", new Shape(["resource" => "account/type"]))
            ]
        ],
        [
            "key"    => "account\/(?<id>[0-9]{1,7})$",
            "middleware" => [
                Relay::resourceByKey("account", new Shape(["resource" => "account"]))
            ]
        ],
        [
            "key"    => "account\/subscription$",
            "middleware" => [
                Relay::passthru("account", new Shape(["resource" => "account/subscription"]))
            ]
        ],
        [
            "key"    => "account\/subscription\/(?<website_id>[0-9]{1,7})$",
            "middleware" => [
                Relay::resourceByKey("account", new Shape(["resource" => "account/subscription/website"]), "website_id")
            ]
        ],
        [
            "key" => "account\/update_subscription\/(?<aid>[0-9]{1,7})\/(?<id_subscription>[0-9]{1,7})$",
            "method" => "PATCH",
            "middleware" => [
                AccountMiddleware::updateSubscription("account", new Shape(["resource" => "account/membership"])),
                Generic::set("json",  function () {
                    return json_encode(["success" => true]);
                }),
            ]
        ],
        [
            "key"    => "account\/list$",
            "middleware" => [
                Generic::collectUrlArguments([
                    "limit"  => 100,
                    "offset" => 0,
                    "order" => "created_at",
                    "desc" => true,
                    "query"  => null,
                    "region" => "",
                    "trade" => "",
                    "subscriptions" => "",
                    "type"   => 0,
                    "status"   => -1,
                    "accounts" => false
                ]),
                Relay::load("account", new Shape(["resource" => "account/list"])),
                Account::flatten(),
                Relay::map("links", ["count" => "total"], "info"),
                Relay::setJsonResponse(["data", "info"])
            ]
        ],
        [
            "key" => "account\/fetch-action$",
            "method" => "GET",
            "middleware" => [
                Generic::collectUrlArguments([
                    "limit"  => 100,
                    "offset" => 0,
                    "action_type" => null,
                    "action_date" => null,
                ]),
                Relay::load("account", new Shape(["resource" => "account-actions/fetch-action"])),
                Relay::map("links", ["count" => "total"], "info"),
                Relay::setJsonResponse(["data", "info"])
            ]
        ],
        [
            "key" => "account\/toggle_status\/(?<aid>[0-9]{1,7})$",
            "method" => "PATCH",
            "middleware" => [
                Account::updateAccount("account", new Shape(["resource" => "account"]), "status"),
                Generic::set("json",  function () {
                    return json_encode(["success" => true]);
                }),
            ]
        ],
        [
            "key" => "account\/toggle_first_pqq_sent\/(?<aid>[0-9]{1,7})$",
            "method" => "PATCH",
            "middleware" => [
                Account::updateAccount("account", new Shape(["resource" => "account"]), "first_pqq_sent"),
                Generic::set("json",  function () {
                    return json_encode(["success" => true]);
                }),
            ]
        ],
        [
          "key" => "account\/activities\/(?<aid>[0-9]{1,7})$",
          "middleware" => [
            OpportunitiesMiddleware::loadActivities(),
            Generic::set("json",  function ($action) {
              return json_encode(["data" => $action->get("activities")]);
            }),
          ]
        ],
        [
          "key" => "account\/opportunities\/(?<aid>[0-9]{1,7})$",
          "middleware" => [
            OpportunitiesMiddleware::loadCollection(),
            ProjectMiddleware::loadConstants(),
            ProjectMiddleware::loadRegions(),
            ProjectMiddleware::loadTrades(),
            AccountMiddleware::loadSubscriptions($prosperWebsiteId),
            TenderMiddleware::loadHistoryTypes(),
            ProsperAccountMiddleware::loadSubcontractorData(),
            OpportunitiesMiddleware::reduceByAccountTrades(),
            OpportunitiesMiddleware::reduceByAccountRegion(),
            OpportunitiesMiddleware::reduceByTenderHistory(),
            OpportunitiesMiddleware::sort(),
            OpportunitiesMiddleware::loadProjectTenderData(),
            OpportunitiesMiddleware::checkByTenderHistory(),
            PrequalificationMiddleware::loadSections(),
            ProjectMiddleware::checkPrequalification(),
            OpportunitiesMiddleware::loadLiveTenders(),
            OpportunitiesMiddleware::loadOpportunities(),
            Generic::set("json",  function ($action) {
              return json_encode(["data" => $action->get("opportunities")]);
            }),
          ]
        ],
        [
            "key" => "account\/engagement\/(?<aid>[0-9]{1,7})$",
            "middleware" => [
                function($a){
                    //Load all users from an account
                    $uids = Manager::getService('account')->fetch("account/" . $a->get("uriArgs.aid"))->getCollection('data.users')->values("id");
                    $a->set("uids", "[".implode(",", array_unique($uids))."]");
                },

                //Load all history by user ids
                EnquiriesMiddleware::getHistorySentByAuthorIds(),

                //Load all tenders by contractor user ids as the transaction table only stores the tender id and not the contractor id
                ProjectMiddleware::loadProjectsTenderIdsByContractor(),

                //Load all transactions based on tenders ids
                EnquiriesMiddleware::getTransactionsByTenderIds("project_tenders.tender_ids"),

                //Load all ids so we can bulk retrieve data for them (projects, contractors, subcontractors)
                function($a){
                    $projects_collection = new CollectionClass($a->get("project_tenders.project"), Shape::class);
                    $enquiries = $a->get("enquiries");
                    $transactions = $a->get("transactions");
                    $a->setItems([
                        'projects' => $projects_collection,
                        'contractor_aids' => array_unique(
                            array_filter(
                                array_merge(
                                    $enquiries ? $enquiries->values("author_id") : [],
                                    $projects_collection->values("author")
                                )
                            )
                        ),
                        "aids" => array_unique(
                            array_filter(
                                array_merge(
                                    $enquiries ? $enquiries->values("specialist_id") : [],
                                    $transactions ? $transactions->values("subcontractor_id") : [],
                                    [$a->get("uriArgs.aid")]
                                )
                            )
                        )
                    ]);
                },

                //Load all accounts by ids
                AccountMiddleware::loadAccountsByIdArray("aids"),

                //Load all users by ids
                UserMiddleware::loadUsersByIdArray("contractor_aids", key: 'contractors'),

                //Process the history data for enquiries to show only the specific information that we want
                EnquiriesMiddleware::processEnquiriesContractor(returnKey: "enquiries_data"),

                //Process the transaction history data to show only the specific information that we want
                EnquiriesMiddleware::processTransactionsContractor(returnKey: "quotes_data"),

                Generic::set("json",  function ($action) {
                    $action->set("engagement", [
                        'enquiries' => [
                            'total' => $action->get("enquiries") ? $action->get("enquiries")->count() : 0,
                            'data'  => $action->get("enquiries_data")
                        ],
                        'quotes' => [
                            'total' => $action->get("transactions") ? $action->get("transactions")->count() : 0,
                            'data'  => $action->get("quotes_data")
                        ]
                    ], true);

                    return json_encode(["data" => $action->get("engagement", [
                        'enquiries' => [
                            'total' => 0,
                            'data' => []
                        ],
                        'orders' => [
                            'total' => 0,
                            'data' => []
                        ]
                    ])]);
                }),
            ]
        ],
        [
            "key" => "account\/supply_chain\/(?<aid>[0-9]{1,7})$",
            "middleware" => [
                function($a){
                    $contractors = Manager::getService('account')->fetch(sprintf("account/%s/supply_chain/added_to", $a->get("uriArgs.aid")))->get("data.contractors");
                    $a->set("contractors", [
                        'ids' => array_keys($contractors),
                        'data'=> $contractors
                    ]);
                },
                AccountMiddleware::loadAccountsByIdArray("contractors.ids"),
                function($a){
                    $collection = new \Core\Data\Collection($a->get("accounts"), Shape::class);
                    $dates = $a->get("contractors.data");
                    $a->set("collection", $collection->map(function($item) use ($dates){
                        return [
                            'name' => $item->get("name"),
                            'created_at' => $dates[$item->get("id")]['created_at'] ?? null
                        ];
                    }));
                },
                Generic::set("json",  function ($action) {
                    return json_encode(["data" => $action->get("collection")]);
                }),
            ]
        ],
        [
            "key" => "account\/customer_health_score$",
            "middleware" => [
                function($a){
                    $accounts = null;
                    $collection = Manager::getService('account')->fetch("account/customer_health_score")->getCollection("data");
                    if ($collection->count()){
                        $ids = $collection->values('account_id');
                        $accounts = Manager::getService('account')->fetch("account/[".implode(",", $ids)."]")->getCollection("data");
                    }
                    $a->set("collection", $accounts);
                },
                Account::getProjectsByAccounts(),
                Account::getActiveUsersLastMonth(),
                Generic::set("json",  function ($action) {
                    return json_encode(["data" => $action->get("collection")]);
                }),
            ]
        ],
        [
            "method" => "PATCH",
            "key" => "account\/customer_health_score$",
            "middleware" => [
                function($a){
                    $json = $a->getRoute()->getRequest()->getData()->getShape("json");
                    $add = $json->get("add");
                    if ($add) {
                        Manager::getService('account')->update("account/customer_health_score", new Shape([
                            'data' => $add,
                            'options' => [
                                CURLOPT_CUSTOMREQUEST => "PATCH"
                            ]
                        ]));
                    }
                    $remove = $json->get("remove");

                    if ($remove) {
                        foreach($remove as $r) {
                            Manager::getService("account")->delete("account/customer_health_score/".$r);
                        }
                    }
                },
            ]
        ],
        [
            "key" => "account\/(?<aid>[0-9]{1,7})\/supply-chain\/check-company$",
            "method" => "GET",
            "middleware" => [
                function ($a) {
                    if (empty($a->get('request_args.name'))) {
                        throw new MiddlewareException("badRequest", "Name is required");
                    }
                },
                AccountMiddleware::loadByName('request_args.name', 'subcontractor_account'),
                Conditional::isset(
                    "subcontractor_account",
                    [
                        Conditional::in(
                            'subcontractor_account.type_id',
                            [3, 4],
                            [
                                AccountMiddleware::existInSupplyChain("subcontractor_account.id", "uriArgs.aid", "exist_in_supply_chain"),
                                Conditional::switched(
                                    "exist_in_supply_chain",
                                    [
                                        function ($a) {
                                            throw new MiddlewareException("badRequest", "This subcontractor is already part of your Supply Chain.");
                                        }
                                    ],
                                    [
                                        AccountMiddleware::loadById("subcontractor_account.id", 'company_account'),
                                        function ($a) {
                                            $a->setItems([
                                                'found'     => true,
                                                'data'      => [
                                                    'name'      => $a->get('company_account.name'),
                                                    'number'    => $a->get('company_account.reg_number'),
                                                    'address'   => $a->get('company_account.address'),
                                                    'mobile'    => $a->get('company_account.mobile'),
                                                    'user'      => array_shift($a->get('company_account.users')),
                                                ],
                                            ]);
                                        },
                                    ]
                                ),
                            ],
                            [
                                function ($a) {
                                    throw new MiddlewareException("badRequest", "A Main Contractor with this name already exists, so it can not be used for a subcontractor.");
                                }
                            ]
                        ),
                    ],
                    [
                        function ($a) {
                            $a->set('found', false);
                        }
                    ]
                ),
                Generic::set("json", function ($a) {
                    return json_encode([
                        'found'     => $a->get('found'),
                        'data'      => $a->get('data', [])
                    ]);
                })
            ]
        ],
        [
            "key" => "account\/(?<aid>[0-9]{1,7})\/supply-chain$",
            "method" => "POST",
            "middleware" => [
                Rest::fetch("user/type", "account"),
                AccountMiddleware::loadTokenTypes("supply_chain"),
                AccountMiddleware::loadById('uriArgs.aid'),
                function ($a) {
                    $json = $a->getRoute()->getRequest()->getData()->getShape("json");
                    $a->set("payload", $json);
                    $email = $json->get("email");
                    if (!$email) {
                        throw new MiddlewareException("badRequest", "Email is required");
                    }
                    $a->set("email", $email);
                },
                AccountMiddleware::loadByEmail("email", "subcontractor"),
                AccountMiddleware::loadByName('payload.company_name', 'subcontractor_account'),
                UserMiddleware::loadByEmail("payload.email", "user"),

                // only allow subcontractors to be added to supply chain
                function ($a) use ($subcontractor_type_ids) {
                    if ($a->int("subcontractor_account.type_id") && !in_array($a->int("subcontractor_account.type_id"), $subcontractor_type_ids)) {
                        throw new MiddlewareException("conflict", "The account is already registered to a non-subcontractor account.");
                    }

                    // make sure if user exist then it must belong to provided account
                    if (!empty($a->get('user'))) {
                        if (empty($a->get('subcontractor_account')) || (!empty($a->get('subcontractor_account')) && $a->get("user.account_id") != $a->get('subcontractor_account.id'))) {
                            AccountMiddleware::loadById('user.account_id', 'user_account')($a);
                            throw new MiddlewareException("conflict", "The email you provided is already associated with the account {$a->get('user_account.name')}. Please use a different email address.");
                        }
                    }
                },
                Conditional::isset(
                    "subcontractor_account",
                    [
                        AccountMiddleware::existInSupplyChain("subcontractor_account.id", "uriArgs.aid", "exist_in_supply_chain"),
                        Conditional::switched(
                            "exist_in_supply_chain",
                            [
                                function ($a) {
                                    throw new MiddlewareException("conflict", "This subcontractor is already part of your Supply Chain.");
                                }
                            ]
                        ),
                    ]
                ),
                Conditional::isset(
                    "subcontractor",
                    [
                        function ($a) {
                            $a->updateShape("payload", [
                                "email_data" => ["template" => 'added'],
                                "id" => (int) $a->get("subcontractor.id")
                            ]);
                        }
                    ],
                    [
                        AccountMiddleware::loadTypes(),
                        function ($a) use ($region_code_id) {
                            $type = $a->getCollection("account_types")->filterByField("label", "external_subcontractor")->first();
                            $a->updateShape("payload", [
                                "membership"        => "external_subcontractor",
                                "type_id"           => $type->int("id"),
                                "name"              => $a->get("payload.company_name"),
                                "mobile"            => $a->get("payload.phone"),
                                "region_group_id"   => $region_code_id
                            ]);
                        },

                        Conditional::isset(
                            "subcontractor_account",
                            [
                                // use existing account
                                function ($a) use ($subscription_id) {
                                    $a->updateShape("payload", [
                                        "id" => $a->get('subcontractor_account.id')
                                    ]);
                                    $a->setItems([
                                        "new_subcontractor" => $a->get("payload"),
                                        "subscription_id"   => $subscription_id
                                    ]);
                                },
                            ],
                            [
                                AccountMiddleware::validatePayload(resource: "account", isSupplyChainFromPegasus: true),
                                // Create the subcontractor account
                                Rest::write("account", "account", postProcessor: function ($res, $a) use ($subscription_id) {
                                    $a->updateShape("payload", [
                                        "id" => $res->get("json")->get("data.id")
                                    ]);
                                    $a->setItems([
                                        "new_subcontractor" => $a->get("payload"),
                                        "subscription_id"   => $subscription_id
                                    ]);
                                }),
                                // Set the account membership
                                Rest::update("account", "account/{new_subcontractor.id}/membership", "subscription_id"),
                            ],
                        ),
                    ],
                ),
                function ($a) use ($user_status_pending_id) {
                    $userTypes = $a->getCollection("account_user_type");
                    $type_id = $userTypes->filterByField("label", "account_holder")->first()->int("id");
                    // Update user payload with correct account Id and stub password
                    $a->updateShape(
                        "payload",
                        [
                            "account_id"        => (int) $a->get("new_subcontractor.id", $a->get("subcontractor.id")),
                            "password"          => hash("sha256", random_bytes(16)),
                            "type_id"           => $type_id,
                            "status"            => $user_status_pending_id,
                            "contact_number"    => $a->get("payload.phone"),
                            "display_name"      => $a->get("payload.firstname") . " " . $a->get("payload.lastname")
                        ]
                    );
                },
                Conditional::isset(
                    "subcontractor",
                    [
                        function ($a) {
                            if (!$a->get("user")) {
                                throw new MiddlewareException("conflict", "No user found for existing subcontractor");
                            }
                            $a->set("user_id", $a->get("user.id"));
                        },
                        Rest::fetchDynamic(
                            "account_v2",
                            "account/{account.id}/supply-chain/{payload.account_id}/user/{user_id}",
                            [],
                            "account_user_mapping_id",
                            postProcessor: function ($res, $a) {
                                $a->set("account_user_mapping_id", $res->getShape("json")->get("data.id"));
                                return $a;
                            }
                        ),

                        Conditional::notset(
                            "account_user_mapping_id",
                            [
                                Rest::write(
                                    "account_v2",
                                    "account/{account.id}/supply-chain/{payload.account_id}/user/{user_id}",
                                    preProcessor: function ($payload, $a) {
                                        $payload->setItems([
                                            "firstname"         => $a->get("payload.firstname"),
                                            "lastname"          => $a->get("payload.lastname"),
                                            "contact_number"    => $a->get("payload.contact_number"),
                                        ]);
                                        return $payload;
                                    },
                                ),
                            ]
                        ),
                    ],
                    [
                        // Add the user to the user table
                        Rest::write(
                            "account",
                            "user",
                            function ($payload) {
                                $payload->set("id", null);
                                return $payload;
                            },
                            postProcessor: function ($res, $a, $json) {
                                $a->set("user_id", $json->get("data.id"));
                                $a->updateShape("payload", ["email_data" => ["template" => 'activation']]);
                            }
                        ),
                        // Add the user to the account user mapping table
                        Rest::write(
                            "account_v2",
                            "account/{account.id}/supply-chain/{payload.account_id}/user/{user_id}",
                        ),
                    ]
                ),
                Rest::fetchDynamic(
                    "account_v2",
                    "account/{account.id}/supply-chain/{payload.account_id}",
                    [],
                    "existing_supply_chain",
                    postProcessor: function ($res, $a) {
                        $a->set("existing_supply_chain", $res->getShape("json")->get("data"));
                        return $a;
                    }
                ),
                Conditional::notset(
                    "existing_supply_chain",
                    [
                        // Add the subcontractor to the supply chain
                        Rest::write(
                            "account_v2",
                            "account/{account.id}/supply-chain",
                            function ($payload) {
                                $payload->set("id", $payload->get("account_id"));
                                return $payload;
                            }
                        ),
                    ]
                ),
                // Add the subcontractor attributes
                Rest::write(
                    "account_v2",
                    "account/{account.id}/attribute/{payload.id}",
                    postProcessor: function ($res, $a) {
                        $a->set("collection", ["success" => true]);
                        return $a;
                    }
                ),
                Conditional::notset(
                    "subcontractor",
                    [
                        function ($a) use ($organisation_default_role) {
                            $a->updateShape("payload", [
                                //get the subcontractor id either from the newly created account or the existing one
                                "user_id"       => $a->get("subcontractor.id", $a->get("user_id")),
                                "role_id"       => $organisation_default_role,
                                "contractor"    => [
                                    "id"    => $a->get("account.id"),
                                    "name"  => $a->get("account.name")
                                ]
                            ]);
                        },
                        // Add the user to the subcontractor organisation
                        ProsperAccountMiddleware::createOrganisationMember("payload", [
                            'firstname',
                            'lastname',
                            'contact_number',
                            'email',
                            'role',
                            'role_id',
                            'user_id',
                            'id'
                        ]),

                        // Send the appriate email for the subcontractor
                        // i.e activation email, added email, etc.
                        EmailMiddleware::sendSupplyChainEmail(),
                    ]
                ),
                Rest::fetchDynamic(
                    "account_v2",
                    "attribute",
                    [],
                    "attributes"
                ),

                function ($a) use ($user_status_pending_id) {
                    $attributes = ['trades' => [], 'regions' => [], 'locations' => []];
                    foreach (['trades', 'regions', 'locations'] as $attribue_name) {
                        foreach ($a->get("payload.$attribue_name", []) as $attribute) {
                            $attribute_found = $a->getCollection("attributes")->filterByField("id", $attribute, cast: "int");
                            if ($attribute_found->count()) {
                                $attributes[$attribue_name][] = [
                                    "id"    => $attribute_found->first()->int("id"),
                                    "label" => $attribute_found->first()->get("label")
                                ];
                            }
                        }
                    }
                    // prepare response
                    $a->set("data", [
                        "success" => true,
                        "subcontractor" => [
                            "id"        => $a->get("payload.id", null),
                            "name"      => $a->get("payload.company_name", null),
                            "firstname" => $a->get("payload.firstname", null),
                            "lastname"  => $a->get("payload.lastname", null),
                            "email"     => $a->get("payload.email", null),
                            "mobile"    => $a->get("payload.mobile", null),
                            "trades"    => $attributes['trades'],
                            "locations" => $attributes['regions'] ?: $attributes['locations'],
                            "users"     => [
                                [
                                    "id"                => $a->get("payload.user_id", null),
                                    "account_id"        => $a->get("payload.id", null),
                                    "display_name"      => $a->get("payload.display_name", null),
                                    "contact_number"    => $a->get("payload.mobile", null),
                                    "email"             => $a->get("payload.email", null),
                                    "firstname"         => $a->get("payload.firstname", null),
                                    "lastname"          => $a->get("payload.lastname", null),
                                    "status"            => $user_status_pending_id
                                ]
                            ],
                            "created_at" => date("Y-m-d H:i:s")
                        ]
                    ]);
                },
                Generic::set("json", function ($a) {
                    return json_encode(['data' => $a->get('data')]);
                })
            ],
        ],
    ]
];
