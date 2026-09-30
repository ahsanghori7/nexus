<?php

namespace Core\Middleware\Service;

use Core\Middleware\ServiceMiddleware;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class UserMiddleware extends ServiceMiddleware
{
    const SERVICE = 'account';

    /**
     * @param string $emailKey
     * @param string $saveKey
     * @return callable
     */
    public static function loadByEmail(string $emailKey, string $saveKey = "user"): callable
    {
        return function ($action) use ($emailKey, $saveKey) {
            $email = $action->get($emailKey);
            if (!$email) {
                throw new MiddlewareException("invalid_request", "Email key ($emailKey) is falsy and or missing from shape");
            }
            $account_exist = Manager::getService('account')->fetch("user", ['email' => $email])->getCollection('data');
            if ($account_exist->count()) {
                $action->set($saveKey, $account_exist->getFirst());
            }
        };
    }

    /**
     * @return callable
     */
    public static function loadTypes(string $saveKey = "user_types"): callable {
        return function ($action) use ($saveKey) {
            $types = Manager::getService('account')->fetch("user/type")->getCollection('data');
            if ($types->count()) {
                $action->set($saveKey, $types);
            }
        };
    }

    /**
     * @param string $k
     * @param int $chunk
     * @param string $key
     * @return callable
     */
    public static function loadUsersByAccountIdArray(string $k, int $chunk = 50, string $key = 'users'): callable
    {
        return function ($action) use ($k, $chunk, $key) {
            $ids      = $action->getArray($k);
            $users = [];
            foreach (array_chunk($ids, $chunk) as $group) {
                $ids = "[" . implode(",", $group) . "]";
                $data = Manager::getService('account')->fetch("user/account/$ids")->getCollection('data');
                foreach ($data as $item) {
                    $users[] = $item->toArray();
                }
            }

            $action->set($key, $users);
        };
    }

    /**
     * @param string $k
     * @param int $chunk
     * @param string $key
     * @return callable
     */
    public static function loadUsersByIdArray(string $k, int $chunk = 50, string $key = 'users'): callable
    {
        return function ($action) use ($k, $chunk, $key) {
            $ids      = $action->getArray($k);
            $users = [];
            if ($ids) {
                foreach (array_chunk($ids, $chunk) as $group) {
                    $ids = "[" . implode(",", $group) . "]";
                    $data = Manager::getService('account')->fetch("user/$ids")->getCollection('data');
                    foreach ($data as $item) {
                        $users = array_merge($users, $item->toArray());
                    }
                }
            }
            $action->set($key, $users);
        };
    }

    /**
     * @param string $userIdKey
     * @param string $responseKey
     * @return callable
     */
    public static function loadUserAccountRoles(string $userIdKey, string $responseKey = 'user_roles'): callable
    {
        return function ($action) use ($userIdKey, $responseKey) {
            $userId = $action->get($userIdKey);
            $data = Manager::getService('account')->fetch("user/$userId/account-roles")->getCollection('data')->first();

            $action->set($responseKey, $data);
        };
    }
}
