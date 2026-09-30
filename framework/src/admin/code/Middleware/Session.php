<?php

namespace Admin\Middleware;

use Core\Middleware\Generic;
use Core\Middleware\Session as CoreSession;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class Session extends CoreSession
{

    const ADMIN_ACCOUNT_TYPE_ID = 1;

    /**
     * @return Callable
     */
    public static function login() : Callable {
        return function ($shape) {
            parent::login()($shape);
            $user    = $shape->get("user");
            $account = Manager::getService("account")->fetch("account/" . $user->get("account_id"))->get("data");
            $shape->set("user", $user->set("account", $account));
            $allowed_account_types = ['administrator'];
            if(!Generic::isAccountType($shape, $allowed_account_types)) {
                throw new MiddlewareException("authError", "Login attempt from non " . implode(", ", $allowed_account_types));
            }
        };
    }

    /**
     * Check that the logged in user is an admin
     */
    public static function post_validate_hook($shape) {
        $type_id = $shape->int("session.account.type_id");
        if($type_id !== self::ADMIN_ACCOUNT_TYPE_ID) {
            throw new MiddlewareException("noSession", "Login session from non admin");
        }
    }
}
