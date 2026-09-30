<?php

namespace Api\Middleware;

use Closure;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class AccountActionMiddleware
{
    public static function getAccountActions(): Closure
    {
        return function ($action) {
            try {
                $client = Manager::getService('account');
                $actionsData = $client->fetch("account-actions/fetch-action", ['account_id' => $action->get('user.account_id')])
                                      ->getCollection('data')
                                      ->getItemsAsArray();

                if (empty($actionsData)) {
                    throw new MiddlewareException("noAccountActionsFound", "No account actions found");
                }

                // Store for next middleware/controller
                $action->set("actionsData", $actionsData);

            } catch (\Exception $e) {
                throw new MiddlewareException("accountActionFetchFailed", $e->getMessage());
            }
        };
    }
}
