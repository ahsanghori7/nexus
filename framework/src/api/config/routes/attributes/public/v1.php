<?php

use Core\Router\Route\Helper;
use Core\Middleware\Rest;
use Core\System\Environment as E;

$region_code = E::get("REGION_CODE", 'UK');

return Helper::getTemplate(
    actions:
    [
        [
            "id" => "attribute",
            "key" => "^attribute$",
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
            "key" => "attribute\/category$",
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
            "key" => "attribute\/category\/(?<category>[a-zA-Z_-]+)$",
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
            "key" => "attribute\/category\/(?<category>[a-zA-Z_-]+)\/attributes$",
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
    ]
);
