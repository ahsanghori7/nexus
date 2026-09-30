<?php

use Admin\Middleware\Relay;
use Admin\Middleware\Relay\Project;
use Core\Data\Shape;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Core\Middleware\Rest;
use Core\Middleware\Conditional;

return [
    "key" => "^relay$",
    "rules" => [Rest::isResource("project")],
    "middleware" => [
        Session::validate()
    ],
    "type" => "http",
    "onError" => [
        "relayError" => function ($e, $a) {
            $a->set("json", $e->getMessage());
        },
        "onError" => [
            "noSession" => Generic::notAuthorised()
        ],
    ],
    "actions" => [
        [
            "key" => "project$",
            "middleware" => [
                Generic::collectUrlArguments(["query" => []]),
                Relay::load("project", new Shape(["resource" => "project"])),
                Project::flatten(),
                Relay::setJsonResponse()
            ]
        ],
        [
            "key" => "project\/(?<id>[0-9]{1,7})$",
            "middleware" => [
                Relay::resourceByKey("project", new Shape(["resource" => "project"]))
            ],
        ],
        [
            "key" => "constant",
            "middleware" => [
                Relay::passthru("project", new Shape(["resource" => "project/constants"]))
            ]
        ],
        [
            "key" => "search",
            "middleware" => [
                Generic::collectUrlArguments(
                    ["name"   => ["required" => true]]
                ),
                Relay::load("project", new Shape(["resource" => "project"])),
                Project::flatten(),
                Relay::setJsonResponse()
            ],
        ],
        [
            "key" => "project\/(?<id>[0-9]{1,7})$",
            "method" => "PATCH",
            "middleware" => [
                Generic::set("project_status_update", function($a){
                    return $a->getRoute()
                    ->getRequest()
                    ->getJson()
                    ->getShape("data")->get("status", 0);
                }),
                Rest::updateResourceById(
                  "project", "project", "uriArgs.id", function(Shape $a) {
                        return $a->getRoute()
                            ->getRequest()
                            ->getJson()
                            ->getShape("data")->toArray();
                    }
                ),
                Conditional::switched("project_status_update", [
                    Rest::loadById("project", "uriArgs.id", "loaded_project"),
                    function($a) {
                        $tenders = $a->getShape("loaded_project")->getCollection("tender")->filterByField("state", 1, cast:"int");
                        foreach($tenders as $tender) {
                            Rest::updateResourceByUrl("project",
                                function() use($tender) {
                                    return sprintf("project/%s/tender/%s", $tender->get("project_id"), $tender->get("id"));
                                }, ["state", "published_at"])
                            (new Shape(
                                ["tender_id" => $tender->get("id"), "state" => 2, "published_at" => date("Y-m-d")]
                            ));
                        }
                    }
                ], condition: 1 )
            ]
        ],
    ]
];
