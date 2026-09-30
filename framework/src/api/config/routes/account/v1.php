<?php

use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\UserMiddleware;
use Core\Router\Route\Helper;
use Core\Middleware\Rest;
use Core\Middleware\Exception AS MiddlewareException;
use Core\Middleware\Conditional;
use Core\System\Environment as E;
use Api\Middleware\EmailMiddleware;
use Api\Middleware\Relay\PrequalificationMiddleware as RelayPrequalificationMiddleware;
use Api\Middleware\TenderMiddleware;
use Core\Middleware\Generic;
use Prosper\Middleware\AccountMiddleware as ProsperAccount;
use Prequalification\Middleware\PrequalificationMiddleware;
use Api\Service\SupplyChain\ContactReportExcelService;
use Api\Service\SupplyChain\StatusReportExcelService;
use Core\Service\Manager;
use Core\Data\Shape;
use Core\Middleware\Procedure;
use CompanyProfile\Middleware\S3Middleware;
use Core\Data\Collection;

$region_code_id           = E::get("REGION_CODE_ID", 1);
$user_status_confirmed_id = 2; //confirmed
$user_status_pending_id   = 1; //pending
$subscription_id          = 15; //external_subcontractor
$subscription_approved_id = 16; //external_approved_subcontractor
$organisation_label       = "Supply Chain Contact";
$organisation_default_role = 1; //CEO/Managing Director
$activate_supply_chain_id = "activated_supply_chain";
$subcontractor_type_ids   = [3,4];
$subcontractor_not_external_type = 3;
$allowedRoles = ['administrator', 'account_holder', 'super_admin', 'team_admin', 'team_manager'];

