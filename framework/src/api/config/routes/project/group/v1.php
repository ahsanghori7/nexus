<?php

use Core\Middleware\Procedure;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;
use Core\Middleware\Generic;
use Core\Data\Shape;

return
[
    [
        "id" => "account_group_project_mapping_create",
        "key" => "^(?<project_id>[0-9]+)\/account-group-mapping$",
        "method" => "POST",
        "description" => "Create account group project mapping",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            function ($a) {
                $request = $a->getRoute()->getRequest();
                $data    = $request->getData()->getShape('json')->toArray();
                $groupIds = $data['account_group_id'] ?? [];

                if (empty($groupIds) || !is_array($groupIds)) {
                    throw new MiddlewareException(
                        "InvalidPayload",
                        "account_group_id must be a non-empty array"
                    );
                }

                $a->set('payload', new Shape([
                    'account_group_id' => $groupIds
                ]));
            },

            Rest::write(
                "project",
                "project/{uriArgs.project_id}/account-group-mapping",
                dataKey: 'payload',
                postProcessor: function ($res, $action, $data) {
                    $ids = $data->get('data.ids') ?? [];

                    $action->set("response_data", [
                        "success" => !empty($ids),
                        "ids"     => $ids
                    ]);
                }
            ),

            Generic::set("json", fn ($a) => json_encode(
                $a->get("response_data") ?? ["success" => true]
            )),
        ]
    ],
    [
        "id" => "account_group_project_mapping_get_all",
        "key" => "^(?<project_id>[0-9]+)\/account-group-mapping$",
        "method" => "GET",
        "description" => "Get all account group mappings for a project",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Rest::fetchDynamic(
                "project",
                "project/{project.id}/account-group-mapping",
                [],
                "data",
                postProcessor: null
            ),

            Generic::set("json", fn ($a) => json_encode($a->get("data"))),
        ]
    ],
];
