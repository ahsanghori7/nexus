<?php

use Core\Middleware\Conditional;
use Prosper\Middleware\Relay;
use Prosper\Middleware\Relay\OpportunitiesMiddleware;
use Prosper\Middleware\Relay\ProjectMiddleware;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Prosper\Middleware\RestMiddleware;
use Core\Middleware\Collection as CollectionMiddleware;
use Core\Middleware\Service\AccountMiddleware as CoreAccountMiddleware;
use Core\Config;
use Prosper\Middleware\AccountMiddleware as ProsperAccountMiddleware;

$prosperWebsiteId = Config::get("website_id.prosper");
$freeTrialLimitOpportunities = Config::get("free_trial.limit_latest_opportunities");
$freeTrialRestrictProjectTitles = Config::get("free_trial.hide_project_name");

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("opportunities")],
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
            "key" => "opportunities$",
            "middleware" => [
                Generic::collectUrlArguments(["query" => []]),
                Relay::setJsonResponse()
            ]
        ],
        [
            "key" => "latest",
            "middleware" => [
                OpportunitiesMiddleware::loadCollection(),
                ProjectMiddleware::loadConstants(),
                ProjectMiddleware::loadRegions(),
                ProjectMiddleware::loadTrades(),
                CoreAccountMiddleware::loadSubscriptions($prosperWebsiteId),
                ProsperAccountMiddleware::loadSubcontractorData(),
                function($action){
                    $user = $action->getShape("session")->getShape("user");
                    $result = ProsperAccountMiddleware::getUnlockedProject([
                        'account_id' => intval($user->get("account_id")),
                        'user_id' => intval($user->get("id"))
                    ]);
                    $action->set("unlocked_projects", $result->values("project_id"));
                },
                OpportunitiesMiddleware::reduceByActiveContractors(),
                OpportunitiesMiddleware::reduceByAccountTrades(),
                OpportunitiesMiddleware::reduceByAccountRegion(),
                OpportunitiesMiddleware::reduceByTenderHistory(),
                OpportunitiesMiddleware::reduceBySupplyChainContractor(),
                OpportunitiesMiddleware::sort(),
                Conditional::isTrue($freeTrialLimitOpportunities, [
                    OpportunitiesMiddleware::restrictByIndex($freeTrialLimitOpportunities),
                ]),
                OpportunitiesMiddleware::updateRegionLabel(),
                ProjectMiddleware::updateProjectsLabels("collection", ['phase', "type"]),
                Conditional::isTrue($freeTrialRestrictProjectTitles, [
                    OpportunitiesMiddleware::replaceValuesByMembership(),
                ]),
                OpportunitiesMiddleware::loadProjectTenderData(),
                OpportunitiesMiddleware::checkByTenderHistory(),
                OpportunitiesMiddleware::loadLiveTenders(),
                OpportunitiesMiddleware::reduceByNoTenders(),
                CollectionMiddleware::format(function ($data) {
                    return [
                        "id"                => $data->get("pid"),
                        "project"           => $data->get("name"),
                        "id_region"         => $data->get("id_region"),
                        "region"            => $data->get("region"),
                        "slug"              => $data->get("slug"),
                        "phase"             => $data->get("phase"),
                        "type"              => $data->get("type"),
                        "start"             => $data->get("start"),
                        "end"               => $data->get("end"),
                        "restricted"        => $data->get("restricted"),
                        "packages"          => $data->get("tender"),
                        "tenders"           => $data->get("tenders"),
                    ];
                }),
                RestMiddleware::collectionToJson()
            ]
        ],
    ]
];