include_once("procedure.php");
return Helper::getTemplate("api",
    //Actions
    [
        /**
         * Supply Chain Routes
         * All routes are prefixed with /account/v1/supply-chain and pertain to
         * the management of a main contractor's supply chain accounts
         */
        [
            "id" => "supply-chain",
            "key" => "^supply-chain",
            "method" => "GET",
            "response_keys" => ["data" => "collection", "info"],
            "description" => "Get a main contractor's supply chain",
            "middleware" => [
                Conditional::isset(
                    "request_args.term",
                    [
                        Conditional::isset(
                            "request_args.pid",
                            [
                                function ($a) {
                                    TenderMiddleware::fetchTenderByProject(params: ['label' => $a->get('request_args.term')])($a);
                                },
                                Conditional::switched(
                                    "tender.is_custom",
                                    [
                                        AccountMiddleware::loadTrades(),
                                        // fetch subcontractors of custom package
                                        AccountMiddleware::fetchSupplyChainByCustomPackage(),
                                    ],
                                    [
                                        AccountMiddleware::fetchSupplyChain()
                                    ],
                                    1
                                ),
                            ],
                            [
                                AccountMiddleware::fetchSupplyChain()
                            ],
                        ),
                    ],
                    [
                        AccountMiddleware::fetchSupplyChain()
                    ],
                ),
            ]
        ],
        [
            "id" => "supply-chain-account",
            "key" => "^supply-chain\/(?<subcontractor_id>[0-9]+)",
            "method" => "GET",
            "response_keys" => "collection",
            "description" => "Get a single subcontractor's from a main contractor's supply chain",
            "middleware" => [
                Rest::fetchDynamic(
                    "account_v2",
                    "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}",
                    [],
                    "collection"
                )
            ]
        ],
        [
            "id" => "add-supply-chain-account",
            "key" => "^supply-chain",
            "method" => "POST",
            "response_keys" => ["data"],
            "description" => "Add a subcontractor to a main contractor's supply chain",
            "middleware" => [
                Rest::fetch("user/type", "account"),
                AccountMiddleware::loadTokenTypes("supply_chain"),
                function($a) use ($allowedRoles) {
                    $email = $a->get("payload")->get("email");
                    if(!$email) {
                        throw new MiddlewareException("serviceError", "Email is required");
                    }
                    $a->set("email", $email);

                    $userTypes = $a->get('account_user_type')->toArray();
                    $roleMap = array_column($userTypes, 'label', 'id');

                    if (!(isset($roleMap[$a->get('user.type_id')]) && in_array($roleMap[$a->get('user.type_id')], $allowedRoles))) {
                        throw new MiddlewareException("forbidden", "You are not authorized to perform this action");
                    }

                    $indexedUserTypes = array_column($userTypes, null, 'id');

                    $role = $indexedUserTypes[$a->get('user.type_id')] ?? null;
                    $a->set("user_role", $role);
                },
                AccountMiddleware::loadByEmail("email", "subcontractor"),
                AccountMiddleware::loadByName('payload.company_name', 'subcontractor_account'),
                UserMiddleware::loadByEmail("payload.email", "subcontractor_user"),

                //only allow subcontractors to be added to supply chain
                function ($a) use ($subcontractor_type_ids) {
                    if($a->int("subcontractor_account.type_id") && !in_array($a->int("subcontractor_account.type_id"), $subcontractor_type_ids)) {
                        throw new MiddlewareException("userIsNotSubcontractor");
                    }
                    if (!empty($a->get('subcontractor_user'))) {
                        if (empty($a->get('subcontractor_account')) || (!empty($a->get('subcontractor_account')) && $a->get("subcontractor_user.account_id") != $a->get('subcontractor_account.id'))) {
                                AccountMiddleware::loadById('subcontractor_user.account_id', 'user_account')($a);
                                throw new MiddlewareException("conflict", "This email cannot be used for this subcontractor.");
                        }
                    }
                },
                Conditional::isset(
                    "subcontractor_account",
                    [
                        AccountMiddleware::existInSupplyChain("subcontractor_account.id", "account.id", "exist_in_supply_chain"),
                        Conditional::switched(
                            "exist_in_supply_chain",
                            [
                                function ($a) {
                                    throw new MiddlewareException("conflict", "This subcontractor is already part of your Supply Chain.");
                                }
                            ]
                        ),
                        // use existing account
                        function ($a) use ($subscription_id) {
                            $a->updateShape("payload", [
                                "id" => (int) $a->get('subcontractor_account.id')
                            ]);
                            $a->setItems([
                                "new_subcontractor" => $a->get("payload"),
                                "subscription_id"   => $subscription_id
                            ]);
                        }
                    ],
                    [
                        AccountMiddleware::loadTypes(),
                        function($a) use ($region_code_id) {
                            $type = $a->getCollection("account_types")->filterByField("label", "external_subcontractor")->first();
                            $a->updateShape("payload", [
                                "membership"      => "external_subcontractor",
                                "type_id"         => $type->int("id"),
                                "name"            => $a->get("payload.company_name"),
                                "mobile"          => $a->get("payload.phone"),
                                "region_group_id" => $region_code_id
                            ]);
                        },

                        function ($a) {
                            $isNonUk = (bool) $a->get("payload.is_non_uk");
                            return AccountMiddleware::validatePayload("account", isNonUk: $isNonUk)($a);
                        },

                        // create the subcontractor account
                        Rest::write("account", "account", postProcessor: function($res, $a) use ($subscription_id) {
                            $a->updateShape("payload", [
                                "id" => $res->get("json")->get("data.id")
                            ]);
                            $a->setItems([
                                "new_subcontractor" => $a->get("payload"),
                                "subscription_id"   => $subscription_id
                            ]);
                        }),

                        // set the account membership
                        Rest::update("account", "account/{new_subcontractor.id}/membership", "subscription_id"),
                    ],
                ),
                function($a) use ($user_status_pending_id){
                    $userTypes = $a->getCollection("account_user_type");
                    $type_id = $userTypes->filterByField("label", "account_holder")->first()->int("id");
                    //Update user payload with corrent account Id and stub password
                    $a->updateShape("payload",
                        [
                            "account_id" => (int) $a->get("new_subcontractor.id", $a->get("subcontractor_account.id")),
                            "password"   => hash("sha256", random_bytes(16)),
                            "type_id"    => $type_id,
                            "status"     => $user_status_pending_id,
                            "contact_number" => $a->get("payload.phone"),
                            "display_name" => $a->get("payload.firstname") . " " . $a->get("payload.lastname")
                        ]
                    );
                },
                Conditional::isset(
                    "subcontractor_user",
                    [
                        function ($a) {
                            $a->updateShape("payload", ["email_data" => ["template" => 'added']]);
                            $a->set("user_id", $a->get("subcontractor_user.id"));
                        },
                        Rest::fetchDynamic(
                            "account_v2",
                            "account/{account.id}/supply-chain/{payload.account_id}/user/{user_id}",
                            [],
                            "account_user_mapping_id",
                            postProcessor: function($res, $a) {
                                $a->set("account_user_mapping_id", $res->getShape("json")->get("data.id"));
                                return $a;
                        }),

                        Conditional::notset(
                            "account_user_mapping_id",
                            [
                                Rest::write(
                                    "account_v2",
                                    "account/{account.id}/supply-chain/{payload.account_id}/user/{user_id}",
                                    preProcessor: function ($payload, $a) {
                                        $payload->setItems([
                                            "firstname"      => $a->get("payload.firstname"),
                                            "lastname"       => $a->get("payload.lastname"),
                                            "contact_number" => $a->get("payload.contact_number"),
                                        ]);
                                        return $payload;
                                    },
                                ),
                            ]
                        ),
                    ],
                    [
                        //Add the user to the user table
                        Rest::write("account", "user",
                            function ($payload){
                                $payload->set("id", null);
                                return $payload;
                            },
                            postProcessor: function($res, $a, $json) {
                                $httpCode = (int)$res->get("info.http_code", 0);
                                if ($httpCode !== 200) {
                                    $content = $res->get("content", "");
                                    $decoded = is_string($content) ? json_decode($content, true) : [];
                                    $error = $decoded['error'] ?? [];
                                    $friendly = is_array($error) ? ($error['friendly'] ?? '') : '';
                                    $description = is_array($error) ? ($error['description'] ?? '') : '';

                                    if ($description) {
                                        error_log($description);
                                    }

                                    $message = $friendly ?: "Failed to create subcontractor user.";
                                    throw new MiddlewareException(
                                        "serviceError",
                                        $message
                                    );
                                }

                                $userId = $json->get("data.id");
                                if (!$userId) {
                                    throw new MiddlewareException(
                                        "serviceError",
                                        "Failed to create subcontractor user."
                                    );
                                }
                                $a->set("user_id", $userId);
                                $a->updateShape("payload", [
                                    "email_data"    => ["template" => 'activation'],
                                    "user_id"       => $userId
                                ]);
                            }
                        ),
                        //Add the user to the account user mapping table
                        Rest::write(
                            "account_v2",
                            "account/{account.id}/supply-chain/{payload.account_id}/user/{user_id}",
                        ),

                        function($a) use ($organisation_default_role) {
                            $a->updateShape("payload", [
                                // get the subcontractor id either from the newly created account or the existing one
                                "id"            => $a->get("payload.account_id", $a->get("subcontractor_account.id")),
                                "role_id"       => $organisation_default_role,
                                "contractor"    => [
                                    "id"    => $a->get("account.id"),
                                    "name"  => $a->get("account.name")
                                ]
                            ]);
                        },

                        // add the user to the subcontractor organisation
                        ProsperAccount::createOrganisationMember("payload", [
                            'firstname',
                            'lastname',
                            'contact_number',
                            'email',
                            'role',
                            'role_id',
                            'user_id',
                            'id'
                        ]),
                    ]
                ),
                Rest::fetchDynamic(
                    "account_v2",
                    "account/{account.id}/supply-chain/{payload.account_id}",
                    [],
                    "existing_supply_chain",
                    postProcessor: function($res, $a) {
                        $a->set("existing_supply_chain", $res->getShape("json")->get("data"));
                        return $a;
                    }
                ),
                Conditional::notset(
                    "existing_supply_chain",
                    [
                        //Add the subcontractor to the supply chain
                        Rest::write(
                            "account_v2",
                            "account/{account.id}/supply-chain",
                            function ($payload){
                                $payload->set("id", $payload->get("account_id"));
                                return $payload;
                            }
                        ),
                    ]
                ),
                //Add the subcontractor attributes
                Rest::write(
                    "account_v2",
                    "account/{account.id}/attribute/{payload.id}",
                    postProcessor: function($res, $a) {
                        $a->set("collection", ["success" => true]);
                        return $a;
                    }
                ),

                //Send the appriate email for the subcontractor
                //i.e activation email, added email, etc.
                EmailMiddleware::sendSupplyChainEmail(),

                Rest::fetchDynamic(
                    "account_v2",
                    "attribute",
                    [],
                    "attributes"
                ),

                function($a) use ($user_status_pending_id){
                    $attributes = ['trades' => [], 'regions' => [], 'locations' => []];
                    foreach(['trades','regions', 'locations'] as $attribue_name) {
                            foreach($a->get("payload.$attribue_name", []) as $attribute) {
                                $attribute_found = $a->getCollection("attributes")->filterByField("id", $attribute, cast:"int");
                                if($attribute_found->count()) {
                                    $attributes[$attribue_name][] = [
                                        "id"    => $attribute_found->first()->int("id"),
                                        "label" => $attribute_found->first()->get("label")
                                    ];
                                }
                            }
                    }
                    $a->set("data", [
                        "success" => true,
                        "subcontractor" => [
                            "id"         => $a->get("payload.id", null),
                            "name"       => $a->get("payload.company_name", null),
                            "firstname"  => $a->get("payload.firstname", null),
                            "lastname"   => $a->get("payload.lastname", null),
                            "email"      => $a->get("payload.email", null),
                            "mobile"     => $a->get("payload.mobile", null),
                            "trades"     => $attributes['trades'],
                            "locations"    => $attributes['regions'] ?: $attributes['locations'],
                            "users"      => [
                                [
                                    "id"             => $a->get("user_id", null),
                                    "account_id"     => $a->get("payload.id", null),
                                    "display_name"   => $a->get("payload.display_name", null),
                                    "contact_number" => $a->get("payload.mobile", null),
                                    "email"          => $a->get("payload.email", null),
                                    "firstname"      => $a->get("payload.firstname", null),
                                    "lastname"       => $a->get("payload.lastname", null),
                                    "status"         => $user_status_pending_id
                                ]
                            ],
                            "created_at" => date("Y-m-d H:i:s")
                        ]
                    ]);
                }
            ],
            "onError" => [
                "userIsNotSubcontractor" => function($ex, $a){
                    $error_message = "The email address is already registered to a non-subcontractor account";
                    $a->set("headers", ["HTTP/1.0 409 $error_message" => ""]);
                    $a->set("data", [
                        "success" => false,
                        "message" => $error_message,
                    ]);
                },

                //Error handler for duplicate subcontractor email
                "duplicateSubcontractorEmail" => function($ex, $a){
                    $error_message = $ex->getMessage();
                    $a->set("headers", ["HTTP/1.0 409 $error_message" => ""]);
                    $a->set("data", [
                        "success" => false,
                        "message" => $error_message,
                    ]);
                },
                "conflict" => function($ex, $a){
                    $error_message = $ex->getMessage();
                    $a->set("headers", ["HTTP/1.0 409 $error_message" => ""]);
                    $a->set("data", [
                        "success" => false,
                        "message" => $error_message,
                    ]);
                },
                "serviceError" => function($ex, $a){
                    $error_message = $ex->getMessage();
                    $a->set("headers", ["HTTP/1.0 500 $error_message" => ""]);
                    $a->set("data", [
                        "success" => false,
                        "message" => $error_message,
                    ]);
                },
            ],
        ],
        [
            "id" => "update-supply-chain-account",
            "key" => "^supply-chain\/(?<subcontractor_id>[0-9]+)(?:\/)?$",
            "method" => "PATCH",
            "response_keys" => "data",
            "description" => "Update a subcontractor in a main contractor's supply chain",
            "middleware" => [
                Rest::write(
                    "account_v2",
                    "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}",
                    function($payload, $a) {
                        return $payload;
                    }
                ),
                Rest::write(
                    "account_v2",
                    "account/{account.id}/attribute/{uriArgs.subcontractor_id}",
                    function($payload, $a) {
                        return $payload;
                    },
                    postProcessor: function($res, $a) {
                        $a->set("data", ["status" => true]);
                        return $a;
                    }
                ),
            ]
        ],
        [
            "id" => "delete-supply-chain-account",
            "key" => "^supply-chain\/(?<subcontractor_id>[0-9]+)(?:\/)?$",
            "method" => "DELETE",
            "response_keys" => "data",
            "description" => "Remove a subcontractor from a main contractor's supply chain, this removed the mapping, not the subcontractor",
            "middleware" => [
                Rest::delete("account_v2", "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}"),
                function ($a) {
                    $a->set("data", ["status" => true]);
                }
            ]
        ],
        [
            "id" => "supply-chain-account-users",
            "key" => "^supply-chain\/(?<subcontractor_id>[0-9]+)\/users",
            "method" => "GET",
            "response_keys" => ["data" => "users"],
            "description" => "Get a list of users for a single subcontractor",
            "middleware" => [
                Rest::fetchDynamic(
                    "account_v2",
                    "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}",
                    [],
                    "collection",
                    postProcessor: function($res, $a) {
                        $a->set("users", $res->getShape("json")->get("data.users", []));
                        return $a;
                    }
                )
            ]
        ],
        /**
         * Supply Chain User Routes
         * All routes are prefixed with /account/v1/supply-chain/user and pertain to
         * the management of a subcontractor's users
         */
        [
            "id" => "add-supply-chain-account-user",
            "key" => "^supply-chain\/(?<subcontractor_id>[0-9]+)\/user",
            "method" => "POST",
            "response_keys" => ["data" => "response"],
            "description" => "Add a user and map as a contact to a subcontractor, if the user does not exist then we will create the user and then the mapping",
            "middleware" => [
                Rest::fetch("user/type", "account"),
                Rest::fetchDynamic(
                    "account_v2",
                    "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}",
                    [],
                    "subcontractor",
                    postProcessor: function($res, $a) use ($user_status_confirmed_id,$user_status_pending_id) {
                        //Validate Subcontractor exists as part of supply chain
                        if(!$a->get("subcontractor")->count()) {
                            throw new MiddlewareException("invalid_request", "Subcontractor not found");
                        }
                        //Map User Type
                        $userTypes = $a->getCollection("account_user_type");
                        try{
                            $userCount = $a->getShape("subcontractor")->getCollection("users")->count();
                            //If there is more than one user, make them a team assistant else make them an account holder
                            $account_user_type = $userTypes->filterByField("label", $userCount ? "team_assistant" : "account_holder")->first();
                            $type_id = $account_user_type->int("id");
                            //Removed condition as contacts will direclty be confirmed
                            $status_id = $user_status_confirmed_id;

                        }catch (Exception $e) {
                            //If there is an error, default to account holder
                            $type_id = $userTypes->filterByField("label", "account_holder")->first()->int("id");
                            $status_id = $user_status_confirmed_id;
                        }

                        //Update user payload with corrent account Id and stub password
                        $a->updateShape("payload",
                            [
                                "account_id" => $a->get("subcontractor")->int("id"),
                                "password"   => hash("sha256", random_bytes(16)),
                                "type_id"    => $type_id,
                                "status"     => $status_id,
                                "contact_number" => $a->get("payload.phone"),
                                "display_name"   => $a->get("payload.firstname") . " " . $a->get("payload.lastname")
                            ]
                        );
                    }
                ),
                UserMiddleware::loadByEmail("payload.email", "new_user"),
                function ($a) use ($subcontractor_type_ids) {
                    $existingUser = $a->get("new_user");
                    if ($existingUser && $existingUser->count()) {
                        AccountMiddleware::loadById("new_user.account_id", "new_user_account")($a);

                        $existingAccountId   = $existingUser->int("account_id");
                        $currentSubId        = $a->get("uriArgs.subcontractor_id");
                        $existingUserAccount = $a->get("new_user_account");

                        $sendError = function($message, $code = 409) use ($a) {
                            http_response_code($code);
                            $a->set("response", [
                                "success" => false,
                                "message" => $message,
                            ]);
                            exit(json_encode([
                                "success" => false,
                                "message" => $message
                            ]));
                        };

                        // Prevent adding Main Contractor email into subcontractor contacts
                        if (!in_array($existingUserAccount->get('type_id'), $subcontractor_type_ids)) {
                            $sendError("You cannot add the main contractor's email as a subcontractor contact.");
                        }

                        // prevent adding other subcontractor account user
                        if ($existingAccountId && $existingAccountId != $currentSubId) {
                            $sendError("This email already belongs to another subcontractor account.");
                        }
                    }
                },
                //If user does not exist, create a new user
                Conditional::notset("new_user",
                    [
                        //Validate the payload against the user schema
                        AccountMiddleware::validatePayload("user"),
                        Rest::write("account", "user",
                            postProcessor: function($res, $a, $json) use ($organisation_label) {
                            //Set the new user shape with the id from the response
                            $a->setShape("new_user",
                                array_merge(
                                    $a->getShape("payload")->toArray(),
                                    [
                                        "id"   => $json->get("data.id"),
                                        "user_id" => $json->get("data.id"),
                                        "role" => $organisation_label
                                    ]
                                )
                            );
                            $a->set("aid", $a->get("payload.account_id"));
                        }),
                        //Add the user to the subcontractor organisation
                        ProsperAccount::createOrganisationMember("new_user", [
                            'firstname',
                            'lastname',
                            'contact_number',
                            'email',
                            'role',
                            'role_id',
                            'user_id'
                        ])
                    ]
                ),
                function ($a) {
                    try{
                        $mappingUserExisting = $a->get("subcontractor")->getCollection("users")->filterByStringField("email", $a->get("payload.email"));
                        if($mappingUserExisting->count()) {
                            $a->set("userMapped", true);
                        }
                    }catch (\Exception $e) {
                        $a->set("userMapped", false);
                    }
                },
                Conditional::notset(
                    "userMapped",
                    [
                        Rest::write(
                            "account_v2",
                            "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}/user/{new_user.id}",
                            function($payload, $a) {
                                return $payload->set("users", $a->get("users"));
                            }
                        ),
                        Rest::fetchDynamic(
                            "account_v2",
                            "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}",
                            [],
                            "subcontractor"
                        ),
                        function ($a) {
                            $users = $a->get("subcontractor.users");
                            $account_holder = array_shift($users);
                            $a->updateShape("payload", [
                                "email" => $a->get("subcontractor.email"),
                                "contact_email" => $a->get("new_user.email"),
                                "subcontractor_name" => $account_holder['display_name'],
                                "user_id" => $a->get("new_user.id"),
                                "contractor" => [
                                    "id"      => $a->get("account.id"),
                                    "company" => $a->get("account.name"),
                                    "name"    => $a->get("user.firstname") . " " . $a->get("user.lastname")
                                ]
                            ]);
                        }
                    ]
                ),
                function ($a) use ($subscription_approved_id, $subcontractor_not_external_type) {
                    if($a->get("userMapped")){
                        $error_message = "Email Already Exist";
                        $a->set("headers", ["HTTP/1.0 409 $error_message" => ""]);
                        $a->set("response", [
                            "success" => false,
                            "message" => $error_message,
                        ]);
                    } else {
                        if ($a->int("subcontractor.type") === $subcontractor_not_external_type || $a->int("subcontractor.subscription_id") === $subscription_approved_id) {
                            EmailMiddleware::sendSupplyChainEmail(template: "confirmation")($a);
                        }
                        $a->set("response", [
                            "success" => true,
                            "user"    => $a->get("new_user")
                        ]);
                    }
                },
            ]
        ],
        [
            "id" => "get-supply-chain-account-user",
            "key" => "^supply-chain\/(?<subcontractor_id>[0-9]+)\/user\/(?<user_id>[0-9]+)",
            "method" => "GET",
            "response_keys" => ["data" => "user"],
            "description" => "Get the data for a user as a contact from a main contractor's supply chain",
            "middleware" => [
                Rest::fetchDynamic(
                    "account_v2",
                    "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}",
                    [],
                    "subcontractor",
                    postProcessor: function($res, $a) {
                        $users = $res->getShape("json")->getCollection("data.users");
                        $user = $users->filterByField("id", $a->get("uriArgs")->get("user_id"))->first();
                        $a->set("user", $user);
                        return $a;
                    }
                )
            ]
        ],
        [
            "id" => "delete-supply-chain-account-user",
            "key" => "^supply-chain\/(?<subcontractor_id>[0-9]+)\/user\/(?<user_id>[0-9]+)",
            "method" => "DELETE",
            "response_keys" => ["data" => "result"],
            "description" => "Unmap a user as a contact from a main contractor's supply chain",
            "middleware" => [
                Rest::delete("account_v2", "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}/user/{uriArgs.user_id}"),
                function ($a) {
                    $a->set("result", ["status" => true]);
                }
            ]
        ],
        [
            "id" => "update-supply-chain-main-contact",
            "key" => "^supply-chain\/(?<subcontractor_id>[0-9]+)\/user\/(?<user_id>[0-9]+)\/update-main-contact(?:\/)?$",
            "method" => "PATCH",
            "response_keys" => ["data" => "result"],
            "description" => "Update main contact designation for a user in a subcontractor account",
            "middleware" => [
                Rest::update(
                    "account_v2",
                    "account/{account.id}/supply-chain/{uriArgs.subcontractor_id}/user/{uriArgs.user_id}",
                    "payload",
                    function($payload, $a) {
                        $data = $payload->toArray();
                        if (array_keys($data) !== ["is_main_contact"]) {
                            throw new MiddlewareException("validationError", "Only main contact can be updated via this endpoint");
                        }

                        $boolValue = filter_var($data["is_main_contact"], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                        if ($boolValue === null) {
                            throw new MiddlewareException("validationError", "is_main_contact must be a boolean");
                        }

                        return new Shape(["is_main_contact" => $boolValue]);
                    },
                    function($res, $a) {
                        $response = $res->json("content");
                        $statusCode = $res->get("info.http_code");
                        if ($statusCode >= 200 && $statusCode < 300) {
                            $a->set("result", [
                                "status" => true,
                                "message" => "User mapping updated successfully",
                            ]);
                        } else {
                            throw new MiddlewareException("operationError", json_encode($response));
                        }
                        return $a;
                    }
                )
            ]
        ],
        [
            "id" => "supply-chain-activate-main-account",
            "key" => "^supply-chain\/(?<contractor_aid>[0-9]+)\/account\/(?<subcontractor_aid>[0-9]+)\/activate_reminder$",
            "method" => "PATCH",
            "response_keys" => ["data" => "result"],
            "description" => "Activate the main subcontractor account",
            "middleware" => [
                AccountMiddleware::load("type"),
                Rest::fetchDynamic(
                    "account",
                    "account/{uriArgs.contractor_aid}",
                    [],
                    "contractor",
                ),
                Rest::fetchDynamic(
                    "account",
                    "account/{uriArgs.subcontractor_aid}",
                    [],
                    "subcontractor",
                ),
                function ($a) {
                    $a->set('is_external', $a->int("subcontractor.type_id") === (int)$a->getCollection("account_types")->filterByField("label", "external_subcontractor")->getFirst()->get("id")
                    );
                },
                Rest::fetchDynamic(
                    "account",
                    "account/subscription",
                    [],
                    "subscription",
                    postProcessor: function($res, $a) use ($activate_supply_chain_id) {
                        $data          = $res->getShape("json")->getCollection("data");
                        $subscriptions = $data->filterByField("uid", $activate_supply_chain_id);
                        if($subscriptions->count()){
                            $a->set("subscription_id", $subscriptions->first()->int("id"));
                            $a->set("not_activated", !($a->int("subcontractor.membership.subscription_id") === $a->int("subscription_id")) && $a->get("is_external"));
                        }
                    },

                ),
                Conditional::switched(
                    "not_activated",
                    [
                        Rest::fetchDynamic(
                            "account_v2",
                            "account/{uriArgs.contractor_aid}/supply-chain/{uriArgs.subcontractor_aid}",
                            [],
                            "contacts",
                            postProcessor: function($res, $a) {
                                $contacts = $res->getShape("json")->get("data.users", []);
                                if (!is_array($contacts)) {
                                    $contacts = [];
                                }
                                $contacts = new Collection($contacts, Shape::class);
                                if($contacts->count()) {
                                    $a->set("contact", $contacts->first());
                                } else {
                                    throw new MiddlewareException("missingContact", "No contact found for subcontractor");
                                }
                                return $a;
                            }
                        ),
                        function ($a) {
                            $a->updateShape("payload", [
                                "user_id"   => $a->get("contact.id"),
                                "firstname" => $a->get("contact.firstname"),
                                "email"     => $a->get("contact.email"),
                                "contractor" => [
                                    "id"   => $a->get("contractor.id"),
                                    "name" => $a->get("contractor.name")
                                ],
                            ]);
                        },
                        EmailMiddleware::sendSupplyChainEmail(template: "activation_reminder"),
                        function($a){
                            $a->set("result", [
                                "status"  => true,
                                "message" => "Activation reminder sent successfully"
                            ]);
                        }
                    ],
                    [
                        function($a) {
                            $a->set("result", [
                                "status"  => false,
                                "message" => "Account is already activated"
                            ]);
                        }
                    ]
                ),
            ]
        ],
        [
            "id" => "supply-chain-pqq-reminder",
            "key" => "^supply-chain\/(?<contractor_aid>[0-9]+)\/account\/(?<subcontractor_aid>[0-9]+)\/pqq_reminder$",
            "method" => "PATCH",
            "response_keys" => ["data" => "result"],
            "description" => "PQQ reminder the main subcontractor account",
            "middleware" => [
                AccountMiddleware::load("type"),
                Rest::fetchDynamic(
                    "account",
                    "account/{uriArgs.contractor_aid}",
                    [],
                    "contractor",
                ),
                Rest::fetchDynamic(
                    "account",
                    "account/{uriArgs.subcontractor_aid}",
                    [],
                    "subcontractor",
                ),
                function ($a) {
                    $a->set('is_external', $a->int("subcontractor.type_id") === (int)$a->getCollection("account_types")->filterByField("label", "external_subcontractor")->getFirst()->get("id")
                    );
                },
                Rest::fetchDynamic(
                    "account",
                    "account/subscription",
                    [],
                    "subscription",
                    postProcessor: function($res, $a) use ($activate_supply_chain_id) {
                        $data          = $res->getShape("json")->getCollection("data");
                        $subscriptions = $data->filterByField("uid", $activate_supply_chain_id);
                        if($subscriptions->count()){
                            $a->set("subscription_id", $subscriptions->first()->int("id"));
                            $a->set("not_activated", !($a->int("subcontractor.membership.subscription_id") === $a->int("subscription_id")) && $a->get("is_external"));
                        }
                    },
                ),
                Conditional::switched(
                    "not_activated",
                    [
                        function($a) {
                            $a->set("result", [
                                "status"  => false,
                                "message" => "Account is not activated"
                            ]);
                        }
                    ],
                    [
                        Rest::fetchDynamic(
                            "account_v2",
                            "account/{uriArgs.contractor_aid}/supply-chain/{uriArgs.subcontractor_aid}",
                            [],
                            "contacts",
                            postProcessor: function($res, $a) {
                                $contacts = $res->getShape("json")->get("data.users", []);
                                if (!is_array($contacts)) {
                                    $contacts = [];
                                }
                                $contacts = new Collection($contacts, Shape::class);
                                if($contacts->count()) {
                                    $a->set("contact", $contacts->first());
                                } else {
                                    throw new MiddlewareException("missingContact", "No contact found for subcontractor");
                                }
                                return $a;
                            }
                        ),
                        function ($a) {
                            $a->updateShape("payload", [
                                "user_id"   => $a->get("contact.id"),
                                "firstname" => $a->get("contact.firstname"),
                                "email"     => $a->get("contact.email"),
                                "contractor" => [
                                    "name" => $a->get("contractor.name")
                                ],
                            ]);
                        },
                        PrequalificationMiddleware::loadCollection("uriArgs.subcontractor_aid"),
                        PrequalificationMiddleware::loadSections(),
                        PrequalificationMiddleware::loadCompanyInformation(),
                        PrequalificationMiddleware::loadOrganisation("uriArgs.subcontractor_aid"),
                        PrequalificationMiddleware::addOrganisationAccountOwner("uriArgs.subcontractor_aid"),
                        PrequalificationMiddleware::loadCompanyFinancials(),
                        PrequalificationMiddleware::loadReferences(),
                        PrequalificationMiddleware::loadDocumentTypes(),
                        PrequalificationMiddleware::loadDocumentsSections(),
                        PrequalificationMiddleware::loadCertificates(),
                        PrequalificationMiddleware::loadSectionStatuses(),
                        PrequalificationMiddleware::generatePqqEmailContent(),
                        PrequalificationMiddleware::getNotificationsByReceiverId("uriArgs.subcontractor_aid"),
                        PrequalificationMiddleware::setUserNotificationStatus("user_id"),
                        EmailMiddleware::sendSupplyChainEmail(template: "pqq_reminder"),
                        function($a){
                            $a->set("result", [
                                "status"  => true,
                                "message" => "PQQ reminder sent successfully"
                            ]);
                        }
                    ]
                ),
            ]
        ],
        [
            "key" => "supply-chain\/export",
            "method" => "GET",
            "middleware" => [
                Conditional::isset(
                    "request_args.term",
                    [
                        Conditional::isset(
                            "request_args.pid",
                            [
                                function ($a) {
                                    TenderMiddleware::fetchTenderByProject(params: ['label' => $a->get('request_args.term')])($a);
                                },
                                Conditional::switched(
                                    "tender.is_custom",
                                    [
                                        AccountMiddleware::loadTrades(),
                                        // fetch subcontractors of custom package
                                        AccountMiddleware::fetchSupplyChainByCustomPackage(),
                                    ],
                                    [
                                        AccountMiddleware::fetchSupplyChain()
                                    ],
                                ),
                            ],
                            [
                                AccountMiddleware::fetchSupplyChain(),
                            ],
                        ),
                    ],
                    [
                        AccountMiddleware::fetchSupplyChain(),
                    ],
                ),
                function ($a) {

                    $reportType = $a->get('request_args.type') ?? 'contact-list';
                    $supplyChain = $a->getCollection("collection");
                    $supplyChainKeys = $supplyChain->getIds();
                    $currDate = date('d/m/Y');

                    if( $reportType === 'status-report') {
                        $fileName = "Supply Chain Status Report";
                        $scPqqStatuses = [];

                        foreach ($supplyChainKeys as $key) {

                            //Only the top level sections (finance, documents, references) carry the status
                            //The document sub sections are expiry-only.
                            $pqq_sections = Manager::getService('account')
                            ->fetch("prequalification/$key/sections")
                            ->getCollection('data')
                            ->filterByField('parent_id', 0, cast: 'int');

                            if ($pqq_sections->count() > 0) {
                                if($pqq_sections->count() === $pqq_sections->filterByField('status', '0')->count()) {
                                    $scPqqStatuses[$key] = 'PQQ Not Started';
                                    continue;
                                } else if($pqq_sections->count() === $pqq_sections->filterByField('status', '1')->count()) {
                                    $scPqqStatuses[$key] = 'PQQ Completed';
                                    continue;
                                } else {
                                    $scPqqStatuses[$key] = 'PQQ Partially Completed';
                                    continue;
                                }
                            } else {
                                $scPqqStatuses[$key] = 'Updating';
                                continue;
                            }
                        }

                        $externalSubcontractorId = null;
                        $subscriptions = Manager::getService("account")->fetch("account/subscription")->getCollection("data")->jsonSerialize();

                        foreach ($subscriptions as $sub) {
                            if (strcasecmp($sub["label"], "External Subcontractor") === 0 && strcasecmp($sub["interval_type"], "yearly") === 0) {
                                $externalSubcontractorId = intval($sub["id"]);
                            }
                        }
                        $excel = new StatusReportExcelService($supplyChain, $scPqqStatuses, $externalSubcontractorId);
                    } else {
                        $fileName = "Supply Chain Contact List";
                        $excel = new ContactReportExcelService($supplyChain);
                    }

                    $excel->render();
                    // Returns Download Headers and exits
                    $excel->download("{$fileName} - {$currDate}.xlsx");
                },
            ]

        ],
        [
            "id" => "account_roles_get",
            "key" => "^(?<account_id>[0-9]+)\/roles$",
            "method" => "GET",
            "description" => "Get list of roles for a specific account",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),
                function ($a) {
                    $accountId = $a->get('uriArgs.account_id');
                    $roles = Manager::getService("account")
                        ->fetch("account/{$accountId}/account_roles")
                        ->getShape("data")
                        ->toArray();

                    $a->set("data", $roles);
                },
                Generic::set("json", fn ($a) => json_encode(
                    [
                        "status" => count($a->get("data")) > 0 ? true : false,
                        "roles" => $a->get("data")
                    ]
                )),
            ],
        ],
        [
            "id" => "account_role_create",
            "key" => "^(?<account_id>[0-9]+)\/role$",
            "method" => "POST",
            "description" => "Create a role for a specific account",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),
                function ($a) {

                    $accountId = $a->get("uriArgs.account_id");
                    $payload   = $a->get("payload");

                    $userTypeId = $payload->get("user_type_id");
                    $label      = $payload->get("label");

                    if (!$userTypeId || !$label) {
                        throw new MiddlewareException("serviceError", "user_type_id and label are required");
                    }

                    $roleExists = \Core\Service\Manager::getService("account")
                        ->fetch("roles/roles-level")
                        ->getShape("data")
                        ->toArray();

                    $userTypeExists = 0;
                    foreach($roleExists as $role)   {
                        if($role['id'] == $userTypeId){
                            $userTypeExists = 1;
                        }
                    }

                    if ($userTypeExists == 0) {
                        throw new MiddlewareException("forbidden", "Invalid user_type_id");
                    }

                    $existingRoles = \Core\Service\Manager::getService("account")
                        ->fetch("account/{$accountId}/account_roles")
                        ->getShape("data")
                        ->toArray();

                    foreach ($existingRoles as $role) {
                        if (strtolower($role['label']) === strtolower($label)) {
                            throw new MiddlewareException("forbidden", "You can not add same role in single account.");
                        }
                    }
                },

                Rest::write(
                    "account",
                    "account/{uriArgs.account_id}/account_role",
                    preProcessor: function ($payload, $a) {

                        $body = $a->get("payload");

                        $payload->setItems([
                            "user_type_id" => $body->get("user_type_id"),
                            "label"        => $body->get("label"),
                            "description"  => $body->get("description"),
                        ]);

                        return $payload;
                    }
                ),

                Generic::set("json", fn ($a) => json_encode([
                    "success" => true
                ])),
            ],
        ],
        [
            "id" => "account_role_update",
            "key" => "^(?<account_id>[0-9]+)\/role\/(?<id>[0-9]+)$",
            "method" => "PUT",
            "description" => "Update a role for a specific account",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),

                function ($a) {

                    $accountId = $a->get("uriArgs.account_id");
                    $roleId    = $a->get("uriArgs.id");
                    $payload   = $a->get("payload");

                    $userTypeId = $payload->get("user_type_id");
                    $label      = $payload->get("label");

                    if (!$userTypeId || !$label) {
                        throw new \Exception("user_type_id and label are required");
                    }

                    $roleExists = \Core\Service\Manager::getService("account")
                        ->fetch("roles/roles-level")
                        ->getShape("data")
                        ->toArray();

                    $userTypeExists = 0;
                    foreach ($roleExists as $role) {
                        if ($role['id'] == $userTypeId) {
                            $userTypeExists = 1;
                        }
                    }

                    if ($userTypeExists == 0) {
                        throw new MiddlewareException("forbidden", "Invalid user_type_id");
                    }

                    $existingRoles = \Core\Service\Manager::getService("account")
                        ->fetch("account/{$accountId}/account_roles")
                        ->getShape("data")
                        ->toArray();

                    foreach ($existingRoles as $role) {
                        if (
                            strtolower($role['label']) === strtolower($label) &&
                            $role['id'] != $roleId
                        ) {
                            throw new MiddlewareException(
                                "forbidden",
                                "You can not add same role in single account."
                            );
                        }
                    }

                    $roleFound = false;
                    foreach ($existingRoles as $role) {
                        if ($role['id'] == $roleId) {
                            $roleFound = true;
                        }
                    }

                    if (!$roleFound) {
                        throw new MiddlewareException("not_found", "Role not found");
                    }
                },

                Rest::update(
                    "account",
                    "account/{uriArgs.account_id}/account_role/{uriArgs.id}",
                    preProcessor: function ($payload, $a) {

                        $body = $a->get("payload");

                        $payload->setItems([
                            "id"           => (int) $a->get("uriArgs.id"),
                            "account_id"   => (int) $a->get("uriArgs.account_id"),
                            "user_type_id" => $body->get("user_type_id"),
                            "label"        => $body->get("label"),
                            "description"  => $body->get("description")
                        ]);

                        return $payload;
                    }
                ),

               Generic::set("json", fn ($a) => json_encode([
                    "success" => true
                ])),
            ],
        ],
        [
            "id" => "create_account_group",
            "key" => "^(?<account_id>[0-9]+)\/group$",
            "method" => "POST",
            "description" => "Create Account User Group",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),
                function ($a) {
                    $payload = $a->get("payload") ?? new \Core\Data\Shape();
                    $a->set("payload", $payload);
                    $payload->set("label", $_POST['label'] ?? null);
                    $payload->set("address", $_POST['address'] ?? null);
                    $payload->set("logo", null);
                    $payload->set("logo_name", null);

                    if (
                        !$payload->get("label")
                    ) {
                        throw new MiddlewareException(
                            "invalid_payload",
                            "Label is required"
                        );
                    }

                    if (!empty($_FILES['logo']) && $_FILES['logo']['error'] === 0) {
                        $file = $_FILES['logo'];
                        $aid  = $a->get("aid");
                        $hash = md5(strval($aid));
                        $originalName = $file['name'];
                        $path = "account/group/$hash";
                        Manager::getService('s3')->upload($file, 'asset', $path);
                        $payload->set("logo", "$path/$originalName");
                        $payload->set("logo_name", $originalName);
                    }
                },

                Rest::write(
                    "account",
                    "account/{uriArgs.account_id}/group",
                    preProcessor: fn ($payload, $a) => $a->get("payload")
                ),

                Generic::set("json", fn () => json_encode([
                    "success" => true
                ])),
            ]
        ],
        [
            "id" => "update_account_group",
            "key" => "^(?<account_id>[0-9]+)\/group\/(?<group_id>[0-9]+)$",
            "method" => "PATCH",
            "description" => "Update Account User Group",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),
                function ($a) {
                    $payload = $a->get("payload") ?? new \Core\Data\Shape();
                    $a->set("payload", $payload);
                    $payload->set("label", $_POST['label'] ?? $payload->get("label"));
                    $payload->set("address", $_POST['address'] ?? $payload->get("address"));
                    $hasFile = !empty($_FILES['logo']) && $_FILES['logo']['error'] === 0;

                    if (
                        !$payload->get("label")
                    ) {
                        throw new MiddlewareException(
                            "invalid_payload",
                            "Label is required"
                        );
                    }

                    if ($hasFile) {
                        $file = $_FILES['logo'];
                        $aid  = $a->get("aid");
                        $hash = md5(strval($aid));
                        $originalName = $file['name'];
                        $path = "account/group/$hash";
                        Manager::getService('s3')->upload($file, 'asset', $path);
                        $payload->set("logo", "$path/$originalName");
                        $payload->set("logo_name", $originalName);
                    }
                },

                Rest::update(
                    "account",
                    "account/{uriArgs.account_id}/group/{uriArgs.group_id}",
                    preProcessor: function ($payload, $a) {
                        $body = $a->get("payload");
                        $payload->setItems([
                            "label"   => $body->get("label"),
                            "logo"    => $body->get("logo"),
                            "address" => $body->get("address"),
                        ]);

                        return $payload;
                    }
                ),

                Generic::set("json", fn () => json_encode([
                    "success" => true
                ])),
            ]
        ],
        [
            "id" => "list_account_groups",
            "key" => "^(?<account_id>[0-9]+)\/groups$",
            "method" => "GET",
            "description" => "Get Account User Groups",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),
                Rest::fetchDynamic(
                    "account",
                    "account/{uriArgs.account_id}/groups",
                    [],
                    "groups",
                    postProcessor: function ($res, $a) {
                        $groupsShape = $res ? $res->getShape("data") : [];
                        $groupsArray = $groupsShape ? $groupsShape->toArray() : [];
                        $a->set("groups", $groupsArray);
                    }
                ),

                Generic::set("json", fn ($a) => json_encode([
                    "groups" => $a->get("groups") ?? []
                ])),
            ]
        ],
        [
            "id" => "assign_user_group",
            "key" => "^(?<account_id>[0-9]+)\/user\/(?<user_id>[0-9]+)\/group$",
            "method" => "POST",
            "description" => "Assign User Group",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),
                Procedure::get("fetchAndValidateUserById"),
                function ($a) {
                    $payload = $a->get("payload");
                    if (!$payload->get("user_group_ids")) {
                        throw new MiddlewareException("invalid_payload", "user_group_ids is required");
                    }

                    $payload->set("account_id", (int) $a->get("uriArgs.account_id"));
                    $payload->set("user_id", (int) $a->get("uriArgs.user_id"));
                },

                Rest::write(
                    "account",
                    "account/{uriArgs.account_id}/user/{uriArgs.user_id}/group",
                    preProcessor: fn ($payload, $a) => $a->get("payload")
                ),

                Generic::set("json", fn () => json_encode([
                    "success" => true
                ])),
            ]
        ],
        [
            "id" => "update_assign_user_group",
            "key" => "^(?<account_id>[0-9]+)\/user\/(?<user_id>[0-9]+)\/group$",
            "method" => "PATCH",
            "description" => "Update User Group",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),
                Procedure::get("fetchAndValidateUserById"),
                function ($a) {
                    $payload = $a->get("payload");
                    if (!$payload->get("user_group_ids")) {
                        throw new MiddlewareException("invalid_payload", "user_group_ids is required");
                    }

                    $payload->set("account_id", (int) $a->get("uriArgs.account_id"));
                    $payload->set("user_id", (int) $a->get("uriArgs.user_id"));
                },

                Rest::update(
                    "account",
                    "account/{uriArgs.account_id}/user/{uriArgs.user_id}/group",
                    preProcessor: fn ($payload, $a) => $a->get("payload")
                ),

                Generic::set("json", fn () => json_encode([
                    "success" => true
                ])),
            ]
        ],
        [
            "id" => "get-account-organization",
            "key" => "^(?<aid>[0-9]+)\/organization$",
            "method" => "GET",
            "response_keys" => ["data" => "result"],
            "description" => "Get organization details for an account",
            "middleware" => [
                Rest::fetch("user/type", "account"),

                // Fetch and index organisation members, applying optional type exclusion
                Rest::fetchDynamic(
                    "account",
                    "account/{uriArgs.aid}/organisation",
                    [],
                    "account_organisation"
                ),

                function ($a) {
                    $typeMap = array_column($a->get("account_user_type")->toArray(), 'id', 'label');
                    $a->set("account_type_map", $typeMap);

                    $excludeType    = $a->get("request_args.exclude_type") ?? '';
                    $excludeTypeId  = (int)($typeMap[$excludeType] ?? 0);
                    $members        = [];

                    foreach ($a->get("account_organisation")->toArray() as $item) {
                        if (!($item['user_id'] ?? null)) continue;
                        if ($excludeTypeId && (int)$item['type_id'] === $excludeTypeId) continue;
                        $item['display_name'] = sprintf("%s %s", $item['firstname'], $item['lastname']);
                        $members[$item['user_id']] = $item;
                    }

                    $a->set("organisation_members", $members);
                },

                // Merge supply-chain contacts (adds contacts not in members list)
                Rest::fetchDynamic(
                    "account_v2",
                    "account/{account.id}/supply-chain/{uriArgs.aid}",
                    [],
                    "supply_chain_users",
                    postProcessor: function($res, $a) {
                        $members = $a->get("organisation_members") ?? [];

                        foreach ($res->getShape("json")->get("data.users", []) as $scUser) {
                            $userId = $scUser['id'] ?? null;
                            if ($userId && !isset($members[$userId])) {
                                $members[$userId] = $scUser;
                            }
                        }

                        $a->set("organisation_members", $members);
                    }
                ),

                // Fallback: if still no members, resolve the account_holder/team_admin as the sole member
                Conditional::collectionHasCount('organisation_members', function ($a) {
                    Rest::fetchDynamic(
                        "account",
                        "account/{uriArgs.aid}",
                        [],
                        "org_account"
                    )($a);

                    $typeMap = $a->get("account_type_map");
                    $accountHolderTypes = array_filter([
                        (int)($typeMap['account_holder'] ?? 0),
                        (int)($typeMap['team_admin'] ?? 0),
                    ]);

                    $accountHolder = null;
                    foreach ($a->get("org_account.users") ?? [] as $u) {
                        if (in_array((int)$u['type_id'], $accountHolderTypes, true)) {
                            $accountHolder = $u;
                            break;
                        }
                    }

                    if ($accountHolder) {
                        $a->set("organisation_members", [$accountHolder['id'] ?? 0 => [
                            'id'            => null,
                            'user_id'       => $accountHolder['id'] ?? 0,
                            'title'         => $accountHolder['job_title'] ?? 'CEO/Director',
                            'email'         => $accountHolder['email'] ?? '',
                            'firstname'     => trim($accountHolder['firstname'] ?? ''),
                            'lastname'      => trim($accountHolder['lastname'] ?? ''),
                            'account_owner' => true,
                            'display_name'  => trim(sprintf("%s %s", $accountHolder['firstname'] ?? '', $accountHolder['lastname'] ?? '')),
                            'type_id'       => (int)$accountHolder['type_id'],
                        ]]);
                    }
                }),

                function ($a) {
                    $a->set("result", $a->get("organisation_members"));
                },
            ]
        ],
    ],
    //Exception Middleware
    [
        "InvalidPayload" => function($exception, $action){
           $action->set("error", ["message" => $exception->getMessage()] );

        },
        "serviceError"      => Generic::exceptionResponse("HTTP/1.0 500"),
        "missingContact"    => Generic::exceptionResponse("HTTP/1.0 404"),
        "noEntityFound"     => Generic::exceptionResponse("HTTP/1.0 404"),
        "forbidden"         => Generic::exceptionResponse("HTTP/1.0 403"),
    ]
);
