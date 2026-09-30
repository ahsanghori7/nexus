<?php

use Admin\Middleware\Relay;
use Core\Data\Shape;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Core\Service\Manager;
use Core\Middleware\Service\FeatureMiddleware;

return [
    "key"   => "^relay$",
    "rules" => [Relay::isResource("features")],
    "type" => "http",
    "onError" => [
        "relayError" => function ($e, $a) {
            $a->set("json", $e->getMessage());
        },
        "noSession" => Generic::notAuthorised()
    ],
    "middleware" => [
        Session::validate()
    ],
    "actions" => [
        [
            "key" => "features$",
            "middleware" => [
                FeatureMiddleware::fetchFeatures(),
                Generic::set("json",  function ($action) {
                    return json_encode(["data" => $action->get("collection")]);
                }),
            ]
        ],
        [
            "key" => "features\/account$",
            "middleware" => [
                FeatureMiddleware::fetchAccountWithFeatures(),
                Generic::set("json",  function ($action) {
                    return json_encode(["data" => $action->get("collection")]);
                }),
            ]
        ],
        [
            "key" => "features\/account\/(?<aid>[0-9]{1,7})$",
            "middleware" => [
                FeatureMiddleware::fetchAccountWithFeatures(),
                Generic::set("json",  function ($action) {
                    return json_encode(["data" => $action->get("collection")]);
                }),
            ]
        ],
        [
            "method" => "PATCH",
            "key" => "features$",
            "middleware" => [
                function ($a) {
                    $json = $a->getRoute()->getRequest()->getData()->getShape("json");
                    $add = $json->get("add");
                    if ($add) {
                        Manager::getService('account')->update("feature/accounts", new Shape([
                            'data' => $add,
                            'options' => [
                                CURLOPT_CUSTOMREQUEST => "PATCH"
                            ]
                        ]));
                    }
                    $remove = $json->get("remove");
                    if ($remove) {
                        foreach ($remove as $r) {
                            Manager::getService("account")->delete("feature/accounts/" . $r);
                        }
                    }

                    // TODO: Remove this after the selecting features is finished. Envelopes auto selected for now
                    FeatureMiddleware::fetchAccountWithFeatures()($a);
                    $collection = $a->get("collection")->filter(function($item){
                        return is_null($item->get("feature_id"));
                    })->values("id");
                    foreach ($collection as $id) {
                        Manager::getService('account')->update("feature/2/account_mapping/$id", new Shape([
                            'options' => [
                                CURLOPT_CUSTOMREQUEST => "PATCH"
                            ]
                        ]));
                    }
                },
            ]
        ],
        [
            "key" => "features\/envelope\/(?<aid>[0-9]{1,7})$",
            "middleware" => [
                FeatureMiddleware::fetchAccountEnvelopes(),
                Generic::set("json",  function ($action) {
                    return json_encode($action->get("data"));
                }),
            ]
        ],
        [
            "method" => "PATCH",
            "key" => "features\/envelope\/(?<aid>[0-9]{1,7})$",
            "middleware" => [
                FeatureMiddleware::updateEnvelopes(),
                Generic::set("json",  function () {
                    return json_encode(["success" => true]);
                }),
            ]
        ]
    ]
];
