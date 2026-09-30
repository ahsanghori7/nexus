<?php

namespace App\Api;

use App\Api\Client;
use App\core\Request;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;

class Trade extends Client
{

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "trade";

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "fetchAll" => [
                "type" => 'GET',
                "requires_session" => true
            ]
        ]
    ];

    /**
     * @return array|array[]
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws \App\Api\Exception
     */
    public static function fetchAll(Request $request, User $user): jsonResponse
    {
        //THIS IS MOVED TO THE API SERVICE
        return self::jsonResponse([]);
    }
}
