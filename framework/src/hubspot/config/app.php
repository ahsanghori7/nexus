<?php

use Core\System\Environment as E;
use Core\Config;
use Core\Middleware\Generic;

return [
    "hubspot" => [
        "api_token_name" => E::get("HUBSPOT_WEBHOOK_HANDLER_API_KEY", "api_token"),
        "api_token" => E::get("HUBSPOT_WEBHOOK_HANDLER_API_TOKEN"),
        "email_promo_id" => E::get("HUBSPOT_EMAIL_PROMO_ID"),
    ],
    "site_url_prosper"      => E::get("SITE_URL_PROSPER"),
    "handlers" => [
        "shutdown" => [function () {
        }]
    ],
];
