<?php
//Core Dependencies
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Procedure;
use Core\Middleware\Conditional;

//Api Dependencies
use Api\Middleware\ProjectMiddleware;

Procedure::registerActions(
    "checkProjectOwnerShip", [
        function ($a) {
            ProjectMiddleware::fetchProject(Procedure::getData("key")($a), projectValueKey: Procedure::getData("value")($a))($a);
        },
        AccountMiddleware::ifIsATypeOf(AccountMiddleware::ADMIN_TYPE, function($a) {
            $a->set("is_admin", true);
        }, onlyCallbackOnTrue:true),
        Conditional::switched("is_admin", [],
            [
                function ($a) {
                    ProjectMiddleware::checkProjectOwnershipById()($a);
                }
            ]
        )
    ]
);
