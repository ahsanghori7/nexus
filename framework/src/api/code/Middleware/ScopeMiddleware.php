<?php

namespace Api\Middleware;

use Core\Middleware\Exception as MiddlewareException;
use Core\Router\Route\Action;

class ScopeMiddleware
{
    /**
     * @param string $scope
     * @return callable
     */
    public static function requireScope(string $scope): callable
    {
        return function (Action $action) use ($scope) {
            $granted = (string) $action->get("partner.scopes", "");
            $scopes = array_values(array_filter(explode(" ", $granted)));

            if (!in_array($scope, $scopes, true)) {
                throw new MiddlewareException("insufficient_scope", "");
            }
        };
    }
}
