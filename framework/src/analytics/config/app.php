<?php

use Core\System\Environment as E;

return [
  "database" => [
      "account_service" => [
          'driver'    => 'mysql',
          'host'      => E::get("DB_HOST", "0.0.0.0"),
          'database'  => E::get("DATABASE_ACCOUNT_SERVICE_NAME"),
          'username'  => E::get("DATABASE_ACCOUNT_SERVICE_USER"),
          'password'  => E::get("DATABASE_ACCOUNT_SERVICE_PASSWORD"),
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
  "exclude_accounts" => [
      'account_ids'         => E::get("EXCLUDE_ACCOUNT_IDS_LIST", ""),
      'account_related_ids' => E::get("EXCLUDE_ACCOUNT_RELATED_IDS_LIST", ""),
  ],
  "handlers" => [
    "shutdown" => [function() {  }],
  ],
];
