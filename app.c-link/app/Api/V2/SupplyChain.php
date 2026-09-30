<?php

namespace App\Api\V2;

use App\Api\Account;
use App\Api\Analytics;
use App\Api\Client;
use App\core\Request;
use App\Models\User;
use App\Api\Client\Response\JsonResponse;

class SupplyChain extends Client
{

    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "supply_chain";

    const REGION_MAPPING_TYPE_ID = 2;
    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "fetchAll" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "create" => [
                "type" => 'POST',
                "requires_session" => true
            ],
            "update" => [
                "type" => 'PATCH',
                "requires_session" => true
            ],
            "remove" => [
                "type" => 'DELETE',
                "requires_session" => true
            ],
            "getChain" => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "send_reminder" => [
                "type" => 'PATCH',
                "requires_session" => true
            ],
            "send_pqq_reminder" => [
                "type" => 'PATCH',
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
     * @throws \App\Api\Exception
     */
    public static function fetchAll(Request $request, User $user): jsonResponse
    {
        //THIS IS MOVED TO THE API SERVICE
        return self::jsonResponse([]);
        $args = [];
        $term = $request->getArg("term");
        if ($term) {
            $args["term"] = $term;
        }
        $limit = $request->getArg("limit");
        if ($limit) {
            $args["limit"] = $limit;
        }
        $offset = $request->getArg("offset");
        if ($offset) {
            $args["offset"] = $offset;
        }
        $order = $request->getArg("order");
        if ($order) {
            $args["order"] = $order;
        }
        $desc = $request->getArg("desc");
        if ($desc) {
            $args["desc"] = $desc;
        }

        $aid = $user->getAccountId();
        $response = self::fetchSupplyChain($aid, $args);
        if (isset($response['error'])) {
            return self::jsonResponse($response, 500);
        }
        return self::jsonResponse($response, 200);
    }


    /**
     * @param int $aid
     * @param array $args
     * @return array
     * @throws \App\Api\Exception
     */
    public static function fetchSupplyChain(int $aid = 0, array $args = [])
    {
        //THIS IS MOVED TO THE API SERVICE
        return self::jsonResponse([]);
        try {
            $json = self::get("supply_chain/$aid", $args);

            $collection = $json['collection'];
            $total = $json['total'];

            return [
                "aid"  => $aid,
                "data" => $collection,
                "info" => [
                    "total" => $total
                ]
            ];
        } catch (\Exception $e) {
            return ["error" => $e->getMessage()];
        }
    }

    /**
     * @param $request
     * @param $user
     * @return JsonResponse
     */
    public static function getChain($request, $user)
    {
        //THIS IS MOVED TO THE API SERVICE
        return self::jsonResponse([]);
        $aid = $user->getAccountId();
        try {
            $json = self::get("supply_chain/$aid/get_chain");
            return self::jsonResponse(array_shift($json), 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    public static function getData($request, $user)
    {
        //THIS IS MOVED TO THE API SERVICE
        return self::jsonResponse([]);
        $json = $request->getRequiredJson();
        $data = isset($json["data"]) ? $json["data"] : [];
        return count((array)$data) ? [
            'name' => $data['company_name'],
            'email' => $data['email'],
            'reg_number' => $data['reg_number'],
            'address' => $data['address'],
            'phone' => $data['phone'],
            'trades' => $data['trades'],
            'regions' => $data['locations'],
            'contractor' => [
                'company' => $user->getAccountData('name'),
                'name' => $user->getFullName(),
                'id' => $user->getAccountId()
            ],
            'users' => [
                'firstname' => $data['contact_name'],
                'lastname' => '', //we don't ask for lastname in the add subcontractor form from front end
                'email' => $data['email'],
            ],
            "region_type_id" => self::REGION_MAPPING_TYPE_ID,
            "account_type_id" => Account::EXTERNAL_ACCOUNT_TYPE,
            "user_type_id" => Account::ACCOUNT_HOLDER_TYPE_ID
        ] : false;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws \Exception
     */
    public static function create(Request $request, User $user): jsonResponse
    {
        //THIS IS MOVED TO THE API SERVICE
        return self::jsonResponse([]);
        $body = self::getData($request, $user);
        if ($body) {
            $aid = $user->getAccountId();
            $response = self::post("supply_chain/$aid", $body);
            try {
                $json = $response->json();
                $id   = (int)$json['data']["id"];
                $subscription   = (int)$json['data']["subscription_id"];
                return self::jsonResponse([
                    "data" => ["id" => $id, "subscription_id" => $subscription],
                ], 200);
            } catch (\Exception $e) {
                return self::jsonResponse(["error" => $e->getMessage()], 500);
            }
        }
        return self::jsonResponse(["error" => "Bad data"], 500);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function update(Request $request, User $user): jsonResponse
    {
        //THIS IS MOVED TO THE API SERVICE
        return self::jsonResponse([]);
        $body = self::getData($request, $user);
        $id = (int) $request->getQueryValue("id");
        $aid = $user->getAccountId();
        $response = self::patch("supply_chain/$aid/$id", $body);
        try {
            $json = $response->json();
            return self::jsonResponse([
                "data" => ["status" => $json['data']["status"]],
            ], 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function send_reminder(Request $request, User $user): jsonResponse
    {

        $response = self::patch(
            sprintf("supply_chain/%s/activation_reminder/%s", $user->getAccountId(), (int) $request->getQueryValue("id")),
            ["user_id" => $user->getId()]
        );
        try {
            $json = $response->json();
            return self::jsonResponse([
                "data" => ["status" => $json['data']["status"] ?? false],
            ], 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws \App\Api\Exception
     */
    public static function remove(Request $request, User $user): jsonResponse
    {
        //THIS IS MOVED TO THE API SERVICE
        return self::jsonResponse([]);
        $id = (int) $request->getQueryValue("id");
        $aid = $user->getAccountId();
        $response = self::delete("supply_chain/$aid/$id");
        try {
            $json = $response->json();
            return self::jsonResponse([
                "data" => ["status" => $json['data']["status"]],
            ], 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function send_pqq_reminder(Request $request, User $user): jsonResponse
    {
        //THIS IS MOVED TO THE API SERVICE
        return self::jsonResponse([]);
        $response = self::patch(sprintf("supply_chain/%s/pqq_reminder/%s", $user->getAccountId(), (int) $request->getQueryValue("id")), [
            'user_id' => $user->getId(),
        ]);
        try {
            $json = $response->json();
            return self::jsonResponse([
                "data" => ["status" => $json['data']["status"] ?? false],
            ], 200);
        } catch (\Exception $e) {
            return self::jsonResponse(["error" => $e->getMessage()], 500);
        }
    }
}
