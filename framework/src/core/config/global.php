<?php

use Core\Service\Auth\Bearer;
use Core\System\Environment as E;
use Core\Service\Auth\Token;
use Core\Service\Auth\Basic;

return [
    "environment" => E::get("ENV"),
    "site_url" => E::get("PROSPER_SITE_URL"),
    "session" => [
        "cookie_name" =>  E::get("SESSION_COOKIE_NAME", "token")
    ],
    "eloquent" => [
        "database" => [
            "account_service" => [
                'driver'    => 'mysql',
                'host'      => E::get("DB_HOST", "0.0.0.0"),
                'database'  => E::get("DATABASE_NAME"),
                'username'  => E::get("DATABASE_USER"),
                'password'  => E::get("DATABASE_PASSWORD"),
                'charset'   => 'utf8',
                'collation' => 'utf8_unicode_ci',
                'prefix'    => '',
            ],
            "project_service" => [
                'driver'    => 'mysql',
                'host'      => E::get("DB_HOST", "0.0.0.0"),
                'database'  => E::get("DATABASE_PROJECT_SERVICE_NAME"),
                'username'  => E::get("DATABASE_PROJECT_SERVICE_USER"),
                'password'  => E::get("DATABASE_PROJECT_SERVICE_PASSWORD"),
                'charset'   => 'utf8',
                'collation' => 'utf8_unicode_ci',
                'prefix'    => '',
            ]

        ],
    ],
    "document" => [
        "storage" => [
            "default" => E::get('DOCUMENT_STORAGE_CLIENT_DEFAULT', 's3'),
        ],
        "file" => [
            "default" => E::get('DOCUMENT_FILE_CLIENT_DEFAULT', 'symfony'),
        ]
    ],
    "services" => [
        "account" => [
            "url"   =>  E::get("ACCOUNT_SERVICE_URL"),
            "auth"  => new Token([
                "enabled" => E::getBool("ACCOUNT_SERVICE_AUTH_ENABLED"),
                "token"   => E::get("ACCOUNT_SERVICE_TOKEN"),
            ])
        ],
        "project" => [
            "url"   =>  E::get("PROJECT_SERVICE_URL"),
            "auth"  => new Token([
                "enabled" => E::getBool("PROJECT_SERVICE_AUTH_ENABLED"),
                "token"   => E::get("PROJECT_SERVICE_TOKEN"),
            ])
        ],
        "document" => [
            "url"   =>  E::get("DOCUMENT_SERVICE_URL"),
            "auth"  => new Token([
                "enabled" => E::getBool("DOCUMENT_SERVICE_AUTH_ENABLED"),
                "token"   => E::get("DOCUMENT_SERVICE_TOKEN"),
            ])
        ],
        "vertex" => [
            "url"   =>  E::get("VERTEX_SERVICE_URL"),
            "auth"  => new Token([
                "enabled" => E::getBool("VERTEX_SERVICE_AUTH_ENABLED"),
                "token"   => E::get("VERTEX_SERVICE_TOKEN"),
            ])
        ],
        "analytics" => [
            "url"   =>  E::get("ANALYTICS_SERVICE_URL"),
            "auth"  => new Token([
                "enabled" => E::getBool("ANALYTICS_SERVICE_AUTH_ENABLED"),
                "token"   => E::get("ANALYTICS_SERVICE_TOKEN"),
            ])
        ],
        "comms" => [
            "url"   =>  E::get("COMMS_SERVICE_API_URL"),
        ],
        "legacy" => [
            "url"   =>  E::get("LEGACY_SERVICE_API_URL"),
        ],
        "company_house" => [
            "url"   => E::get('COMPANY_HOUSE_API', "https://api.companieshouse.gov.uk"),
            "auth"  => new Basic([
                "enabled" => E::getBool("COMPANY_HOUSE_API_AUTH_ENABLED", true),
                "prefix"   => E::get("COMPANY_HOUSE_API_KEY"),
            ])
        ],
        "email" => [
            "url"   =>  E::get("EMAIL_SERVICE_URL"),
            "auth"  => new Token([
                "enabled" => E::getBool("EMAIL_SERVICE_AUTH_ENABLED"),
                "token"   => E::get("EMAIL_SERVICE_TOKEN"),
            ])
        ],
        "hubspot" => [
            "prosper" => [
                "url" => E::get("HUBSPOT_URL"),
                "enabled" => E::getBool("PROSPER_HUBSPOT_ENABLED"),
                "auth"  => new Bearer([
                    "enabled" => E::getBool("PROSPER_HUBSPOT_AUTH_ENABLED", true),
                    "token"   => E::get("PROSPER_HUBSPOT_API_KEY"),
                ])
            ],
            "clink" => [
                "url" => E::get("HUBSPOT_URL"),
                "enabled" => E::getBool("CLINK_HUBSPOT_ENABLED"),
                "auth"  => new Bearer([
                    "enabled" => E::getBool("CLINK_HUBSPOT_ENABLED"),
                    "token"   => E::get("CLINK_HUBSPOT_API_KEY"),
                ])
            ],
            "framework" => [
                "url"   =>  E::get("HUBSPOT_SERVICE_URL"),
                "auth"  => new Token([
                    "enabled" => E::getBool("HUBSPOT_SERVICE_AUTH_ENABLED"),
                    "token"   => E::get("HUBSPOT_SERVICE_TOKEN"),
                ])
            ]
        ],
        "google" => [
            "maps" => [
                "url"   =>  E::get("GOOGLE_MAPS_SERVICE_URL"),
                "auth"  => new Token([
                    "enabled" => E::getBool("GOOGLE_MAPS_SERVICE_AUTH_ENABLED"),
                    "token"   => E::get("GOOGLE_MAPS_SERVICE_API_KEY"),
                    "token_key" => 'key'
                ])
            ]
        ],
        "aws" => [
            "s3" => [
                "access_key" => E::get("AWS_S3_ACCESS_KEY_ID"),
                "secret_key" => E::get("AWS_S3_SECRET_ACCESS_KEY"),
                "region"     => E::get("AWS_S3_REGION", "eu-west-2"),
                "version"    => E::get("AWS_S3_VERSION", "latest"),
                "key_prefix" => E::get("ENV"),
                "url"        => E::get("AWS_S3_ASSET_URL"),
                "bucket"     => [
                    "document"   => E::get("AWS_S3_DOCUMENT_BUCKET", "clink-pdf"),
                    "asset"      => E::get("AWS_S3_ASSET_BUCKET", "clink-assets"),
                    "local"      => E::get("AWS_S3_BUCKET", "clink-local-docs"),
                    "email"      => E::get("AWS_S3_EMAIL_BUCKET", "clink-assets"),
                    "pdf"        => E::get("AWS_S3_PDF_BUCKET", "clink-pdfs"),
                    "documents"  => E::get("AWS_S3_DOCUMENTS_BUCKET_FOLDER", "clink-pdf-documents"),
                ]
            ],
            "sns" => [
                "access_key" => E::get("AWS_SNS_ACCESS_KEY_ID"),
                "secret_key" => E::get("AWS_SNS_SECRET_ACCESS_KEY"),
                "region"     => E::get("AWS_SNS_REGION", "eu-west-2"),
                "version"    => E::get("AWS_SNS_VERSION", "latest"),
                "topics"     => [
                    "file_upload_error" => [
                        "url" => E::get('AWS_SNS_FUE_TOPIC_URL', false)
                    ],
                    "tracking_error" => [
                        "url" => E::get('AWS_SNS_TRE_TOPIC_URL', false)
                    ],
                    "failed_quote_submitted" => [
                        "url" => E::get('AWS_SNS_FQE_TOPIC_URL', false)
                    ],
                    "failed_opportunities_cron_send" => [
                        "url" => E::get('AWS_SNS_OCS_TOPIC_URL', false)
                    ],
                    "failed_document_process" => [
                        "url" => E::get('SNS_FDP_TOPIC_URL', false)
                    ],
                    "failed_approval_requests_cron_send" => [
                        "url" => E::get('AWS_SNS_ARS_TOPIC_URL', false)
                    ],
                    "failed_pqq_statuses_cron" => [
                        "url" => E::get('AWS_SNS_PQQ_TOPIC_URL', false)
                    ],
                ]
            ],
            "sqs" => [
                "url"        => E::get('AWS_SQS_URL'),
                "enabled"    => E::get('QUEUE_PROCESSING_ENABLED', false),
                'version'    => E::get("AWS_SQS_VERSION", "latest"),
                'region'     => E::get("AWS_SQS_REGION", "eu-west-2"),
                'access_key' => E::get("AWS_SQS_KEY"),
                'secret_key' => E::get("AWS_SQS_SECRET"),
                "parallel" => E::get('AWS_SQS_PARALLEL', 1),
                "timeout_total" => E::get('AWS_SQS_TIMEOUT_TOTAL', 300),
                "timeout_average" => E::get('AWS_SQS_TIMEOUT_AVERAGE', 15),
                "queues" => [
                    "email" => E::get('AWS_SQS_EMAIL_QUEUE'),
                    "document_creator" => E::get('AWS_SQS_EMAIL_QUEUE_DEVELOPMENT'),
                    "approval_email" => E::get('AWS_SQS_APPROVAL_EMAIL_QUEUE', false),
                ]
            ],
            "ssm" => [
                'version'    => E::get("AWS_SSM_VERSION", "latest"),
                'region'     => E::get("AWS_SSM_REGION", "eu-west-2"),
                'access_key' => E::get("AWS_SSM_KEY"),
                'secret_key' => E::get("AWS_SSM_SECRET")

            ]
        ],
        'stripe' => [
            'access_token' => E::get('STRIPE_TOKEN'),
            'webhook_secret_key' => E::get('STRIPE_WEBHOOK_SECRET_KEY'),
            'subscriptions' => [
                'a5' => [
                    'id'              => "a5",
                    'group'           => 'A',
                    'price_id'        => E::get('STRIPE_SUBSCRIPTION_STRATEGY_A5_TOKENS'),
                    'price'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_A5_TOKENS_PRICE'),
                    'label'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_A5_TOKENS_LABEL'),
                    'tokens_received' => intval(E::get('STRIPE_SUBSCRIPTION_STRATEGY_A5_TOKENS_RECEIVED')),
                    'recurring'       => false
                ],
                'a10' => [
                    'id'              => "a10",
                    'group'           => 'A',
                    'price_id'        => E::get('STRIPE_SUBSCRIPTION_STRATEGY_A10_TOKENS'),
                    'label'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_A10_TOKENS_LABEL'),
                    'price'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_A10_TOKENS_PRICE'),
                    'tokens_received' => intval(E::get('STRIPE_SUBSCRIPTION_STRATEGY_A10_TOKENS_RECEIVED')),
                    'recurring'       => false
                ],
                'a20' => [
                    'id'              => "a20",
                    'group'           => 'A',
                    'price_id'        => E::get('STRIPE_SUBSCRIPTION_STRATEGY_A20_TOKENS'),
                    'label'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_A20_TOKENS_LABEL'),
                    'price'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_A20_TOKENS_PRICE'),
                    'tokens_received' => intval(E::get('STRIPE_SUBSCRIPTION_STRATEGY_A20_TOKENS_RECEIVED')),
                    'recurring'       => false
                ],
                'b1' => [
                    'id'              => "b1",
                    'group'           => 'B',
                    'price_id'        => E::get('STRIPE_SUBSCRIPTION_STRATEGY_B1_TOKENS'),
                    'label'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_B1_TOKENS_LABEL'),
                    'price'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_B1_TOKENS_PRICE'),
                    'tokens_received' => intval(E::get('STRIPE_SUBSCRIPTION_STRATEGY_B1_TOKENS_RECEIVED')),
                    'recurring'       => false
                ],
                'b5' => [
                    'id'              => "b5",
                    'group'           => 'B',
                    'price_id'        => E::get('STRIPE_SUBSCRIPTION_STRATEGY_B5_TOKENS'),
                    'label'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_B5_TOKENS_LABEL'),
                    'price'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_B5_TOKENS_PRICE'),
                    'tokens_received' => intval(E::get('STRIPE_SUBSCRIPTION_STRATEGY_B5_TOKENS_RECEIVED')),
                    'recurring'       => false
                ],
                'b10' => [
                    'id'              => "b10",
                    'group'           => 'B',
                    'price_id'        => E::get('STRIPE_SUBSCRIPTION_STRATEGY_B10_TOKENS'),
                    'label'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_B10_TOKENS_LABEL'),
                    'price'           => E::get('STRIPE_SUBSCRIPTION_STRATEGY_B10_TOKENS_PRICE'),
                    'tokens_received' => intval(E::get('STRIPE_SUBSCRIPTION_STRATEGY_B10_TOKENS_RECEIVED')),
                    'recurring'       => false
                ],
            ],
            'redirect' => [
                'success' => E::get('STRIPE_REDIRECT_SUCCESS_URL'),
                'error' => E::get('STRIPE_REDIRECT_ERROR_URL')
            ],
        ],
    ],
    "postmark" => [
        "image" => [
            "type" => E::get("POSTMARK_IMAGE_TYPE_PATH")
        ]
    ]
];
