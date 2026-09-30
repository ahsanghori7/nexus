<?php

use Api\Middleware\ApiSession;
use Api\Middleware\NotificationMiddleware;
use Core\Config;
use Core\Middleware\Generic;
use Core\Util\StructuredLogger;

$session_handler = Config::get("session.handler", ApiSession::class);

$notificationServiceFailure = function ($e, $a) {
    StructuredLogger::log("NOTIF", "ERROR", "notification_relay", $e->getMessage());
    $a->set("headers", ["HTTP/1.0 502 Bad Gateway" => ""]);
    $a->set("json", json_encode([
        "success" => false,
        "message" => "Notifications service is currently unavailable",
    ]));
};

return [
    "type" => "http",
    "onError" => [
        "invalidToken" => $session_handler::invalidApiToken(),
        "notificationClientError" => function ($e, $a) {
            $payload = json_decode($e->getMessage(), true) ?: [];
            $status = (int) ($payload["status"] ?? 400);
            $reason = match ($status) {
                403 => "Forbidden",
                404 => "Not Found",
                default => "Bad Request",
            };
            $a->set("headers", ["HTTP/1.0 {$status} {$reason}" => ""]);
            $a->set("json", json_encode([
                "success" => false,
                "message" => $payload["message"] ?? "Request failed",
            ]));
        },
        "notificationFetchFailure" => $notificationServiceFailure,
        "notificationUpdateFailure" => $notificationServiceFailure,
        "notificationCreateFailure" => $notificationServiceFailure,
    ],
    "middleware" => [
        function ($action) use ($session_handler) {
            if ($action->getRoute()->getRequest()->get("method") !== "OPTIONS") {
                $session_handler::validate()($action);
            }
        },
    ],
    "default_action" => [
        "middleware" => [
            function ($a) {
                $a->set("message", "No Notifications API Route Found");
            },
            Generic::set("json", function ($a) {
                $a->set("headers", ["HTTP/1.0 404 Not Found" => ""]);
                return json_encode(["message" => $a->get("message", ""), "code" => 404]);
            }),
        ],
    ],
    "actions" => array_merge([
        //CORS HANDLER
        [
            "key" => ".*",
            "method" => "OPTIONS",
            "middleware" => [
                Generic::corsResponse()
            ]
        ],
    ], [
        [
            "id" => "notifications_create",
            "key" => "index",
            "method" => "POST",
            "middleware" => [
                function ($a) {
                    $payload = $a->getRoute()->getRequest()->getData()->getShape("json")->get();
                    $a->set("notification_payload", $payload);
                },
                NotificationMiddleware::create(),
                Generic::set("json", function ($a) {
                    return json_encode([
                        "success" => true,
                        "data" => $a->get("notification"),
                    ]);
                }),
            ],
        ],
        [
            "id" => "notifications_list",
            "key" => "index",
            "method" => "GET",
            "middleware" => [
                Generic::collectUrlArguments([
                    "since" => ["required" => false],
                    "limit" => ["required" => false],
                ]),
                NotificationMiddleware::fetchList(),
                Generic::set("json", function ($a) {
                    return json_encode([
                        "success" => true,
                        "data" => $a->get("notifications"),
                    ]);
                }),
            ],
        ],
        [
            "id" => "notifications_unread_count",
            "key" => "unread_count$",
            "method" => "GET",
            "middleware" => [
                NotificationMiddleware::fetchUnreadCount(),
                Generic::set("json", function ($a) {
                    return json_encode([
                        "success" => true,
                        "data" => ["unread_count" => $a->get("unread_count", 0)],
                    ]);
                }),
            ],
        ],
        [
            "id" => "notifications_mark_all_read",
            "key" => "mark_all_read$",
            "method" => "PATCH",
            "middleware" => [
                NotificationMiddleware::markAllRead(),
                Generic::set("json", function ($a) {
                    return json_encode(["success" => true]);
                }),
            ],
        ],
        [
            "id" => "notifications_mark_read",
            "key" => "(?<id>[0-9]+)\/read$",
            "method" => "PATCH",
            "middleware" => [
                NotificationMiddleware::markRead(),
                Generic::set("json", function ($a) {
                    return json_encode([
                        "success" => true,
                        "data" => $a->get("notification"),
                    ]);
                }),
            ],
        ],
    ]),
];
