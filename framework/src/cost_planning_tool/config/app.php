<?php

use Core\System\Environment as E;

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
      ]

  ],
  "handlers" => [
    "shutdown" => [function() {  }],
  ],
];
