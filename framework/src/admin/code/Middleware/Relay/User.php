<?php

namespace Admin\Middleware\Relay;

use Admin\Middleware\Relay;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Exception\RestException;

class User
{
    /**
     * @return Callable
     */
    public static function flatten(): callable
    {
        return Relay::flattenData(function (array $account): array {
            $data = [];
            foreach ($account["users"] as $user) {
                $data[] = [
                    "id"              => (int) $user["id"],
                    "account_id"      => (int) $user["account_id"],
                    "company"         => $account["name"],
                    "name"            => $user["display_name"],
                    "subscription_id" => (int) $account["subscription_id"],
                    "subscription" => $account["subscription"],
                    "frequency" => $account["subscription_type"],
                    "created_at"      => $account["created_at"]
                ];
            }
            return $data;
        });
    }
}
