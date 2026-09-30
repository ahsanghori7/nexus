<?php

use Core\Middleware\Service\AccountMiddleware;
use Api\Middleware\ProjectMiddleware;
use Core\Middleware\Procedure;

//ToDo: Store Actions as a Class Method reference, rather than a call back so that args can be override later on
Procedure::registerActions("fetchAndValidateProject",
    [
       "fetchProject"    => ProjectMiddleware::fetchProject("slug", "uriArgs.project_slug"),
       "accountIsTypeOf" => AccountMiddleware::ifIsATypeOf(AccountMiddleware::MAIN_CONTRACTOR_TYPE, function($a, $isType) {
            ProjectMiddleware::checkProjectOwnershipById()($a);
        }, onlyCallbackOnTrue:true)
    ]
);
