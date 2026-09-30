<?php

use Core\Middleware\Conditional;
use Core\Middleware\Generic;
use Core\Middleware\Service\AccountMiddleware;
use SupplyChain\Middleware\EloquentMiddleware;
use SupplyChain\Middleware\EmailMiddleware;
use Email\Middleware\EmailMiddleware as EmailMiddlewarev2;
use SupplyChain\Middleware\RestMiddleware;
use Core\Middleware\Collection as CollectionMiddleware;
use SupplyChain\Middleware\v2\SupplyChainMiddleware as SupplyChainMiddlewarev2;
use SupplyChain\Middleware\v2\HubspotMiddleware as HubspotMiddlewarev2;
use Prequalification\Middleware\PrequalificationMiddleware;

return [
    "index" => [
        "type" => "http",
        "middleware" => [],
        "default_action" => [
            "middleware" => [Generic::healthCheck()]
        ],
    ],
    "supply_chain" => [
        "type" => "http",
        "middleware" => [],
        "onError" => [
            "bad_request" => Generic::badRequest(),
            "invalid_contractor" => Generic::noRoute()
        ],
        "actions" => [
            [
                "middleware" => [
                    SupplyChainMiddlewarev2::loadAll(),
                    SupplyChainMiddlewarev2::loadMapping(),
                    SupplyChainMiddlewarev2::loadMappingTypes(),
                    SupplyChainMiddlewarev2::loadUsers(),
                    SupplyChainMiddlewarev2::mapUsersToCollection(),
                    SupplyChainMiddlewarev2::mapEntitiesToCollection(),
                    SupplyChainMiddlewarev2::filterDataByName(),
                    SupplyChainMiddlewarev2::orderData(),
                    CollectionMiddleware::format(function ($data) {
                        $meta            = $data->json("subcontractor.meta");
                        $contractor_meta = $meta[$data->get("parent_id")];
                        if (isset($contractor_meta['user'])) {
                            $contractor_meta['user'] += ['account_id' => $data->get("subcontractor.id")];
                        }
                        return [
                            "id"              => $data->get("subcontractor.id"),
                            "name"            => $data->get("subcontractor.name"),
                            "email"           => $contractor_meta["email"] ?? $data->get("subcontractor.email"),
                            "mobile"          => $contractor_meta["mobile"] ?? $data->get("subcontractor.mobile"),
                            "subscription_id" => $data->get("subscription_id", 0),
                            "type"            => $data->get("subcontractor.type_id"),
                            "address"         => $contractor_meta["address"] ?? $data->get("subcontractor.address"),
                            "reg_number"      => $data->get("subcontractor.reg_number"),
                            "trades"          => $data->get("trades"),
                            "regions"         => $data->get("regions"),
                            "status"          => $data->get("status"),
                            "history"         => $data->get("history"),
                            "users"           => $contractor_meta["user"] ?? $data->get("users"),
                        ];
                    }),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return ["total" => intval($a->get("total")), "collection" => $a->get("collection")];
                        }
                    ),

                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})$",
                "middleware" => [
                    SupplyChainMiddlewarev2::loadCollection(),
                    SupplyChainMiddlewarev2::loadMapping(),
                    SupplyChainMiddlewarev2::loadMappingTypes(),
                    SupplyChainMiddlewarev2::loadUsers(),
                    SupplyChainMiddlewarev2::mapUsersToCollection(),
                    SupplyChainMiddlewarev2::mapEntitiesToCollection(),
                    SupplyChainMiddlewarev2::filterDataByName(),
                    SupplyChainMiddlewarev2::orderData(),
                    function ($a) {
                        $args = $a->getRoute()->getRequest()->getArgs();
                        $defaultLimit = 100;
                        $limit = strtolower($args->get("limit", $defaultLimit));
                        $maxLimit = strtolower($args->get("max_limit", $defaultLimit));
                        SupplyChainMiddlewarev2::paginationData($limit, $maxLimit)($a);
                    },
                    CollectionMiddleware::format(function ($data) {
                        $meta            = $data->json("subcontractor.meta");
                        $contractor_meta = $meta[$data->get("parent_id")];
                        if (isset($contractor_meta['user'])) {
                            $contractor_meta['user'] += ['account_id' => $data->get("subcontractor.id")];
                        }
                        return [
                            "id"              => $data->get("subcontractor.id"),
                            "name"            => $data->get("subcontractor.name"),
                            "email"           => $contractor_meta["email"] ?? $data->get("subcontractor.email"),
                            "mobile"          => $contractor_meta["mobile"] ?? $data->get("subcontractor.mobile"),
                            "subscription_id" => $data->get("subscription_id", 0),
                            "type"            => $data->get("subcontractor.type_id"),
                            "address"         => $contractor_meta["address"] ?? $data->get("subcontractor.address"),
                            "reg_number"      => $data->get("subcontractor.reg_number"),
                            "trades"          => $data->get("trades"),
                            "regions"         => $data->get("regions"),
                            "status"          => $data->get("status"),
                            "history"         => $data->get("history"),
                            "users"           => $contractor_meta["user"] ?? $data->get("users"),
                            "created_at"      => $data->get("created_at")
                        ];
                    }),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return ["total" => intval($a->get("total")), "collection" => $a->get("collection")];
                        }
                    ),

                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})\/total$",
                "middleware" => [
                    SupplyChainMiddlewarev2::loadTotal(),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return $a->get("total", 0);
                        }
                    ),
                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})\/get_chain$",
                "middleware" => [
                    SupplyChainMiddlewarev2::loadTradesWithCategory(),
                    SupplyChainMiddlewarev2::loadCollection(),
                    SupplyChainMiddlewarev2::groupMappingByTender(),
                    SupplyChainMiddlewarev2::loadMappingTypes(),
                    SupplyChainMiddlewarev2::loadUsers(),
                    SupplyChainMiddlewarev2::mapUsersToCollection(),
                    SupplyChainMiddlewarev2::mapChainToCollection(),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return $a->get("collection");
                        }
                    ),
                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})",
                "method" => "POST",
                "middleware" => [
                    AccountMiddleware::load("type"),
                    SupplyChainMiddlewarev2::loadAccount(),
                    RestMiddleware::hasJsonBody(),
                    SupplyChainMiddlewarev2::validateData(),
                    EloquentMiddleware::loadWhere(
                        "account_v2",
                        ["name" => "body.name"],
                        function ($q, $a) {
                            $a->set("subcontractor",    $q->first());
                            $a->set("subcontractor_id", $q->first()->id);
                            $a->set("is_external",      $q->first()->type_id === (int)$a->getCollection("account_types")->filterByField("label", "external_subcontractor")->getFirst()->get("id"));
                            $a->set("is_new_account",   $q->exists() === false);
                        }
                    ),
                    SupplyChainMiddlewarev2::createSubcontractor(),
                    SupplyChainMiddlewarev2::addUser(),
                    SupplyChainMiddlewarev2::mapEntities('trades'),
                    SupplyChainMiddlewarev2::mapEntities('regions'),
                    SupplyChainMiddlewarev2::mapMeta(),
                    SupplyChainMiddlewarev2::loadMappingEntitiesByType("trades"),
                    SupplyChainMiddlewarev2::loadMappingEntitiesByType("regions"),

                    //**  Hubspot Logic **\\
                    HubspotMiddlewarev2::supplyChainProperties(),
                    HubspotMiddlewarev2::aggregateProperties(),
                    HubspotMiddlewarev2::addUser(),

                    function ($a) {
                        $a->setItems([
                            'membership_uid' => 'activated_supply_chain',
                            'type_label'     => 'external_subcontractor',
                            'email'          => $a->get("body")->get("email")
                        ]);
                    },
                    AccountMiddleware::loadByEmail('email'),

                    //Load subscription id based on label
                    EloquentMiddleware::loadWhere(
                        "subscription",
                        ["uid" => "membership_uid"],
                        function ($q, $a) {
                            $a->set("subscription_id", intval($q->first()->id));
                        }
                    ),

                    EloquentMiddleware::loadWhere(
                        "subscription",
                        ["uid" => "type_label"],
                        function ($q, $a) {
                            $a->set("subscription_external_not_activated_id", intval($q->first()->id));
                        }
                    ),

                    //Check if the account is external
                    EloquentMiddleware::loadWhere(
                        "account_type_v2",
                        ["label" => "type_label"],
                        function ($q, $a) {
                            $a->set("is_external", intval($q->first()->id) === intval($a->get("account.type_id")));
                        }
                    ),
                    SupplyChainMiddlewarev2::loadUserByAccountId("account.id"),
                    //Check if the account is activated
                    EloquentMiddleware::loadWhere(
                        "membership",
                        ["account_id" => "account.id"],
                        function ($q, $a) {
                            $users = $a->get("users") ?? [];
                            $activated = count($users) && intval($q->first()->subscription_id) !== $a->int("subscription_external_not_activated_id");
                            $a->set("is_activated", $activated);
                            $a->set("subscription_id", $q->first()->subscription_id);
                        }
                    ),
                    //Load subcontractor user id
                    EloquentMiddleware::loadWhere(
                        "user",
                        ["account_id" => "account.id"],
                        function ($q, $a) {
                            $a->set("subcontractor_uid", $q->first()->id);
                        }
                    ),
                    AccountMiddleware::loadTokenTypes("supply_chain"),

                    //Send Hubspot marketing email
                    Conditional::switched(
                        "is_new_account",
                        [
                            function ($action) {
                                $action->set("subcontractor_uid", $action->get("subcontractor_user")->toArray()['id']);
                            },
                            EmailMiddleware::sendMarketingExternalEmail(),
                        ],
                        [
                            Conditional::switched(
                                "is_activated",
                                [
                                    function ($action) {
                                        EloquentMiddleware::loadWhere(
                                            "user",
                                            ["account_id" => "subcontractor_id"],
                                            function ($q, $a) {
                                                $a->set("subcontractor_uid", $q->first()->id);
                                            }
                                        )($action);
                                    },
                                    EmailMiddleware::sendMarketingExternalReAddedEmail(),
                                ],
                                [
                                    Conditional::switched(
                                        "is_external",
                                        [
                                            function ($action) {
                                                EloquentMiddleware::loadWhere(
                                                    "user",
                                                    ["account_id" => "subcontractor_id"],
                                                    function ($q, $a) {
                                                        $a->set("subcontractor_uid", $q->first()->id);
                                                    }
                                                )($action);
                                            },
                                            EmailMiddleware::sendMarketingExternalEmail(),
                                        ],
                                        [
                                            function ($action) {
                                                EloquentMiddleware::loadWhere(
                                                    "user",
                                                    ["account_id" => "subcontractor_id"],
                                                    function ($q, $a) {
                                                        $a->set("subcontractor_uid", $q->first()->id);
                                                    }
                                                )($action);
                                            },
                                            EmailMiddleware::sendMarketingExternalEmail(),
                                        ]
                                    )
                                ]
                            )
                        ]
                    ),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return [
                                "id" => intval($a->get("subcontractor_id")),
                                "uid" => $a->get("subcontractor_uid"),
                                "subscription_id" => $a->get("subscription_id"),
                            ];
                        }
                    )
                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})\/(?<child_id>[0-9]{1,7})$",
                "method" => "PATCH",
                "middleware" => [
                    RestMiddleware::hasJsonBody(),
                    SupplyChainMiddlewarev2::validateData(),
                    SupplyChainMiddlewarev2::loadAccount(),
                    SupplyChainMiddlewarev2::loadAccount("child_id", "subcontractor"),
                    SupplyChainMiddlewarev2::mapMeta(),
                    SupplyChainMiddlewarev2::mapEntities('trades'),
                    SupplyChainMiddlewarev2::mapEntities('regions'),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return ["status" => true];
                        }
                    )
                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})\/activation_reminder\/(?<child_id>[0-9]{1,7})$",
                "method" => "PATCH",
                "middleware" => [
                    AccountMiddleware::load("type"),
                    SupplyChainMiddlewarev2::loadAccount(),
                    SupplyChainMiddlewarev2::loadAccount("child_id", "subcontractor"),
                    function ($a) {
                        $json = $a->getRoute()->getRequest()->getData()->getShape("json");
                        $senderUserId = $json->int("user_id");
                        $a->set("user_id", $senderUserId);
                        $a->set("is_external", $a->get("subcontractor")->type_id === (int)$a->getCollection("account_types")->filterByField("label", "external_subcontractor")->getFirst()->get("id"));
                    },
                    function ($a) {
                        $a->setItems([
                            'membership_uid' => 'activated_supply_chain',
                        ]);
                    },
                    //Load subscription id based on label
                    EloquentMiddleware::loadWhere(
                        "subscription",
                        ["uid" => "membership_uid"],
                        function ($q, $a) {
                            $a->set("subscription_id", intval($q->first()->id));
                        }
                    ),
                    Conditional::switched(
                        "is_external",
                        [
                            //Check if the account is activated
                            EloquentMiddleware::loadWhere(
                                "membership",
                                ["account_id" => "subcontractor_id"],
                                function ($q, $a) {
                                    $activated = (intval($q->first()->subscription_id) === $a->get("subscription_id") &&
                                        $a->get("is_external")
                                    );
                                    $a->set("not_activated", !$activated);
                                }
                            ),
                            Conditional::switched(
                                "not_activated",
                                [
                                    function ($action) {
                                        EloquentMiddleware::loadWhere(
                                            "user",
                                            ["account_id" => "subcontractor_id"],
                                            function ($q, $a) {
                                                $a->set("subcontractor_uid", $q->first()->id);
                                            }
                                        )($action);
                                    },
                                    SupplyChainMiddlewarev2::loadUserByAccountId("uriArgs.id"),
                                    EmailMiddleware::sendExternalActivateReminder(),
                                ],
                                [
                                    function ($a) {
                                        $a->set("status_email", "Activated");
                                    }
                                ]
                            )
                        ],
                        [
                            function ($a) {
                                $a->set("status_email", "notExternal");
                            }
                        ]
                    ),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return ["status" => $a->get("status_email")];
                        }
                    )
                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})\/pqq_reminder\/(?<child_id>[0-9]{1,7})$",
                "method" => "PATCH",
                "middleware" => [
                    RestMiddleware::hasJsonBody(),
                    AccountMiddleware::load("type"),
                    SupplyChainMiddlewarev2::loadAccount(),
                    SupplyChainMiddlewarev2::loadAccount("child_id", "subcontractor"),
                    function ($a) {
                        $json = $a->getRoute()->getRequest()->getData()->getShape("json");
                        $senderUserId = $json->int("user_id");
                        $a->set("user_id", $senderUserId);
                        $a->set("is_external", $a->get("subcontractor")->type_id === (int)$a->getCollection("account_types")->filterByField("label", "external_subcontractor")->getFirst()->get("id"));
                        $a->set("aid", $a->get("subcontractor_id"));
                    },
                    function ($a) {
                        $a->setItems([
                            'membership_uid' => 'activated_supply_chain',
                        ]);
                    },
                    //Load subscription id based on label
                    EloquentMiddleware::loadWhere(
                        "subscription",
                        ["uid" => "membership_uid"],
                        function ($q, $a) {
                            $a->set("subscription_id", intval($q->first()->id));
                        }
                    ),
                    EloquentMiddleware::loadWhere(
                        "user",
                        ["account_id" => "subcontractor_id"],
                        function ($q, $a) {
                            $a->set("subcontractor_uid", $q->first()->id);
                        }
                    ),
                    Conditional::switched(
                        "is_external",
                        [
                            //Check if the external subcontractor account is activated
                            EloquentMiddleware::loadWhere(
                                "membership",
                                ["account_id" => "subcontractor_id"],
                                function ($q, $a) {
                                    $subContractorUserId = $a->get('subcontractor_uid');
                                    $activated = (intval($q->first()->subscription_id) === $a->get("subscription_id") && $subContractorUserId);
                                    $a->set("is_activated", $activated);
                                }
                            )
                        ],
                        [
                            // Check if specialist SubContractor account is activated
                            function ($a) {
                                $a->set("is_activated", (bool) $a->get('subcontractor')->status);
                            }
                        ]
                    ),
                    Conditional::switched(
                        "is_activated",
                        [
                            PrequalificationMiddleware::loadCollection("subcontractor_id"),
                            PrequalificationMiddleware::loadSections(),
                            PrequalificationMiddleware::loadCompanyInformation(),
                            PrequalificationMiddleware::loadOrganisation("subcontractor_id"),
                            PrequalificationMiddleware::addOrganisationAccountOwner("subcontractor_id"),
                            PrequalificationMiddleware::loadCompanyFinancials(),
                            PrequalificationMiddleware::loadReferences(),
                            PrequalificationMiddleware::loadDocumentTypes(),
                            PrequalificationMiddleware::loadDocumentsSections(),
                            PrequalificationMiddleware::loadCertificates(),
                            PrequalificationMiddleware::loadSectionStatuses(),
                            PrequalificationMiddleware::generatePqqEmailContent(),
                            PrequalificationMiddleware::getNotificationsByReceiverId('subcontractor_uid'),
                            PrequalificationMiddleware::setUserNotificationStatus(),
                            EmailMiddleware::sendPQQReminder(),
                        ],
                        [
                            function ($a) {
                                $a->set("status_email", "notActivated");
                            }
                        ]
                    ),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return ["status" => $a->get("status_email")];
                        }
                    )
                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})\/(?<child_id>[0-9]{1,7})$",
                "method" => "DELETE",
                "middleware" => [
                    SupplyChainMiddlewarev2::loadAccount(),
                    SupplyChainMiddlewarev2::loadAccount("child_id", "subcontractor"),
                    EloquentMiddleware::deleteWhere("supply_chain_v2", [
                        "parent_id" => "main_contractor_id",
                        "child_id" => "subcontractor_id"
                    ]),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return ["status" => true];
                        }
                    )
                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})\/update_status\/(?<child_id>[0-9]{1,7})$",
                "method" => "PATCH",
                "middleware" => [
                    RestMiddleware::hasJsonBody(),
                    SupplyChainMiddlewarev2::loadAccount(),
                    SupplyChainMiddlewarev2::loadAccount("child_id", "subcontractor"),
                    SupplyChainMiddlewarev2::loadStatusTypes(),
                    SupplyChainMiddlewarev2::loadSupplyChain(),
                    SupplyChainMiddlewarev2::updateSupplyChainStatus(),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return ["status" => $a->get('success_updated')];
                        }
                    )
                ]
            ],
            [
                "key" => "(?<id>[0-9]{1,7})\/rate\/(?<child_id>[0-9]{1,7})$",
                "method" => "POST",
                "middleware" => [
                    RestMiddleware::hasJsonBody(),
                    SupplyChainMiddlewarev2::loadAccount(),
                    SupplyChainMiddlewarev2::loadAccount("child_id", "subcontractor"),
                    SupplyChainMiddlewarev2::loadSupplyChain(),
                    SupplyChainMiddlewarev2::rateSupplyChain(),
                    RestMiddleware::setJsonDataResponse(
                        function ($a) {
                            return ["status" => (bool)$a->get('rate_created')];
                        }
                    )
                ]
            ]
        ]
    ],
    "entities" => [
        "type" => "http",
        "onError" => [
            "bad_request" => Generic::badRequest()
        ],
        "actions" => [
            [
                "key" => "trades",
                "middleware" => [
                    EmailMiddlewarev2::loadEmailTypes(),
                    SupplyChainMiddlewarev2::loadMappingEntitiesByType("trades", "collection"),
                    RestMiddleware::collectionToJson()
                ]
            ],
            [
                "key" => "regions",
                "middleware" => [
                    SupplyChainMiddlewarev2::loadMappingEntitiesByType("regions", "collection"),
                    RestMiddleware::collectionToJson()
                ]
            ],
            [
                "key" => "types",
                "middleware" => [
                    SupplyChainMiddlewarev2::loadMappingEntitiesByType("project_types", "collection"),
                    RestMiddleware::collectionToJson()
                ]
            ],
        ]
    ],
];
