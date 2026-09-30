<?php

namespace Prosper\Middleware;

use Core\Data\Shape;
use Core\Middleware\Generic;
use Core\Middleware\Session as CoreSession;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class Session extends CoreSession
{

    /**
     * @return Callable
     * Allow specialist account types
     * Allow external account types if their membership is activated_supply_chain
     */
    public static function login() : Callable {
        return function ($shape) {
            parent::login()($shape);
            $user    = $shape->get("user");
            $account = Manager::getService("account")->fetch("account/" . $user->get("account_id"))->get("data");
            $shape->set("user", $user->set("account", $account));
            $allowed_account_types = ['specialist'];
            if(!Generic::isAccountType($shape, $allowed_account_types)) {
                $allowed_external_membership_types = ['activated_supply_chain'];
                if(!Generic::isAccountMembershipType($shape, $allowed_external_membership_types)) {
                    throw new MiddlewareException("authError", "Login attempt from non " . implode(", ", $allowed_account_types));
                }
            }
        };
    }

    /**
     * @param string $resultKey
     * @return Callable
     */
    public static function count(string $resultKey = 'session_count') : Callable {
        return function ($shape) use ($resultKey) {
            $res = Manager::getService("account")->fetch("user/session_usage/" . $shape->get("token"));
            $shape->set($resultKey, $res->getShape("data")->get("total"));
        };
    }

    /**
     * @return Callable
     */
    public static function incrementUsage() : Callable {
        return function ($shape){
            Manager::getService("account")->update("user/session_usage/" . $shape->get("token"), new Shape([]));
        };
    }
}
