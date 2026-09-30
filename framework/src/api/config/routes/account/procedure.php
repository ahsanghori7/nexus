<?php

//Core Dependencies
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Procedure;
use Core\Data\Shape;
use Core\Router\Route\Action;
use Core\Service\Manager;
use Core\Middleware\Exception AS MiddlewareException;


Procedure::registerActions(
    "createAccount", [
        AccountMiddleware::loadTypes(),
        AccountMiddleware::loadSubscriptions(2),
        AccountMiddleware::validatePayload("account"),
        //Set the type_id and region_group_id based on config
        function($a){
            $a->getCollection("account_types")
                ->filterByField("label", $a->get("account_type_reference", "main_contractor"))
                ->first()->get("id");
            $a->updateShape("payload", [
                "type_id" => $type_id,
                "region_group_id" => Config::get("global.default_region_group_id")
            ]);
        },
        //Create the account subscription
        function($a){
            $a->get("subcontractor.name");
        }
    ]
);

Procedure::registerActions("fetchAndValidateAccountById", [
    function ($a) {
        $accountId = (int) $a->get("uriArgs.account_id");
        if (!$accountId) {
            throw new MiddlewareException(
                "InvalidRouteParams",
                "Account ID is required"
            );
        }

        // Fetch account from service
        $account = Manager::getService("account")
            ->fetch("account/{$accountId}")
            ->getShape("data")
            ->toArray();

        if (empty($account) || empty($account['id'])) {
            throw new MiddlewareException(
                "noEntityFound",
                "Account not found"
            );
        }

        $a->set("account", $account);

        return true;
    }
]);

Procedure::registerActions("fetchAndValidateUserById", [
    function ($a) {
        $userId = (int) $a->get("uriArgs.user_id");

        if (!$userId) {
            throw new MiddlewareException(
                "InvalidRouteParams",
                "User ID is required"
            );
        }

        $user = Manager::getService("account")
            ->fetch("user/[$userId]")
            ->getShape("data")
            ->toArray();

        if (empty($user) || !is_array($user)) {
            throw new MiddlewareException(
                "noEntityFound",
                "User not found"
            );
        }

        $a->set("user", $user);

        return true;
    }
]);
