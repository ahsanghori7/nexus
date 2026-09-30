<?php

namespace Api\Middleware;

use Closure;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class RoleMiddleware
{
    public static function getRoles(): Closure
    {
        return function ($action) {
            try {
                $client = Manager::getService('account');
                $rolesData = $client->fetch("roles/roles-level")
                                    ->getCollection('data')
                                    ->getItemsAsArray();

                if (empty($rolesData)) {
                    throw new MiddlewareException("noRolesFound", "No role levels found");
                }

                // Store roles data for the next middleware
                $action->set("rolesData", $rolesData);

            } catch (\Exception $e) {
                throw new MiddlewareException("roleLevelFetchFailed", $e->getMessage());
            }
        };
    }
}
