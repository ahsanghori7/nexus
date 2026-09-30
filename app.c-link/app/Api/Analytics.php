<?php


namespace App\Api;

use App\core\Request;
use App\Models\User;

/**
 * Class Analytics
 * @package App\Api
 */
class Analytics extends Client
{

    /**
     * @var array
     */
    protected static $forward_address = [];

    /**
     * @var array
     */
    protected static array $typeCache = [];

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "track" => [
                "type" => "POST",
                "requires_session" => true
            ]
        ]
    ];

    /**
     * @param string $k
     * @return false|string
     */
    public static function getForwardingAddress(string $k)
    {
        if (isset(self::$forward_address[$k])) {
            return baseUrl() . self::$forward_address[$k];
        }
        return false;
    }

    /**
     * @return array|\array[][]
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url)
    {
        self::$forward_address[$step] = $url;
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     */
    public static function track(Request $request, User $user, $args): void
    {
        $data = $request->getJson();
        self::post("analytics/tracking", [
            'account_id'              => $user->getAccountId(),
            'account_user_id'         => $user->getId(),
            'related_account_id'      => $data['account_id'] ?? $user->getAccountId(),
            'related_account_user_id' => $data['user_id'] ?? null,
            'type'                    => $data['type'],
        ]);
    }

}
