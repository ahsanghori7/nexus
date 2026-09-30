<?php

use Api\Middleware\ThresholdMiddleware;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Procedure;

Procedure::registerActions(
    "checkUpdateThresholdPermission",
    [
        function ($a) {
            ThresholdMiddleware::checkUpdateThresholdPermission()($a);
        }
    ]
);
