<?php

use Api\Middleware\PartnerAuthMiddleware;
use Api\Middleware\PartnerCatalogueMiddleware;
use Api\Middleware\ScopeMiddleware;
use Api\Util\PartnerError;

return [
    "key" => "^api$",
    "type" => "http",
    "onError" => [
        "validation_failed" => PartnerError::handler("validation_failed"),
        "project_name_exists" => PartnerError::handler("project_name_exists"),
        "invalid_client" => PartnerError::handler("invalid_client"),
        "invalid_token" => PartnerError::handler("invalid_token"),
        "insufficient_scope" => PartnerError::handler("insufficient_scope"),
        "not_found" => PartnerError::handler("not_found"),
        "external_project_conflict" => PartnerError::handler("external_project_conflict"),
        "business_unit_not_mapped" => PartnerError::handler("business_unit_not_mapped"),
        "internal_error" => PartnerError::handler("internal_error"),
    ],
    "default_action" => [
        "middleware" => [
            function ($action) {
                PartnerError::emit($action, "not_found");
            },
        ],
    ],
    "actions" => [
        [
            "key" => "^partner\/v1\/oauth\/token$",
            "method" => "POST",
            "middleware" => [
                PartnerAuthMiddleware::issue(),
            ],
        ],
        [
            "key" => "^partner\/v1\/business-units$",
            "method" => "GET",
            "middleware" => [
                PartnerAuthMiddleware::validate(),
                ScopeMiddleware::requireScope("projects:read"),
                PartnerCatalogueMiddleware::listBusinessUnits(),
            ],
        ],
        [
            "key" => "^partner\/v1\/projects$",
            "method" => "GET",
            "middleware" => [
                PartnerAuthMiddleware::validate(),
                ScopeMiddleware::requireScope("projects:read"),
                PartnerCatalogueMiddleware::listProjects(),
            ],
        ],
        [
            "key" => "^partner\/v1\/projects$",
            "method" => "POST",
            "middleware" => [
                PartnerAuthMiddleware::validate(),
                ScopeMiddleware::requireScope("projects:write"),
                PartnerCatalogueMiddleware::createProject(),
            ],
        ],
        [
            "key" => "^partner\/v1\/projects\/(?<external_id>[^\/]+)$",
            "method" => "GET",
            "middleware" => [
                PartnerAuthMiddleware::validate(),
                ScopeMiddleware::requireScope("projects:read"),
                PartnerCatalogueMiddleware::getProject(),
            ],
        ],
    ],
];
