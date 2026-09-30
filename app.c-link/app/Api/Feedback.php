<?php


namespace App\Api;

use App\Api\Client\Response\JsonResponse;
use App\Models\User;
use App\core\Request;

class Feedback extends Client
{
    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "feedback";

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "getTypes" => [
                "type" => "GET",
                "requires_session" => true
            ],
            "create" => [
                "type" => "POST",
                "requires_session" => true,
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
     * @throws Exception
     */
    public static function getTypes(Request $request, User $user) : jsonResponse
    {
        try {
            $types = self::get("feedback/type");
            return self::jsonResponse($types);
        }
        catch(\Exception $e) {
            return self::jsonResponse(["error" => "Api Failure"]);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @param array $args
     * @return JsonResponse
     */
    public static function fetchAll(Request $request, User $user, array $args): jsonResponse
    {
        try {
            $feedbacks = self::get("feedback");
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()]);
        }

        return self::jsonResponse($feedbacks);
    }

    /**
     * @param Request $request
     * @param User $user
     * @param $args
     * @return JsonResponse
     */
    public static function create(Request $request, User $user, $args): JsonResponse
    {
        $data = $request->getRequiredJson();
        $uid = $user->getId();
        $aid = $user->getAccountId();
        $sentiment = $data["sentiment"];
        $type = $data["feedback_type"];

        $res = self::post("feedback", [
            "user_id" => $uid,
            "account_id" => $aid,
            "sentiment" => $sentiment,
            "feedback_type" => $type
        ]);
        $json = $res->json();
        $id = $json["data"]['id'] ?? null;
        return self::jsonResponse(["success" => !is_null($id), 'id' => $id]);
    }
}
