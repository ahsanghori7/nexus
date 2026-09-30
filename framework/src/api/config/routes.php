<?php

use Core\Middleware\Generic;
use Core\Router\Route\Helper;

//for every new api endpoint we need to handle cors there is one added to the boq routes
//check TODOS in index.php
return [
    "index" => [
        "type" => "http",
        "middleware" => [],
        "default_action" => [
            "middleware" => [Generic::healthCheck()]
        ],
    ],

    //Add all group routes here
    "public" => Helper::groupedRoutes([
        require("routes/attributes/public/v1.php"),
        require("routes/account/public/v1.php"),
    ]),
    "document" => Helper::groupedRoutes([
        require("routes/document/v1.php"),
        require("routes/document/provider/asite/v1.php")
    ]),

    //Add all private routes here
    "partner" => require("routes/partner/v1.php"),
    "boq" => require("routes/boq/v1.php"),
    "project" => require("routes/project/v1.php"),
    "enquiries" => require("routes/enquiries/v1.php"),
    "companies" => require("routes/companies/v1.php"),
    "token" => require("routes/token/v1.php"),
    "ai" => require("routes/ai/v1.php"),
    "preq" => require("routes/prequalification/v1.php"),
    "account" => Helper::groupedRoutes([
        require("routes/account/v1.php"),
        require("routes/account/approval_workflow_configuration/v1.php")
    ]),
    "attribute" => require("routes/attributes/v1.php"),
    "threshold" => require("routes/threshold/v1.php"),
    "order" => require("routes/order/v1.php"),
    "roles" => require("routes/role/v1.php"),
    "account-actions" => require("routes/action/v1.php"),
    "milestones" => require("routes/milestone/v1.php"),
    "notifications" => require("routes/notification/v1.php")
];
