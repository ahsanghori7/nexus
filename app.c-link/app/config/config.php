<?php

    return array(
        'environment' => \App\core\Environment::getValue('ENVIRONMENT', 'development'),
        "assets" => [
            "url" =>  sprintf("%s/%s",
                \App\core\Environment::getValue('ASSET_URL', ""),
                \App\core\Environment::getValue('ENVIRONMENT', "")
            ),
            "schedule_of_attendances" => [
                'checked' => \App\core\Environment::getValue('SCHEDULE_OF_ATTENDANCES_CHECKED_IMAGE'),
            ]
        ],
        "currency" => [
            "symbol" => \App\core\Environment::getValue('CURRENCY_SYMBOL',"£"),
        ],
        'signatory' => [
            'docusign' => [
                'host' => \App\core\Environment::getValue('DOCUSIGN_HOST'),
                'auth' => [
                    'base_path'        => \App\core\Environment::getValue('DOCUSIGN_AUTH_PATH'),
                    'integration_key'  => \App\core\Environment::getValue('DOCUSIGN_AUTH_KEY'),
                    'user_id'          => \App\core\Environment::getValue('DOCUSIGN_AUTH_USER_ID'),
                    'account_id'       => \App\core\Environment::getValue('DOCUSIGN_AUTH_ACCOUNT_ID'),
                    'scope'            => \App\core\Environment::getValue('DOCUSIGN_AUTH_SCOPE'),
                    'private_key_file' => BASE_DIR . \App\core\Environment::getValue('DOCUSIGN_AUTH_PRIVATE_KEY'),
                ],
                'save' => [
                    'path' => \App\core\Environment::getValue('DOCUSIGN_SAVE_PATH')
                ],
                'prefix' => \App\core\Environment::getValue('DOCUSIGN_PREFIX_SIGN_AREA'),
                'prefix_date' => \App\core\Environment::getValue('DOCUSIGN_PREFIX_SIGN_DATE_AREA'),
            ]
        ],
        "cost_planning_tool" => [
          "address_api" => [
              "key" => \App\core\Environment::getValue('GET_ADDRESS_IO_API_KEY'),
          ],
          "assets" =>  \App\core\Environment::getValue('CPI_ASSETS_HOST'),
        ],
        'stripe' => [
            'access_token' => \App\core\Environment::getValue('STRIPE_TOKEN'),
            'webhook_secret_key' => \App\core\Environment::getValue('STRIPE_WEBHOOK_SECRET_KEY'),
            'subscriptions' => [
                'flexi' => [
                    'price_id' => \App\core\Environment::getValue('STRIPE_SUBSCRIPTION_FLEXI'),
                    'recurring' => false
                ],
                'regional' => [
                    'price_id' => \App\core\Environment::getValue('STRIPE_SUBSCRIPTION_REGIONAL'),
                    'recurring' => true

                ],
                'national' => [
                    'price_id' => \App\core\Environment::getValue('STRIPE_SUBSCRIPTION_NATIONAL'),
                    'recurring' => true
                ],
            ],
            'redirect' => [
                'success' => \App\core\Environment::getValue('STRIPE_REDIRECT_SUCCESS_URL'),
                'error' => \App\core\Environment::getValue('STRIPE_REDIRECT_ERROR_URL')
            ]
        ],
        "menu" => require("menu.php"),
        'gocardless' => [
            'access_token' => \App\core\Environment::getValue('GOCARDLESS_TOKEN'),
        ],
        'document' => [
          "download" => [
              "url" => \App\core\Environment::getValue('DOWNLOAD_DOCUMENT_URL', ""),
              "folder" => \App\core\Environment::getValue('DOWNLOAD_DOCUMENT_FOLDER', ""),
              "attachments" => \App\core\Environment::getValue('DOWNLOAD_ATTACHMENTS_FOLDER', ""),
            ],
            "shortcodes" => [
                "path" => __DIR__ . "/doc_creator/shortcodes",
                "mapping" => __DIR__ . "/doc_creator/short_code_mapping.json"
            ]
        ],
        'prequalification' => [
            "files" => [
                "download" => [
                    "folder" => \App\core\Environment::getValue('PREQUALIFICATION_DOWNLOAD_FILES_FOLDER', ""),
                    'bucket' => \App\core\Environment::getValue('PREQUALIFICATION_DOWNLOAD_FILES_BUCKET', ""),
                ],
            ]
        ],
        'api' => [
            'account' => [
                'url' => \App\core\Environment::getValue('ACCOUNT_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('ACCOUNT_API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('ACCOUNT_API_TOKEN', "")
                ],
                "company_logo_url" => sprintf("%s/%s/account/logo",
                    \App\core\Environment::getValue('ASSET_URL', ""),
                    \App\core\Environment::getValue('ENVIRONMENT', "")
                ),
                "supply_chain" => [
                    "hubspot" => [
                        "email" => [
                            "id" => \App\core\Environment::getValue('HS_SUPPLY_CHAIN_EMAIL_ID'),
                            "enabled" => \App\core\Environment::getValue('HS_SUPPLY_CHAIN_EMAIL_ENABLED', false)
                        ]
                    ]
                ],
                "instruction" => [
                    "hubspot" => [
                        "email" => [
                            "id" => \App\core\Environment::getValue('HS_INSTRUCTION_EMAIL_ID'),
                            "enabled" => \App\core\Environment::getValue('HS_INSTRUCTION_EMAIL_ENABLED', false)
                        ],
                        "prosper_email" => [
                            "id" => \App\core\Environment::getValue('HS_INSTRUCTION_PROSPER_EMAIL_ID'),
                            "enabled" => \App\core\Environment::getValue('HS_INSTRUCTION_EMAIL_ENABLED', false)
                        ]
                    ]
                ],
                "enquiry" => [
                    "hubspot" => [
                        "email" => [
                            "tender_document" => \App\core\Environment::getValue('HS_SEND_ENQUIRY_TENDER_EMAIL_ID'),
                            "tender_addendum_document" => \App\core\Environment::getValue('HS_SEND_ENQUIRY_TENDER_ADDENDUM_EMAIL_ID'),
                            "enabled" => \App\core\Environment::getValue('HS_SEND_ENQUIRY_EMAIL_ENABLED', false)
                        ],
                        "prosper_email" => [
                            "tender_document" => \App\core\Environment::getValue('HS_SEND_ENQUIRY_PROSPER_TENDER_EMAIL_ID'),
                            "tender_addendum_document" => \App\core\Environment::getValue('HS_SEND_ENQUIRY_PROSPER_TENDER_ADDENDUM_EMAIL_ID'),
                            "enabled" => \App\core\Environment::getValue('HS_SEND_ENQUIRY_EMAIL_ENABLED', false)
                        ],
                        "prosper_external_email" => [
                            "id" => \App\core\Environment::getValue('HS_SEND_ENQUIRY_PROSPER_EXTERNAL_EMAIL_ID'),
                            "enabled" => \App\core\Environment::getValue('HS_SEND_ENQUIRY_EMAIL_ENABLED', false)
                        ],
                        "first_enquiry_received" =>  \App\core\Environment::getValue('HS_FIRST_ENQUIRY_RECEIVED_EMAIL_ID'),
                    ],
                    "first_enquiry_received_epoch_date" =>  \App\core\Environment::getValue('ENQUIRY_FIRST_RECEIVED_EPOCH_DATE', ''),
                ],
                "interest" => [
                  "hubspot" => [
                    "interest_reminder" => \App\core\Environment::getValue('HS_SEND_INTEREST_REMINDER_EMAIL_ID'),
                    "interest_retroactively_reminder" => \App\core\Environment::getValue('HS_SEND_INTEREST_RETROACTIVELY_REMINDER_EMAIL_ID'),
                  ]
                ],
                "team_manager" => [
                    "hubspot" => [
                        "invite" => [
                            "id" => \App\core\Environment::getValue('HS_TEAM_MANAGER_INVITE_ID'),
                            "enabled" => \App\core\Environment::getValue('HS_TEAM_MANAGER_INVITE_ENABLED', false)
                        ]
                    ]
                ],
            ],
            'project' => [
                'url' => \App\core\Environment::getValue('PROJECT_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('PROJECT_API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('PROJECT_API_TOKEN', "")
                ],
                "email_to" => \App\core\Environment::getValue('PROJECT_COMMS_EMAIL_TO'),
                "email_cc_to" => \App\core\Environment::getValue('PROJECT_COMMS_CC_EMAIL_TO'),
                "email_from" => \App\core\Environment::getValue('PROJECT_COMMS_EMAIL_FROM'),
                "publish_marketplace_email_enabled" => \App\core\Environment::getValue('EMAIL_PUBLISH_MARKETPLACE_ENABLED', 0)
            ],
            'document' => [
                'url' => \App\core\Environment::getValue('DOCUMENT_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('DOCUMENT_API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('DOCUMENT_API_TOKEN', "")
                ],
                's3_bucket' => \App\core\Environment::getValue('DOCUMENT_S3_BUCKET', "asset"),
                's3_contract_bucket' => \App\core\Environment::getValue('CONTRACT_S3_BUCKET', "document"), // TODO, to review the default bucket name functionality. It's not working as expected.
                's3_structural_bucket' => \App\core\Environment::getValue('DOCUMENT_STRUCTURAL_S3_BUCKET', "asset"),
                'template' => [
                    "shortcodes" => [
                        "codes" => __DIR__ . "/doc_creator/short_codes.json",
                        "mapping" => __DIR__ . "/doc_creator/short_code_mapping.json"
                    ]
                ]
            ],
            "hubspot" => [
                "enabled" => \App\core\Environment::getValue('HUBSPOT_ENABLED', "0"),
                "url" => \App\core\Environment::getValue('HUBSPOT_URL'),
                "token" => \App\core\Environment::getValue('HUBSPOT_TOKEN'),
                "prosper" => [
                  "enabled" => \App\core\Environment::getValue('PROSPER_HUBSPOT_ENABLED', "0"),
                  "url" => \App\core\Environment::getValue('PROSPER_HUBSPOT_URL'),
                  "token" => \App\core\Environment::getValue('PROSPER_HUBSPOT_TOKEN'),
                ]
            ],
            'supply_chain' => [
                'url' => \App\core\Environment::getValue('SUPPLY_CHAIN_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('SUPPLY_CHAIN_API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('SUPPLY_CHAIN_API_TOKEN', "")
                ],
            ],
            'analytics' => [
                'url' => \App\core\Environment::getValue('ANALYTICS_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('ANALYTICS_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('ANALYTICS_API_TOKEN', "")
                ],
            ],
            'vertex' => [
                'url' => \App\core\Environment::getValue('VERTEX_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('VERTEX_SERVICE_AUTH_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('VERTEX_SERVICE_TOKEN', "")
                ],
            ],
            'api' => [
                'url' => \App\core\Environment::getValue('API_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('API_API_TOKEN', "")
                ],
            ],
            'account_v2' => [
                'url' => preg_replace(
                    '#^(https?://[^/]+)/v1/#',
                    '$1/v2/',
                    \App\core\Environment::getValue('ACCOUNT_SERVICE_URL')
                )
            ],
            'cost_planning_tool' => [
                'url' => \App\core\Environment::getValue('COST_PLANNING_TOOL_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('COST_PLANNING_TOOL_API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('COST_PLANNING_TOOL_API_TOKEN', "")
                ],
            ],
            'prequalification' => [
                'url' => \App\core\Environment::getValue('PREQUALIFICATION_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('PREQUALIFICATION_API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('PREQUALIFICATION_API_TOKEN', "")
                ],
            ],
            'company_profile' => [
                'url' => \App\core\Environment::getValue('COMPANY_PROFILE_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('COMPANY_PROFILE_API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('COMPANY_PROFILE_API_TOKEN', "")
                ],
            ],
            'trade' => [
                'url' => \App\core\Environment::getValue('SUPPLY_CHAIN_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('SUPPLY_CHAIN_API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('SUPPLY_CHAIN_API_TOKEN', "")
                ],
            ],
            "hubspot_v2" => [
                "enabled" => \App\core\Environment::getValue('HUBSPOT_ENABLED', "0"),
                "url" => \App\core\Environment::getValue('HUBSPOT_V2_URL'),
                "token" => \App\core\Environment::getValue('HUBSPOT_TOKEN'),
            ],
            "hubspot_prosper_v2" => [
                "enabled" => \App\core\Environment::getValue('PROSPER_HUBSPOT_ENABLED', "0"),
                "url" => \App\core\Environment::getValue('HUBSPOT_V2_URL'),
                "token" => \App\core\Environment::getValue('PROSPER_HUBSPOT_TOKEN'),
            ],
            "vat" => [
                "url" => "https://api.vatsense.com/1.0/validate",
                "token" => "5a8168dccd6fd7c649a12df344e1b921"
            ],
            "pricing_document" => [
                "email_to" => \App\core\Environment::getValue('PRICING_DOC_EMAIL_TO'),
                "email_from" => \App\core\Environment::getValue('PRICING_DOC_EMAIL_FROM'),
                "debug_client" => \App\core\Environment::getValue('PRICING_DOC_EMAIL_DEBUG_TO'),
            ],
            "company_house" => [
                "url" => \App\core\Environment::getValue('COMPANY_HOUSE_API', "https://api.companieshouse.gov.uk"),
                "api_key" => \App\core\Environment::getValue('COMPANY_HOUSE_API_KEY'),
                "search_url" => \App\core\Environment::getValue('COMPANY_HOUSE_SEARCH_API',
                    "https://api.company-information.service.gov.uk/advanced-search/companies"
                )
            ],
            'analyser' => [
                'url' => \App\core\Environment::getValue('ANALYSER_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('ANALYSER_API_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('ANALYSER_API_TOKEN', "")
                ],
                "enabled" => \App\core\Environment::getValue('ANALYSER_ENABLED', true)
            ],
            'email' => [
                'url' => \App\core\Environment::getValue('EMAIL_SERVICE_URL'),
                "token" => [
                    "enabled" => \App\core\Environment::getValue('EMAIL_TOKEN_ENABLED', false),
                    "hash" => \App\core\Environment::getValue('EMAIL_API_TOKEN', "")
                ],
                "default" => [
                    'clink' => [
                        'address' => \App\core\Environment::getValue('EMAIL_DEFAULT_CLINK_ADDRESS')
                    ],
                    'prosper' => [
                        'address' => \App\core\Environment::getValue('EMAIL_DEFAULT_PROSPER_ADDRESS')
                    ]
                ]
            ],
            "s3" => [
                "key_prefix" => \App\core\Environment::getValue('ENVIRONMENT')
            ],
            "sns" => [
                "enabled" =>  \App\core\Environment::getValue('SNS_ENABLED', false),
                "setup" => [
                    'region'  => \App\core\Environment::getValue("AWS_SNS_REGION",  "eu-west-2"),
                    'version' => \App\core\Environment::getValue("AWS_SNS_VERSION", 'latest'),
                    'credentials' => [
                        'key'    => App\core\Environment::getValue("AWS_SNS_KEY"),
                        'secret' => App\core\Environment::getValue("AWS_SNS_SECRET")
                    ],
                    'suppress_php_deprecation_warning' => App\core\Environment::getValue("AWS_SNS_PHP_SUPPRESS_WARNING", true),
                ],
                "topics"  => [
                    "failed_document_process" => [
                        "url" => \App\core\Environment::getValue('SNS_FDP_TOPIC_URL', false)
                    ],
                    "timeout_document_process" => [
                        "url" => \App\core\Environment::getValue('SNS_TDP_TOPIC_URL', false)
                    ],
                    "failed_send_instruction" => [
                        "url" => \App\core\Environment::getValue('SNS_FSI_TOPIC_URL', false)
                    ],
                    "failed_interest_reminder" => [
                      "url" => \App\core\Environment::getValue('SNS_FIR_TOPIC_URL', false)
                    ],
                    "info_documents_unmapped" => [
                        "url" => \App\core\Environment::getValue('SNS_IDU_TOPIC_URL', false)
                    ],
                    "failed_signatory" => [
                        "url" => \App\core\Environment::getValue('SNS_SIGNATORY_TOPIC_URL', false)
                    ],
                    "download_timeout" => [
                        "url" => \App\core\Environment::getValue('SNS_DOWNLOAD_TIMEOUT', false)
                    ],
                    "download_all_add_queue" => [
                        "url" => \App\core\Environment::getValue('SNS_DOWNLOAD_ALL_ADD_QUEUE', false)
                    ],
                    "download_all_process_queue" => [
                        "url" => \App\core\Environment::getValue('SNS_DOWNLOAD_ALL_PROCESS_QUEUE', false)
                    ],
                ]
            ],
            "sqs" => [
                "enabled" =>  \App\core\Environment::getValue('QUEUE_PROCESSING_ENABLED', false),
                "setup" => [
                    'version' => \App\core\Environment::getValue("AWS_SQS_VERSION", "latest"),
                    'region'  => \App\core\Environment::getValue("AWS_SQS_REGION", "eu-west-2"),
                    'credentials' => [
                        'key'    => App\core\Environment::getValue("AWS_SQS_KEY"),
                        'secret' => App\core\Environment::getValue("AWS_SQS_SECRET")
                    ],
                    'suppress_php_deprecation_warning' => App\core\Environment::getValue("AWS_SQS_PHP_SUPPRESS_WARNING", true)
                ],
                "queues" => [
                    "default" => [
                        "url" => \App\core\Environment::getValue('AWS_SQS_URL'),
                    ],
                    "process" => [
                        "url" => \App\core\Environment::getValue('AWS_SQS_PROCESS_URL')
                    ],
                    "publish_marketplace" => [
                        "url" => \App\core\Environment::getValue('AWS_SQS_PUBLISH_MARKETPLACE_URL')
                    ],
                    "download_all" => [
                        "url" => \App\core\Environment::getValue('AWS_SQS_DOWNLOAD_ALL_URL')
                    ],
                    "snapshot" => [
                        "url" => \App\core\Environment::getValue('AWS_SQS_SNAPSHOT_URL')
                    ],
                    "preview_snapshot" => [
                        "url" => \App\core\Environment::getValue('AWS_SQS_PREVIEW_SNAPSHOT_URL')
                    ],
                ],
                "parallel" => \App\core\Environment::getValue('AWS_SQS_PARALLEL', 1),
                "snapshot_parallel" => \App\core\Environment::getValue('AWS_SQS_SNAPSHOT_PARALLEL', 5),
                "timeout_total" => \App\core\Environment::getValue('AWS_SQS_TIMEOUT_TOTAL', 300),
                "timeout_average" => \App\core\Environment::getValue('AWS_SQS_TIMEOUT_AVERAGE', 15),
            ],
            "feedback" => [
                'url' => \App\core\Environment::getValue('ACCOUNT_SERVICE_URL'),
            ]
        ],
        'tools' => [
            "sentry" => [
                "enabled" => \App\core\Environment::getValue('SENTRY_ENABLED', false),
                "dns" => \App\core\Environment::getValue('SENTRY_DNS', false),
                "integrity" => \App\core\Environment::getValue('SENTRY_INTEGRITY', false),
                "traces" => \App\core\Environment::getValue('SENTRY_TRACES', false)
            ],
            "react" => [
                "service_url"  => \App\core\Environment::getValue('REACT_SERVICE_HOST', "http://react_service.local:3001"),
                "service_url_v2"  => \App\core\Environment::getValue('REACT_SERVICE_V2_HOST', "http://react_service_v2.local:3002")
            ],
        ],
        'directory_separator' => '/',
        'static_dashboard' => 'back-end',
        'helpers' => [
            'core/app',
            'core/config',
            'core/db',
            'core/benchmark',
            'core/views',
            'core/email',
            'core/user'
        ],
        'pages' => [
            'login' => 'login'
        ],
        'js' => [
            'root' => APP
        ],
        'db' => [
            'host' => \App\core\Environment::getValue('DB_HOST'),
            'name' => \App\core\Environment::getValue('DB_NAME'),
            'user' => \App\core\Environment::getValue('DB_USER'),
            'pass' => \App\core\Environment::getValue('DB_PASSWORD'),
            'charset' => "utf8",
            'prefix' => "framework"
        ],
        'cache' => [
            'db' => true
        ],
        'url' => [
            'site' => \App\core\Environment::getValue('APP_CLINK_URL'),
            'prosper' => \App\core\Environment::getValue('PROSPER_URL'),
            'app_prosper' => \App\core\Environment::getValue('APP_PROSPER_URL'),
            'c-link' => \App\core\Environment::getValue('CLINK_URL'),
            'admin' => \App\core\Environment::getValue('ADMIN_URL'),
        ],
        'relay' => [
            'app_prosper' => \App\core\Environment::getValue('RELAY_APP_PROSPER'),
        ],
        'path' => [
            'cache' => APP . "cache/",
            'views' => APP . "views/",
            'errors' => APP . "views/errors/",
            'images' => APP . "public/img/",
            'login' => APP . "views/login/",
            'helpers' => APP . "helpers/",
            'admin' => APP . "views/admin/",
            'public' => BASE_DIR .'/public/static/',
            'js' => [
                'pages' => SITE_URL . '/static/',
                'users' => SITE_URL . '/static/users/'
            ]
        ],
        'email' => [
            'enabled' => \App\core\Environment::getValue('EMAIL_ENABLED', 0),
            'smtp' => [
                'debug' => 0,
                'auth' => true,
                'secure' => 'tls',
                'host' => 'smtp-relay.gmail.com',
                'port' => 587,
                'username' => \App\core\Environment::getValue('EMAIL_USERNAME'),
                'password' => \App\core\Environment::getValue('EMAIL_PASSWORD')
            ],
            'prosper' => [
                'default' => [
                    'email' => 'chris@weallprosper.co.uk',
                    'name' => 'Chris Barber'
                ],
                'chris' => [
                    'email' => 'chris@weallprosper.co.uk',
                    'name' => 'Chris Barber'
                ]
            ],
            'clink' => [
                'default' => [
                    'email' => \App\core\Environment::getValue("ENQURIY_EMAIL_FROM" ,'procurement@c-link.com'),
                    'name'  => \App\core\Environment::getValue("ENQURIY_EMAIL_FROM_NAME", 'C-Link Procurement'),
                ],
                'chris' => [
                    'email' => 'chris@c-link.com',
                    'name' => 'Chris Barber'
                ],
                'paul' => [
                    'email' => \App\core\Environment::getValue("TENDER_EMAIL_PAUL" ,'paul@c-link.com'),
                    'name' => 'Paul Heming'
                ],
                'francis' => [
                    'email' => \App\core\Environment::getValue("TENDER_EMAIL_FRANCIS" ,'francis@c-link.com'),
                    'name' => 'Francis'
                ]
            ],
        ],
        'debug' => [
            'debug' => \App\core\Environment::getValue('DEBUG', false),
            'ajax' => true,
            'ajax_direct_view' => true, //alow viewing ajax request from url
            'log' => [
                'path' => APP . 'log/',
                'file' => 'log.txt'
            ],
            'email' => [
                'debug' => \App\core\Environment::getValue('DEBUG', false),
                'to' => \App\core\Environment::getValue('DEBUG_EMAIL', false),
                'cc' => \App\core\Environment::getValue('DEBUG_CC_TO', false),
                'bcc' => \App\core\Environment::getValue('DEBUG_BCC_TO', false),
            ],
            "auto_login" => (\App\core\Environment::getValue("AUTO_LOGIN_ENABLED") == 1 && \App\core\Environment::isDevelopment()),
        ],
        'csrf' => [
            'token_name' => 'framework_csrf_token'
        ],
        'session' => [
            'cookie_expiry' => 604800,
            'expire_time' => 14440
        ],
        'cookie' => [
            'domain' => \App\core\Environment::getValue('COOKIE_DOMAIN'),
            'path' => '/',
            'secure' => false,
            'http' => true,
            'secret_key' => "af&70-GF^!a{f64r5@g38l]#kQ4B+43%",
            'expiry' => 1209600
        ],
        'php' => [
            'settings' => [
                'max_execution_time' => \App\core\Environment::getValue('PHP_SETTINGS_MAX_EXECUTION_TIME', 0)
            ]
        ],
        'monitoring' => [
            'newrelic' => [
                'enabled' => \App\core\Environment::getValue('MONITORING_NEWRELIC_ENABLED', false),
            ]
        ]
    );
