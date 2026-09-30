<?php

//Core Dependencies
use Core\Middleware\Conditional;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Core\Middleware\Collection as CollectionMiddleware;
use Core\Middleware\Service\AccountMiddleware as CoreAccountMiddleware;
use Core\Config;

//Third Party Dependencies
use Prequalification\Middleware\PrequalificationMiddleware;

//Local Dependencies
use Prosper\Middleware\AccountMiddleware as ProsperAccountMiddleware;
use Prosper\Middleware\Relay;
use Prosper\Middleware\Relay\ProjectMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Prosper\Middleware\RestMiddleware;
use Prosper\Middleware\Relay\EnquiriesMiddleware;

$prosperWebsiteId = Config::get("website_id.prosper");
$freeTrialEnabled = Config::get("free_trial.enabled");
$freeTrialRestrictProjectTitles = Config::get("free_trial.hide_project_name");
$freeTrialSetPrequalApproved = Config::get("free_trial.prequal_approved");
$tenderPublishedState = 2;

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("project")],
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
            "key" => "project\/(?<id>[0-9]{1,7})$",
            "middleware" => [
                //Load Required Data
                CoreAccountMiddleware::loadSubscriptions($prosperWebsiteId),
                ProjectMiddleware::loadConstants(),
                ProjectMiddleware::loadTrades(),
                ProjectMiddleware::loadRegions(),
                TenderMiddleware::loadHistoryTypes(),

                //Load User, Project & packages
                ProsperAccountMiddleware::loadSubcontractorData(),
                ProjectMiddleware::loadProject($tenderPublishedState),

                //Enrich project and tender data
                ProjectMiddleware::updateProjectsLabels("project", ['phase', "type"], 'project'),
                ProjectMiddleware::updateTenderLabels(['service', "size"]),

                //Enrich the available packages by Region, Trade and the tender history of the user
                ProjectMiddleware::checkByRegionAndTrade(),
                ProjectMiddleware::checkByTenderHistory(),

                ProjectMiddleware::reduceBySpecialist(),
                EnquiriesMiddleware::loadOrders(),
                function ($a) {
                    $tender_ids = $a->get("packages")->values("id");
                    $a->set("tender_ids", $tender_ids);
                },
                EnquiriesMiddleware::loadTransactionsByTenderIds(),
                ProjectMiddleware::processTenders(),

                //Check a users prequal status
                PrequalificationMiddleware::loadSections(),
                ProjectMiddleware::checkPrequalification(),

                ProjectMiddleware::countRegisteredInterests(),
                Conditional::isTrue($freeTrialEnabled, [
                    Conditional::isTrue($freeTrialSetPrequalApproved, [
                        function ($data) {
                            if ($data->get("subcontractor.membership.trial") || $data->get("subcontractor.membership.flexi")) {
                                $data->set("subcontractor", ['prequalification' => true], true);
                            }
                        }
                    ]),
                ]),

                Conditional::isTrue($freeTrialEnabled, [
                    Conditional::isTrue($freeTrialRestrictProjectTitles, [
                        ProjectMiddleware::replaceValuesByMembership(),
                    ]),
                ]),
                ProjectMiddleware::canRegister(),
                ProjectMiddleware::canRegisterMessages(),
                ProjectMiddleware::formatTenders(),
                function ($a) {
                    $packages = $a->getCollection("packages")->getItemsAsArray();
                    //We update the trade ids for the package with labels
                    foreach ($packages as $k => $package) {
                        foreach ($package["packages"] as $i => $tradeId) {
                            $packages[$k]["packages"][$i] = $a->getCollection("trades")
                                ->filterByField("id", (int) $tradeId, cast: "int")
                                ->first()
                                ->get("label");
                        }
                    }
                    $a->set("collection", [$a->getShape("project")->toArray() + ["packages" => $packages]]);
                },
                CollectionMiddleware::format(function ($data) {
                    return [
                        "id"                => $data->get("id"),
                        "project"           => $data->get("name"),
                        "region"            => $data->get("region_label"),
                        "slug"              => $data->get("slug"),
                        "phase"             => $data->get("phase"),
                        "type"              => $data->get("type"),
                        "start"             => $data->get("start"),
                        "end"               => $data->get("end"),
                        "description"       => $data->get("description"),
                        "author_id"         => $data->get("project_creator"),
                        "group_id"          => $data->get("group_id"),
                        "tenders"           => $data->get("packages"),
                    ];
                }),
                RestMiddleware::collectionToJson()
            ]
        ],
    ]
];
