<?php

use Core\Middleware\Conditional;
use Core\Middleware\Generic;
use Core\Middleware\Relay;
use CostPlanningTool\Middleware\CostPlanningTool;

return [
  "index" => [
    "type" => "http",
    "middleware" => [],
    "default_action" => [
      "middleware" => [Generic::healthCheck()]
    ],
  ],
  "cost_planning_tool" => [
    "type" => "http",
    "middleware" => [],
    "onError" => [
      "bad_request" => Generic::badRequest(),
      "relayError" => function ($e, $a) {
        $a->set("json", $e->getMessage());
      },
    ],
    "actions" => [
        [
            "key" => "exist$",
            "method" => "GET",
            "middleware" => [
                Generic::collectUrlArguments([
                    "email" => null,
                ]),
                CostPlanningTool::loadSubmittedByEmail('submitted', 'args.email'),
                Generic::set("json",  function ($action) {
                    return json_encode($action->get("submitted"));
                }),
            ]
        ],
        [
            "key" => "submit$",
            "method" => "POST",
            "middleware" => [
                function($action){
                    $data = $action->getRoute()->getRequest()->getData();
                    $action->set("json", $data->getShape("json")->get());
                },
                CostPlanningTool::saveSubmitted("json"),

            ]
        ],
    ]
  ]
];
