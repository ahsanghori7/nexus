<?php

use Core\System\Environment as E;

use Email\Service\Client\PostMark as DefaultEmailClientDefault;
use Email\Template\Loader\PostMarkTemplateLoader as DefaultEmailTemplateLoader;

return [
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
      "cost_planning_tool" => [
          'driver'    => 'mysql',
          'host'      => E::get("DB_HOST", "0.0.0.0"),
          'database'  => E::get("DATABASE_COST_PLANNING_TOOL_NAME"),
          'username'  => E::get("DATABASE_COST_PLANNING_TOOL_USER"),
          'password'  => E::get("DATABASE_COST_PLANNING_TOOL_PASSWORD"),
          'charset'   => 'utf8',
          'collation' => 'utf8_unicode_ci',
          'prefix'    => '',
      ],
  ],
  "flc_account" => [
      "id" => E::get("FLC_ACCOUNT_ID"),
      "member_emails" => E::get("FLC_ACCOUNT_MEMBER_EMAILS"),
  ],
  "email" => [
      'site' => [
          'prosper' => [
              'default' => 'no-reply@weallprosper.co.uk'
          ],
          'clink' => [
              'default' => 'procurement@c-link.com'
          ]
      ],
      'fallback' => [
          'no_reply_name' => E::get("EMAIL_FALLBACK_NO_REPLY_NAME", "C-Link Team"),
          'no_reply_email' => E::get("EMAIL_FALLBACK_NO_REPLY_EMAIL", "no-reply@c-link.com")
      ],
      'template' => [
          "loader" => [
              'default' => DefaultEmailTemplateLoader::class
          ]
      ],
      "client" => [
          "loader" => [
              'default' => DefaultEmailClientDefault::class
          ]
      ],
      "shortcodes" => [
          "list" => 'project,tender,token,extra,metadata'
      ]
  ],
  "crypto_defuse_key" => E::get("CRYPTO_DEFUSE_KEY"),
  "clients" => [
      "outlook" => [
          "smtp"   => E::get("CLIENT_OUTLOOK_SMTP"),
          "port"   => E::get("CLIENT_OUTLOOK_PORT"),
          "auth"   => E::get("CLIENT_OUTLOOK_AUTH"),
          "secure" => E::get("CLIENT_OUTLOOK_SECURE")
      ],
      "gmail" => [
          "smtp"   => E::get("CLIENT_GMAIL_SMTP"),
          "port"   => E::get("CLIENT_GMAIL_PORT"),
          "auth"   => E::get("CLIENT_GMAIL_AUTH"),
          "secure" => E::get("CLIENT_GMAIL_SECURE")
      ],
      "postmark" => [
          "auth"   => E::get("CLIENT_POSTMARK_AUTH"),
      ],
  ],
  "handlers" => [
    "shutdown" => [function() {  }],
  ],
];
