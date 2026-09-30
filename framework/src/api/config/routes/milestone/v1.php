<?php

use Core\Middleware\Procedure;
use Core\Middleware\Rest;
use Core\Middleware\Generic;
use Core\Middleware\Conditional;
use Core\Data\Shape;
use Core\Config;
use Api\Middleware\ApiSession;

include_once "procedures.php";

$session_handler = Config::get("session.handler", ApiSession::class);
return [
    "type" => "http",
    "onError" => [
        "formValidation" => Generic::badRequest(),
        "invalidToken"   => $session_handler::invalidApiToken(),
        "tooManyRequests"  => Generic::tooManyRequests(),
        "noEntityFound"    => Generic::exceptionResponse("HTTP/1.0 404"),
    ],
    "actions" => [
        [
            "id" => "account_milestone_mapping_create",
            "key" => "^account\/(?<aid>[0-9]+)$",
            "method" => "POST",
            "description" => "Create account milestone mapping",
            "response_keys" => "data",
            "middleware" => [
                Generic::set("payload", function ($a) {
                    $json = $a->getRoute()->getRequest()->getData()->getShape('json');

                    if (!$json instanceof Shape) {
                        $json = new Shape($json ?? []);
                    }

                    return $json;
                }),

                Procedure::get("resolveFeatureFromMilestone"),
                Procedure::get("ensureAccountFeature"),
                Procedure::get("ensureAccountFeatureMapping"),
                Procedure::get("ensureAccountMilestoneExists"),
                Conditional::switched("milestones_exist", [
                    Generic::set("json",  function () {
                        return json_encode(['data' =>
                            [
                                'message' => 'Package milestones already exists for this account.'
                            ]
                        ]);
                    })
                ],
                [
                    function($a) {
                        Rest::write(
                            "project",
                            "milestones/account-milestone-mapping",
                            function($payload, $a) {
                                $updatedPayload = array_map(function ($milestone) use($a) {
                                    $milestone['account_id'] = (int) $a->get('uriArgs.aid');
                                    return $milestone;
                                }, $payload->get());
                                $a->updateShape("payload", $updatedPayload);
                                return $payload;
                            },
                            postProcessor: function($res, $a, $json) {
                                $a->set("data", $json->get("data"));
                            }
                        )($a);
                    }
                ])
            ]
        ],
        [
            "id" => "account_milestone_mapping_update",
            "key" => "^account\/(?<aid>[0-9]+)$",
            "method" => "PUT",
            "description" => "Update account milestone mapping",
            "response_keys" => "data",
            "middleware" => [
                Generic::set("payload", function ($a) {
                    $json = $a->getRoute()->getRequest()->getData()->getShape('json');

                    if (!$json instanceof Shape) {
                        $json = new Shape($json ?? []);
                    }

                    return $json;
                }),
                Procedure::get("resolveFeatureFromMilestone"),
                Procedure::get("ensureAccountFeature"),
                Procedure::get("ensureAccountFeatureMapping"),
                function ($a) {
                    Rest::update(
                        "project",
                        "milestones/account-milestone-mapping",
                        "payload",
                        function ($payload, $a) {
                            $updatedPayload = array_map(function ($milestone) use ($a) {
                                $milestone['account_id'] = (int) $a->get('uriArgs.aid');
                                return $milestone;
                            }, $payload->get());
                            $a->updateShape("payload", $updatedPayload);
                            return $payload;
                        },
                        function ($res, $a) {
                            $response = $res->json("content");
                            $a->set("data", $response["data"] ?? []);
                        }
                    )($a);
                }
            ]
        ]
    ]
];
