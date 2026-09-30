<?php

use Core\Config;
use Core\Middleware\Service\AccountMiddleware;
use Prequalification\Model\PrequalificationModel;
use Core\Data\Collection;
use Core\Data\Shape;
use Prosper\Middleware\EmailMiddleware as ProsperEmailMiddleware;
$cron_active = Config::getShape("cron.document_request", []);
return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "onError" => [],
    "actions" => [
        [
            "key" => "reminder",
            "middleware" => [
                AccountMiddleware::loadTokenTypes("auto_loader"),
                function($action) use ($cron_active){
                    $requests = PrequalificationModel::getCertificateRequests([
                        'request_fullfilled_at' => 'isNull'
                    ]);
                    $aids = [];
                    (new Collection($requests, Shape::class))->map(function($request) use (&$aids, $cron_active){
                        $days = date_diff(date_create(date("Y-m-d H:i:s")), date_create($request->get("requested_at")))->format("%d");
                        if(intval($days) === ($cron_active->get("reminder_days", 3))){
                            $aids = array_merge($aids, [$request->get("requestor_id"), $request->get("document_owner")]);
                        }
                        return $request;
                    });
                    $action->setItems([
                        "account_ids" => array_unique($aids),
                        "requests"    => (new Collection($requests, Shape::class))
                    ]);
                },
                AccountMiddleware::loadAccountsByIdArray("account_ids"),
                function($a){
                    $a->getCollection("requests")->map(function($request) use ($a){
                        $accounts      = (new Collection($a->get("accounts"), Shape::class));
                        $contractor    = $accounts->filterByStringField("id", $request->get("requestor_id"))->getFirst();
                        $subcontractor = $accounts->filterByStringField("id", $request->get("document_owner"))->getFirst();
                        $a->set("data", new Shape([
                            "contractor"    => $contractor,
                            "subcontractor" => $subcontractor,
                            "user"          => new Shape($subcontractor->get("users")[0]),
                            "document"      => $request
                        ]));
                        //auto loader token
                        AccountMiddleware::loadTokenTypes("auto_loader")($a);
                        //Create an autologin token
                        AccountMiddleware::createUserToken(
                            "data.user.id", "token_type", Config::getUrl("site_url", "account/auto_loader")
                        )($a->set("token_type", $a->get("token_type")));
                        //Send the Email
                        ProsperEmailMiddleware::send("Document Request Reminder",[
                            "sender"     => $a->get("data.user"),
                            'token'      => new Shape(['url' => $a->get("token_url")]),
                            'extra'      => new Shape([
                                'company_name'  => $a->get("data.contractor.name"),
                                'document_name' => $a->get("data.document.label")
                            ]),
                        ])($a);
                    });
                }
            ]
        ],

    ]
];
