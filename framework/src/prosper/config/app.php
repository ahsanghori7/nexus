<?php

use Core\System\Environment as E;
use Core\Data\Shape;
use Core\Data\Shape\Mixin;

$app = [];
foreach (['prequalification', 'company_profile', 'hubspot'] as $service) {
    $app += Core\System\Control::loadAppFile($service, 'config/app.php');
}

return array_merge(
    [
        "valid_account_type_ids" => [3, 4], //Should be dynamic really...
        "site_url"            => E::get("PROSPER_SITE_URL"),
        "prosper_site_url"  => E::get("PROSPER_SITE_URL"),
        "react_url"           => E::get("REACT_APP_URL"),
        "react_url_v1"        => E::get("REACT_APP_V1_URL"),
        "webcomponents_url"   => E::get("WEBCOMPONENTS_URL"),
        "default_subscription_label" => E::get("DEFAULT_SUBSCRIPTION_LABEL", "Free Trial"),
        "upgrade_account_url" => E::get("PROSPER_UPGRADE_ACCOUNT_URL"),
        "supply_chaib_activation_url" => E::get("SUPPLY_CHAIN_ACTIVATION_URL"),
        "promo_activation_url" => E::get("PROMO_ACTIVATION_URL"),
        "buy_tokens_url" => E::get("BUY_TOKENS_URL"),
        "prosper_wp_url"      => E::get("PROSPER_WP_URL"),
        "signup_email_check"  => E::get("SIGNUP_EMAIL_CHECK"),
        "signup_email_thank_you"  => E::get("SIGNUP_EMAIL_THANK_YOU"),
        "signup_email_enabled" => E::get("SIGNUP_EMAIL_ENABLED"),
        "signup_email_unique_company_name" => E::get("SIGNUP_EMAIL_UNIQUE_COMPANY_NAME"),
        "signup_referer_domains"  => [parse_url(strval(E::get("PROSPER_REFERER_URL")), PHP_URL_HOST)],
        "reference_activation_url" => E::get("PROSPER_REFERENCE_ACTIVATION_URL"),
        "request_access_limit" => intval(E::get("REQUEST_ACCESS_LIMIT")),
        "region_code" => E::get("REGION_CODE", "UK"),
        "cookies"  => [
            "session" => (new Shape(
                ["cookie_domain" => E::get("PROSPER_COOKIE_DOMAIN_URL", "weallprosper.co.uk"), "name" => E::get("SESSION_COOKIE_NAME", "token")],
                ["expires" => new Mixin(function ($shape) {
                    return time() + 60 * 60 * 24 * E::get("COOKIE_EXPIRY", 30);
                })]
            )),
        ],
        "clink" => [
            "site_url" => E::get("CLINK_SITE_URL")
        ],
        "hubspot_emails" => [
            "welcome_email" => intval(E::get("HUBSPOT_NEW_PROSPER_ACCOUNT_EMAIL")),
            "supply_chain_to_prosper_welcome_email" => intval(E::get("HUBSPOT_SUPPLY_CHAIN_NEW_PROSPER_ACCOUNT_EMAIL")),
            "password_reset" => intval(E::get("HUBSPOT_NEW_PASSWORD_EMAIL")),
            "work_reference" => intval(E::get("HUBSPOT_PROSPER_WORK_REFERENCE_EMAIL")),
            "quotation_submitted" => intval(E::get("HUBSPOT_QUOTATION_SUBMITTED")),
            "quotation_received_contractor" => intval(E::get("HUBSPOT_QUOTATION_CONTRACTOR_RECEIVED")),
            "tender_live" => intval(E::get("HUBSPOT_TENDER_LIVE")),
            "free_trial_opportunities" => intval(E::get("HUBSPOT_FREE_TRIAL_OPPORTUNITIES")),
            "opt_in_directory" => intval(E::get("HUBSPOT_FREE_OPT_IN_DIRECTORY")),
            "quotation_reminder" => [
                "first_reminder" => intval(E::get("HUBSPOT_QUOTATION_FIRST_REMINDER")),
                "second_reminder" => intval(E::get("HUBSPOT_QUOTATION_SECOND_REMINDER")),
            ],
            "external_subcontractor_activation_reminder" => intval(E::get("HUBSPOT_EXTERNAL_SUBCONTRACTOR_ACTIVATION_REMINDER")),
            "team_manager" => [
                'invite' => intval(E::get("HUBSPOT_TEAM_MANAGER_INVITE")),
            ],
            "prosper_pro" => [
                'upgrade_email' => intval(E::get("HUBSPOT_PROSPER_PRO_UPGRADE_EMAIL")),
            ],
            "reference" => [
                "prosper" => intval(E::get("HUBSPOT_PROSPER_REFERENCE")),
            ],
            "welcome_message" => intval(E::get("HUBSPOT_WELCOME_MESSAGE")),
            "opportunities_reminder" => intval(E::get("HUBSPOT_OPPORTUNITIES_REMINDER")),
            "request_expired_document" => intval(E::get("HUBSPOT_REQUEST_EXPIRED_DOCUMENT")),
            "tokens_top_up" => intval(E::get("HUBSPOT_TOKENS_TOP_UP")),
            "tokens_top_up_reminder" => intval(E::get("HUBSPOT_TOKENS_TOP_UP_REMINDER")),
            "request_access" => intval(E::get("HUBSPOT_REQUEST_ACCESS_EMAIL")),

        ],
        "team_manager" => [
            "activation_url" => E::get("TEAM_MANAGER_ACTIVATION_URL")
        ],
        "prosper_pro" => [
            "free_tokens_amount" => E::get("PROSPER_PRO_FREE_TOKENS_AMOUNT"),
        ],
        "handlers" => [
            "shutdown" => [function () {
            }]
        ],
        "legacy" => [
            "token" => E::get("LEGACY_TOKEN")
        ],
        "website_id" => [
            "clink" => intval(E::get("WEBSITE_CLINK_ID", 1)),
            "prosper" => intval(E::get("WEBSITE_PROSPER_ID", 2)),
        ],
        "email_interest" => [
            "enabled" => E::getBool("INTEREST_EMAIL_ENABLED", false),
            "email_id" => E::get("INTEREST_EMAIL", false),
        ],
        "free_trial" => [
            "enabled" => E::getBool("FREE_TRIAL_TOKENS_ENABLED", false),
            "amount" => intval(E::get("FREE_TRIAL_TOKENS_AMOUNT", 1)),
            "limit_latest_opportunities" => intval(E::get("FREE_TRIAL_LIMIT_LATEST_OPPORTUNITIES", 3)),
            "hide_project_name" => E::getBool("FREE_TRIAL_HIDE_PROJECT_NAME", true),
            "prequal_approved" => E::getBool("FREE_TRIAL_PREQUAL_APPROVED", false),
            "assign_random_group" => E::getBool("FREE_TRIAL_ASSIGN_RANDOM_GROUP", false),
        ],
        "tender_worth_value" => E::get("TENDER_WORTH_VALUE"),
        "first_interest" => [
            "enabled" => E::getBool("CRON_FIRST_INTERST_ENABLED", false),
            "email_id" => E::get("FIRST_INTEREST_EMAIL", false),
        ],
        "tokens" => [
            "top_up" => E::get("CRON_FREE_TOKENS_ROL_UP_AMOUNT", 0)
        ],
        "cron" => [
            "free_trial" => [
                "free_tokens_notifications" => E::getBool("CRON_FREE_TRIAL_FREE_TOKENS_NOTIFICATION", false),
                "free_tokens_top_up" => [
                    'enabled' => E::getBool("CRON_FREE_TOKENS_ROL_UP", false),
                    'amount' => E::get("CRON_FREE_TOKENS_ROL_UP_AMOUNT", false),
                ],
            ],
            "quotation_reminder" => [
                "first_reminder" => E::getBool("CRON_QUOTATION_FIRST_REMINDER", false),
                "second_reminder" => E::getBool("CRON_QUOTATION_SECOND_REMINDER", false),
                "overdue_reminder" => E::getBool("CRON_QUOTATION_OVERDUE_REMINDER", false),
            ],
            "external_subcontractor" => [
                'enabled' => E::get("CRON_EXTERNAL_SUBCONTRACTOR_ENABLED", false),
                'reminder_period' => E::get("CRON_EXTERNAL_SUBCONTRACTOR_PERIOD_ENABLED", false),
            ],
            "prosper_pro" => [
                'free_token_reminder' => E::get("CRON_PROSPER_PRO_FREE_TOKEN_REMINDER", false),
                'free_token_reminder_days'=> E::get("CRON_PROSPER_PRO_FREE_TOKEN_REMINDER_DAYS", 1),
            ],

        ],
        "scripts" => [
            'save' => [
                'path'       => E::get("SCRIPTS_TOKEN_CAMPAIGN_SAVE_DIRECTORY"),
                'permission' => E::get("SCRIPTS_TOKEN_CAMPAIGN_SAVE_PERMISSION"),
            ],
            "token_campaign" => [
                'enabled' => E::get("SCRIPTS_TOKEN_CAMPAIGN_ENABLED", false),
            ],
            "free_train_campaign" => [
                'enabled' => E::get("SCRIPTS_FREE_TRAIN_CAMPAIGN_ENABLED", false),
            ],
        ],
        "site_favicon" => [
            [
                "image" => E::get("SITE_FAVICON_PROSPER_32X32_IMAGE"),
                "sizes" => E::get("SITE_FAVICON_PROSPER_32X32_SIZES"),
                "rel"   => E::get("SITE_FAVICON_PROSPER_32X32_REL")
            ],
            [
                "image" => E::get("SITE_FAVICON_PROSPER_192X192_IMAGE"),
                "sizes" => E::get("SITE_FAVICON_PROSPER_192X192_SIZES"),
                "rel"   => E::get("SITE_FAVICON_PROSPER_192X192_REL")
            ],
            [
                "image" => E::get("SITE_FAVICON_PROSPER_APPLE_TOUCH_IMAGE"),
                "rel"   => E::get("SITE_FAVICON_PROSPER_APPLE_TOUCH_REL"),
                "sizes" => E::get("SITE_FAVICON_PROSPER_APPLE_TOUCH_SIZES"),
            ]
        ]

    ],
    $app
);
