<?php
return [
    "user" => [
        "id" => \App\core\Environment::getValue("DEBUG_USER_ID", 1),
        "aid" => \App\core\Environment::getValue("DEBUG_USER_ACCOUNT", 1),
        "token" => \App\core\Environment::getValue("DEBUG_USER_TOKEN", "-"),
        "data" => [
            "email" => "tester@c-link.com"
        ]
    ]
];
