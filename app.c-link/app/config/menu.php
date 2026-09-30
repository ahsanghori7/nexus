<?php

use \App\core\Environment as Env;
use \App\Utility\Url;

$app = new Url(Env::getValue("APP_CLINK_URL"));
$clink = new Url(Env::getValue("CLINK_URL"));

return [
    "sidebar" => [
        "dash" => [
            'uid' => 'index',
            "label" => "Projects",
            "url" => $app->getUriFromEnv("DASH_URI", "/main-contractor"),
            "img" => "dashboard.svg",
            "free" => true,
            "hide_by_subscription" => [
                'cost_planning_tool'
            ]
        ],
        "team" => [
            'uid' => 'team_manager',
            "label" => "Team Manager",
            "url" => $app->getUriFromEnv("TEAMS_URI", "/main-contractor/add_team"),
            "img" => "team_manager.svg",
            "free" => false,
            "hide_by_subscription" => [
                'cost_planning_tool'
            ]
        ],
        "assets" => [
            'uid' => 'company_assets',
            "label" => "Company Assets",
            "url" => $app->getUriFromEnv("ASSETS_URI", "/main-contractor/company-assets"),
            "img" => "company_assets.svg",
            "free" => false,
            "hide_by_subscription" => [
                'cost_planning_tool'
            ]
        ],
        "chain" => [
            'uid' => 'supply_chain',
            "label" => "Supply Chain",
            "url" => $app->getUriFromEnv("SUPPLY_CHAIN_URI", "/main-contractor/supply_chain"),
            "img" => "supply_chain.svg",
            "free" => false,
            "hide_by_subscription" => [
                'cost_planning_tool'
            ]
        ],
        "cost" => [
            'uid' => 'cost_planning_tool',
            "label" => "Cost Planning Tool",
            "url" => $app->getUriFromEnv("COST_PLANNING_TOOL", "/main-contractor/cost-planning-tool"),
            "img" => "calculator.svg",
            "free" => false,
            "hide_by_subscription" => [
                "free_trial_contractor"
            ]
        ],
        "suggestion" => [
            'uid' => 'suggestion',
            "label" => "Suggestion Box",
            "url" => $app->getUriFromEnv("TEAMS_URI", "/main-contractor/suggestion"),
            "img" => "help_and_support.svg",
            "free" => false,
            "hide_by_subscription" => [
                "free_trial_contractor"
            ]
        ],
        "help" => [
            'uid' => 'help',
            "label" => "Help & Support",
            "url" => $clink->getUriFromEnv("HELP_URI", "help-and-support"),
            "img" => "help_and_support.svg",
            "blank" => true,
            "free" => true,
            "hide_by_subscription" => [
                "free_trial_contractor"
            ]
        ],
        "help-anz" => [
            'uid' => 'help-anz',
            "label" => "Help & Support",
            "url" => 'https://knowledge.c-link.com/en/guides',
            "img" => "help_and_support.svg",
            "blank" => true,
            "free" => true,
            "hide_by_subscription" => [
                "free_trial_contractor"
            ]
        ]
    ]
];
