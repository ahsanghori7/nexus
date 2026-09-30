<?php

namespace App\Api;

use App\core\Request;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;

class CompanyProfile extends Client
{

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "company_profile";

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "getCompanyProfile" => [
                "type" => 'GET',
                "requires_session" => true
            ],
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
     */
    public static function getCompanyProfile(Request $request, User $user): jsonResponse
    {
        $sid = (int)$request->getArg("subcontractor");
        try {
            $json = self::get("company_profile/$sid");
            return self::jsonResponse([
                "data" => $json,
            ], 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }
}
