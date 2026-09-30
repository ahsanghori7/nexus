<?php

use Analytics\Middleware\TokenHistoryMiddleware;
use Core\Config;
use Core\Middleware\Conditional;
use Core\Middleware\Generic;
use Core\Middleware\Relay;
use Analytics\Middleware\TrackingMiddleware;
use Analytics\Middleware\HistoryMiddleware;

return [
  "index" => [
    "type" => "http",
    "middleware" => [],
    "default_action" => [
      "middleware" => [Generic::healthCheck()]
    ],
  ],
  "analytics" => [
    "type" => "http",
    "middleware" => [],
    "onError" => [
      "bad_request" => Generic::badRequest(),
      "invalid_subcontractor" => Generic::noRoute(),
      "relayError" => function ($e, $a) {
        $a->set("json", $e->getMessage());
      },
    ],
    "actions" => [
      [
        "key" => "tokens$",
        "method" => "GET",
        "middleware" => [
          Generic::collectUrlArguments([
            "start_date" => null,
            "end_date"   => null,
            "token_type" => null,
            "interval"   => null,
            "type"       => null,
          ]),
          TokenHistoryMiddleWare::setDateIntervalKey("args.interval"),
          TokenHistoryMiddleWare::generateDatesInterval("args.start_date", "args.end_date", "args.interval"),
          Conditional::switched(
            "args.type",
            [
              TokenHistoryMiddleWare::getCollection("issued", "args"),
              TokenHistoryMiddleWare::getHistorySubcontractorData("account_id"),
              TokenHistoryMiddleWare::getHistoryProjectData("project_id"),
              TokenHistoryMiddleWare::aggregateData("timestamp", "interval_date_key"),
            ],
            [
              TokenHistoryMiddleWare::getCollection("used", "args"),
              TokenHistoryMiddleWare::getHistorySubcontractorData("account_id"),
              TokenHistoryMiddleWare::getHistoryProjectData("project_id"),
              TokenHistoryMiddleWare::aggregateData("created_at", "interval_date_key"),
            ],
            "issued"
          ),
          Generic::set("json",  function ($action) {
            return json_encode($action->get("relay"));
          }),
        ]
      ],
      [
        "key" => "tracking$",
        "method" => "POST",
        "middleware" => [
          function ($action) {
            $user = $action->getShape("session")->getShape("user");
            $account = $action->getShape("session")->getShape("account");
            $action->set("subcontractor", [
              'aid' => $account->get("id"),
              'id'  => $user->get("id")
            ]);
          },
          TrackingMiddleware::track(),
          Generic::set("json",  function ($action) {
            return json_encode(["success" => true]);
          }),
        ]
      ],
      [
        "key" => "actions$",
        "method" => "GET",
        "middleware" => [
          function ($a) {
              $a->setItems([
                  'args' => $a->getRoute()->getRequest()->getArgs(),
                  'exclude_accounts' => array_filter(explode(",", Config::get("exclude_accounts.account_ids"))),
                  'exclude_related_accounts' => array_filter(explode(",", Config::get("exclude_accounts.account_related_ids"))),
              ]);
          },
          TrackingMiddleware::loadCollection(),
          TrackingMiddleware::excludeAccounts(),
          TrackingMiddleware::trackingActions('args.type'),
          Generic::set("json",  function ($action) {
            return json_encode(["data" => $action->get("data")]);
          }),
        ]
      ],
      [
        "key" => "^history$",
        "method" => "GET",
        "middleware" => [
          function ($a) {
            $a->set("args", $a->getRoute()->getRequest()->getArgs());
          },
          HistoryMiddleware::loadHistoryStatuses(),
          HistoryMiddleware::loadCollection(),
          HistoryMiddleware::groupHistoryByType(),
          HistoryMiddleware::parseHistory(),
          Generic::set("json",  function ($action) {
            return json_encode(["data" => $action->get("history", [])]);
          }),
        ]
      ],
    ]
  ]
];
