<?php

use Prosper\Middleware\Relay;
use Prosper\Middleware\Relay\InterestsMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Prosper\Middleware\RestMiddleware;
use Core\Middleware\Collection as CollectionMiddleware;
use Prosper\Middleware\AccountMiddleware as ProsperAccountMiddleware;

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("interests")],
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
            "key" => "interests",
            "middleware" => [
                Generic::collectUrlArguments(["query" => []]),
                Relay::setJsonResponse()
            ]
        ],
        [
            "key" => "latest",
            "description" => 'deprecated',
            "middleware" => [
                InterestsMiddleware::loadCollection(),
                InterestsMiddleware::processInterests(),
                InterestsMiddleware::sortByLatestRegisteredDate(),
                CollectionMiddleware::format(function ($data) {
                    return [
                        "id"              => $data->get("id"),
                        "project"         => $data->get("name"),
                        "packages"        => $data->get("packages"),
                        'registered_date' => $data->get("latest_history"),
                    ];
                }),
                RestMiddleware::collectionToJson()
            ]
        ],
        [
            "key" => "unlocked_projects",
            "middleware" => [
                function($action){
                    $user = $action->getShape("session")->getShape("user");
                    $result = ProsperAccountMiddleware::getUnlockedProject([
                        'account_id' => intval($user->get("account_id")),
                        'user_id' => intval($user->get("id"))
                    ]);
                    $unlockedProjects = [];
                    if($result) {
                        $result->map(function ($i) use (&$unlockedProjects) {
                            if ( !isset($unlockedProjects[$i->get("project_id")]) || strtotime($i->get("created_at")) < strtotime($unlockedProjects[$i->get("project_id")]) ) {
                                $unlockedProjects[$i->get("project_id")] = $i->get("created_at");
                            }
                        });
                    }
                    $action->setItems([
                        'unlocked_projects'    => $unlockedProjects,
                        'unlocked_projets_ids' => $unlockedProjects ? array_keys($unlockedProjects) : []
                    ]);
                },
                TenderMiddleware::loadTendersByProjectIds("unlocked_projets_ids"),
                InterestsMiddleware::processUnlockedProjects(),
                InterestsMiddleware::sortByLatestRegisteredDate(),
                CollectionMiddleware::format(function ($data) {
                    return [
                        "id"              => $data->get("id"),
                        "project"         => $data->get("name"),
                        "packages"        => $data->get("packages"),
                        'registered_date' => $data->get("latest_history"),
                    ];
                }),
                RestMiddleware::collectionToJson()
            ]
        ],
    ]
];
