<?php

use Core\Config;
use Core\Service\Manager;
use Core\Middleware\Generic;
use Core\Middleware\Session;
use Core\Middleware\Conditional;
use Core\Middleware\Service\AccountMiddleware as CoreAccountMiddleware;
use Prosper\Middleware\Relay;
use Prosper\Middleware\Relay\User;
use Prosper\Middleware\Relay\ProjectMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Prosper\Middleware\Relay\HubspotMiddleware;
use Prosper\Middleware\AccountMiddleware as ProsperAccountMiddleware;
use Prosper\Middleware\Relay\TokenHistoryMiddleWare;
use Prosper\Model\TeamManager;

$prosperWebsiteId = Config::get("website_id.prosper");
$hubspotEnabled = Config::get("services.hubspot.prosper.enabled");

$interestEmailEnabled = Config::get("email_interest.enabled", []);

$tenderPublishedState = 2;

return [
    "key" => "^relay$",
    "rules" => [Relay::isResource("tender")],
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
            "key" => "tender\/(?<tid>[0-9]{1,7})\/register_interest$",
            "middleware" => [
                TenderMiddleware::loadHistoryTypes(),
                TenderMiddleware::loadTenderData(),
                TenderMiddleware::registerInterest(),
                Conditional::isTrue($interestEmailEnabled, [
                    ProjectMiddleware::loadRegions(),
                    function($a){
                        $user = $a->getShape("session")->getShape("user");
                        $a->set("ccEmails", TeamManager::getTeamMemberEmails("account_id", [$user->get("email")])($user));
                    },
                    TenderMiddleware::processSendInterestEmail()
                ]),
                CoreAccountMiddleware::loadSubscriptions($prosperWebsiteId),
                Conditional::isTrue($hubspotEnabled, [
                    ProsperAccountMiddleware::loadSubcontractorData(),
                    HubspotMiddleware::loadInterestProjects(),
                    Conditional::switchedSet("subcontractor.membership.trial", "hubspot_data",
                        ['free_token_used_' => true],
                        []
                    ),
                    HubspotMiddleware::aggregateProperties(),
                    HubspotMiddleware::updateByEmail("subcontractor.user.email"),
                ])
            ]
        ],
    ]
];
