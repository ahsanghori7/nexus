<?php

use Api\Middleware\ApiSession;
use Core\System\Environment as E;
use Core\Service\Auth\Token;

$app = [];
foreach (['prosper', 'email'] as $service) {
    $app += Core\System\Control::loadAppFile($service, 'config/app.php');
}

return array_merge(
    [
        "handlers" => [
            "shutdown" => [function () {}]
        ],
        "global" => [
            "default_region_group_id" => 1
        ],
        "services" => [
            "ai" => [
                "qsai" => [
                    "url"   =>  E::get("PROQUO_SERVICE_URL"),
                    "auth"  => new Token([
                        "enabled" => E::getBool("PROQUO_SERVICE_AUTH_ENABLED", false),
                        "token"   => E::get("PROQUO_SERVICE_TOKEN", false),
                    ])
                ]
            ],
            "api" => [
                "url" => E::get("API_SERVICE_URL")
            ]
        ],
        "session" => [
            "handler" => ApiSession::class,
            "dev_token" => E::get("SESSION_DEV_TOKEN"),
            "login" => [
                "email" => E::get("SESSION_LOGIN_EMAIL"),
                "password" => E::get("SESSION_LOGIN_PASSWORD"),
            ],
            'authorization' => [
                'key' => E::get("SESSION_AUTHORIZATION_KEY"),
            ]
        ],
        "boq" => [
            "pdf" => [
                "save" => [
                    "tmp" =>  E::get("BOQ_PDF_SAVE_TMP"),
                ]
            ],
            "quote" => [
                "save" => [
                    "tmp" =>  E::get("BOQ_QUOTE_SAVE_TMP"),
                ]
            ],
            "revision" => [
                "save" => [
                    "tmp" =>  E::get("BOQ_REVISION_SAVE_TMP"),
                ]
            ]
        ],
        "document" => [
            "save" => [
                "tmp" =>  E::get("DOCUMENT_SAVE_TMP"),
            ]
        ],
        "tender_recommendation" => [
            "pdf" => [
                "save" => [
                    "tmp" => E::get("TENDER_RECOMMENDATION_PDF_SAVE_TMP"),
                ]
            ]
        ],
        "relay" => [
            "app_prosper" => E::get("RELAY_APP_PROSPER"),
        ],
        "partner" => [
            "jwt" => [
                "ttl_default" => (int) E::get("PARTNER_JWT_TTL_SECONDS", 1800),
                "leeway" => (int) E::get("PARTNER_JWT_LEEWAY", 60),
                "private_key" => E::get("PARTNER_JWT_PRIVATE_KEY", ""),
                "public_key" => E::get("PARTNER_JWT_PUBLIC_KEY", ""),
            ],
        ]
    ],
    $app,
    [
        "site_url"  => E::get("PROSPER_SITE_URL"),
        "prosper_site_url"  => E::get("PROSPER_SITE_URL")
    ]
);
