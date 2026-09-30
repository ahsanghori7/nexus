<?php

use Core\Middleware\Conditional;
use Core\Config;
use Core\Middleware\Service\AccountMiddleware;
use Prosper\Middleware\CronMiddleware;
use Prosper\Middleware\Relay\TenderMiddleware;
use Prosper\Middleware\Cron\QuoteReminderMiddleware;

$unsubscribe_email_id = 1;
$cronActive = Config::get("cron.quotation_reminder", []);

return [
    "rules" => [],
    "middleware" => [],
    "type" => "cli",
    "onError" => [],
    "actions" => [
        [
            "key" => "first_reminder",
            "middleware" => [
                Conditional::isTrue($cronActive['first_reminder'], [
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    TenderMiddleware::loadHistoryTypes(),
                    CronMiddleware::loadSubcontractorTenderHistory(),
                    AccountMiddleware::loadAccountsByIdArray("sids"),
                    AccountMiddleware::loadAccountsByIdArray("main_contractors_aids", key: "main_contractors_aids"),
                    QuoteReminderMiddleware::sendReminder("Quote - First Reminder Email (Due in 3 Days)"),
                ])
            ]
        ],
        [
            "key" => "second_reminder",
            "middleware" => [
                Conditional::isTrue($cronActive['second_reminder'], [
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    TenderMiddleware::loadHistoryTypes(),
                    CronMiddleware::loadSubcontractorTenderHistory(0),
                    AccountMiddleware::loadAccountsByIdArray("sids"),
                    AccountMiddleware::loadAccountsByIdArray("main_contractors_aids", key: "main_contractors_aids"),
                    QuoteReminderMiddleware::sendReminder("Quote - Final Reminder Email (Due Today)"),
                ])
            ]
        ],
        [
            "key" => "overdue_reminder",
            "middleware" => [
                Conditional::isTrue($cronActive['overdue_reminder'], [
                    AccountMiddleware::loadTokenTypes("auto_loader"),
                    TenderMiddleware::loadHistoryTypes(),
                    CronMiddleware::loadSubcontractorTenderHistory(-1),
                    AccountMiddleware::loadAccountsByIdArray("sids"),
                    AccountMiddleware::loadAccountsByIdArray("main_contractors_aids", key: "main_contractors_aids"),
                    QuoteReminderMiddleware::sendReminder("Quote - Overdue"),
                ])
            ]
        ],
    ]
];
