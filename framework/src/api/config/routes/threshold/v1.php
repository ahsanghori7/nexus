<?php

use Core\Config;
use Core\Middleware\Generic;
use Api\Middleware\ApiSession;
use Api\Middleware\PermissionMiddlerware;
use Api\Middleware\ThresholdMiddleware;
use Core\Data\Shape;
use Core\Middleware\Rest;

include_once("procedures.php");

$session_handler = Config::get("session.handler", ApiSession::class);

return [
    "type" => "http",
    "onError" => [
        "invalidToken" => $session_handler::invalidApiToken(),
        "GenericError" => Generic::exceptionResponse("HTTP/1.0 400")
    ],
    "middleware" => [
        function ($action) use ($session_handler) {
            if ($action->getRoute()->getRequest()->get("method") !== "OPTIONS") {
                $session_handler::validate()($action);
            }
        }
    ],
    "default_action" => [
        "middleware" => [
            function ($a) {
                $a->set("message", "No Threshold API Route Found");
            },
            Generic::set("json", function ($a) {
                $a->set("headers", ["HTTP/1.0 404 Not Found" => ""]);
                return json_encode(['message' => $a->get("message", ""), "code" => 404]);
            })
        ]
    ],
    "actions" => [
        [
            "id" => "update-permissions",
            "key" => "update-permission-threshold",
            "method" => "POST",
            "middleware" => [
                // Safe JSON body extractor
                function ($action) {
                    $data = $action->getRoute()->getRequest()->getData();
                    $requestData = $data->getShape('json')->get();
                    $action->set("requestData", $requestData);
                    $action->set("user_id", $requestData["user_id"] ?? null);
                    $action->set("type", $requestData['approval_threshold']["type"] ?? 'approve_none');
                    $action->set("threshold_ids", $requestData['approval_threshold']["threshold_ids"] ?? []);
                    $action->set("tender_inquiry_approval",$requestData['tender_inquiry_approval'] ?? null);
                    $action->set("subcontractor_list_approval", (bool)($requestData['subcontractor_list_approval'] ?? false));
                },

                ThresholdMiddleware::updateUserThresholds(),
                PermissionMiddlerware::getPermissions(),
                PermissionMiddlerware::getPermissionMappings("user_id"),
                PermissionMiddlerware::updateTRUserPermission(),
                PermissionMiddlerware::updateTAUserPermission(),
                PermissionMiddlerware::updateSubcontractorListApprovalPermission(),

                Generic::set("json", function ($a) {
                    return json_encode([
                        "status" => true,
                        "message" => "Permissions have been updated successfully",
                        "user_id"    => $a->get("user_id"),
                        "permissions" => [
                            "allApprovalPermissions" => ($a->get("requestData.approval_threshold.hasPermission") ?? false)
                                && ($a->get("requestData.tender_recommendation") ?? false)
                                && ($a->get("requestData.tender_inquiry_approval") ?? false)
                                && ($a->get("subcontractor_list_approval") ?? false),
                            "tender_recommendation" => $a->get("requestData.tender_recommendation"),
                            "tender_inquiry_approval" => $a->get("requestData.tender_inquiry_approval"),
                            "subcontractor_list_approval" => $a->get("subcontractor_list_approval"),
                            "approval_threshold" => [
                                "hasPermission" => $a->get("requestData.approval_threshold.hasPermission"),
                                "threshold" => [
                                    "type"       => $a->get("type"),
                                    "from_value" => $a->get("from_value"),
                                    "to_value"   => $a->get("to_value"),
                                ]
                            ],
                            "permission_count" => count(array_filter([
                                $a->get("requestData.tender_recommendation") ? 1 : 0,
                                $a->get("requestData.approval_threshold.hasPermission") ? 1 : 0,
                                $a->get("requestData.tender_inquiry_approval") ? 1 : 0,
                                $a->get("subcontractor_list_approval") ? 1 : 0,
                            ])),
                        ]
                    ]);
                }),
            ]
        ],
    ],

];
