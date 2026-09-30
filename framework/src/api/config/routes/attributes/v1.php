<?php

use Core\Router\Route\Helper;
use Core\Middleware\Rest;
use Core\System\Environment as E;

define("REGION_CODE", E::get("REGION_CODE", 'UK'));

return Helper::getTemplate("api",
    //Actions
    [
        [
            "id" => "attribute",
            "key" => "^$",
            "method" => "GET",
            "response_keys" => ["data" => "collection"],
            "description" => "Get all attributes",
            "middleware" => [
                Rest::fetchDynamic(
                    "account_v2",
                    "attribute",
                    [],
                    "collection"
                )
            ]
        ],
        [
            "id" => "attribute-categories",
            "key" => "category$",
            "method" => "GET",
            "response_keys" => ["data" => "collection"],
            "description" => "Get all attributes categories",
            "middleware" => [
                Rest::fetchDynamic(
                    "account_v2",
                    "attribute/category",
                    [],
                    "collection"
                )
            ]
        ],
        [
            "id" => "attribute-category",
            "key" => "category\/(?<category>[a-zA-Z_-]+)$",
            "method" => "GET",
            "response_keys" => ["data" => "collection"],
            "description" => "Get the category attributes",
            "middleware" => [
                function ($a) {
                    $a->set("region_code", REGION_CODE);
                },
                Rest::fetchDynamic(
                    "account_v2",
                    "attribute/category/{uriArgs.category}/region/{region_code}",
                    [],
                    "collection"
                )
            ]
        ],
        [
            "id" => "attribute-category-values",
            "key" => "category\/(?<category>[a-zA-Z_-]+)\/attributes$",
            "method" => "GET",
            "response_keys" => ["data" => "collection"],
            "description" => "Get the category attributes values",
            "middleware" => [
                function ($a) {
                   $a->set("region_code", REGION_CODE);
                },
                Rest::fetchDynamic(
                    "account_v2",
                    "attribute/category/{uriArgs.category}/region/{region_code}/attributes",
                    [],
                    "collection",
                    postProcessor: function($res, $a) {
                        $collection = $res->getShape("json")->get("data") ?: [];
                        usort($collection, function($a, $b) {
                            return strcmp($a['label'], $b['label']);
                        });
                        $a->set("collection", $collection);
                    }
                )
            ]
        ],
        [
            /*
             * This route is used to fetch attributes for a specific group_id.
             * Because it will use the group_id will always use the default region_code value which is UK
             * as the account is mapped always to only one region
             */
            "id" => "attribute-category-account",
            "key" => "category\/(?<category>[a-zA-Z_-]+)\/group_id\/(?<group_id>[0-9]+)\/attributes$",
            "method" => "GET",
            "response_keys" => ["data" => "collection"],
            "description" => "Get account category attributes",
            "middleware" => [
                Rest::fetchDynamic(
                    "account_v2",
                    "attribute/category/trade_category/group_id/{uriArgs.group_id}/attributes",
                    [],
                    "collection",
                    postProcessor: function($res, $a) {
                        $collection = $res->getShape("json")->get("data");
                        if(!$collection){
                            Rest::fetchDynamic(
                                "account_v2",
                                "attribute/category/trade_category/attributes",
                                [],
                                "collection",
                                postProcessor: function($res, $a) {
                                    $collection = $res->getShape("json")->get("data") ?: [];
                                    usort($collection, function($a, $b) {
                                        return strcmp($a['label'], $b['label']);
                                    });
                                    $a->set("collection", $collection);
                                    return $a;
                                }
                            )($a);
                            return $a;
                        }
                        usort($collection, function($x, $y) {
                            return strcmp($x['label'], $y['label']);
                        });
                        $a->set("collection", $collection);
                        return $a;
                    }
                )
            ]
        ],
        [
            "id" => "update-account-attributes",
            "key" => "account\/(?<account_id>[0-9]+)\/map\/(?<subcontractor_id>[0-9]+)\/attributes$",
            "method" => "PATCH",
            "response_keys" => "subcontractor.id",
            "description" => "Update a subcontractor in a main contractor's supply chain",
            "middleware" => [
                Rest::write(
                    "account_v2",
                    "account/{uriArgs.account_id}/attribute/{uriArgs.subcontractor_id}",
                    function($payload, $a) {
                        return $payload;
                    }
                ),
            ]
        ],
        [
            "id" => "attribute-project-categories-groups",
            "key" => "project\/(?<project_id>[0-9]+)\/trade_category\/groups$",
            "method" => "GET",
            "response_keys" => ["data" => "collection"],
            "description" => "Get the project trade categories groups",
            "middleware" => [
                function ($a) {
                    $a->set("region_code", REGION_CODE);
                },
                Rest::fetchDynamic(
                    "project",
                    "project/{uriArgs.project_id}/tender",
                    [],
                    "project_tenders",
                    postProcessor: function ($res, $a) {
                        $project_tenders = $res->getShape("json")->get("data") ?: [];
                        $a->set("project_tenders", $project_tenders);
                        return $a;
                    }
                ),
                Rest::fetchDynamic(
                    "account_v2",
                    "attribute/category/trade_category/region/{region_code}/attributes",
                    [],
                    "trade_categories",
                    postProcessor: function ($res, $a) {
                        $trade_categories = $res->getShape("json")->get("data") ?: [];
                        $packages_groups = [];
                        foreach ($trade_categories as $category) {
                            if (isset($category['label'])) {
                                $packages_groups[$category['label']] = $category['category'];
                            }
                        }
                        $a->set("packages_groups", $packages_groups);
                        return $a;
                    }
                ),
                function ($a) {
                    $packages_groups = $a->get('packages_groups');
                    $project_tenders = $a->get('project_tenders');
                    $group_tenders = [
                        'groups'         => [],
                        'custom_tenders' => []
                    ];
                    foreach ($project_tenders as $tender) {
                        if (!empty($tender['is_custom'])) {
                            $group_tenders['custom_tenders'][] = $tender;
                            continue;
                        }
                        $label = $packages_groups[$tender['label']] ?? null;
                        if ($label) {
                            $group_tenders['groups'][$label]['label']     = $label;
                            $group_tenders['groups'][$label]['tenders'][] = $tender;
                        }
                    }
                    ksort($group_tenders['groups']);
                    $a->set("collection", [
                        "groups"         => array_values($group_tenders['groups']),
                        "custom_tenders" => array_values($group_tenders['custom_tenders'])
                    ]);
                    return $a;
                }
            ]
        ],
    ]
);
