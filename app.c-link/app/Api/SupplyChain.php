<?php


namespace App\Api;

use App\core\Config;
use App\core\Request;
use App\Api\Account;
use App\Factory\UserFactory;
use App\Models\Collection;
use App\Api\Client\Response\JsonResponse;
use App\Models\User;
use App\Models\Trade\Category;
use App\Models\Base;
use App\Api\Hubspot\V2 as Hubspot;

use App\Api\V2\SupplyChain as SupplyChainv2;
use App\Api\Api;

class SupplyChain extends Account
{
    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "account";

    /**
     * @var array
     */
    protected static $forward_address = [];

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
     * @param string $step
     * @param string $url
     */
    public static function setForwardingAddress($step, $url) {
        self::$forward_address[$step] = $url;
    }

    /**
     * @var array
     */
    protected static $security = [
        "methods" => [
            "getChain"  => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "getContractors"  => [
                "type" => 'GET',
                "requires_session" => true
            ],
            "removeSub"  => [
                "type" => "PATCH",
                "requires_session" => true
            ],
            "regions" => [
                "type" => "GET"
            ]
        ]
    ];

    /**
     * @return array|array[]
     */
    public static function getSecurity() {
        return self::$security;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function getChain(Request $request, User $user) : jsonResponse
    {
        //moved to supply chain v2
        return SupplyChainv2::getChain($request, $user);
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     */
    public static function getContractors(Request $request, User $user) : jsonResponse
    {
        $aid = $user->getAccountId();
        $contractors = [];
        $filterPackages = [];

        $pid  = (int) $request->getQueryValue("pid");
        $tid  = (int) $request->getQueryValue("tid");

        if($pid && $tid) {
          try{
            $tender = Project::getTender($pid, $tid);
          }catch (\Exception $e){
            return self::jsonResponse(["error" => $e->getMessage()]);
          }
          if ( isset($tender['packages']) && is_array($tender['packages']) ){
            foreach ($tender['packages'] as $packages) {
              $filterPackages[$packages['package_id']] = $packages['package_id'];
            }
          }
        }

        try {
            //moved to supply chain v2
            $chain = SupplyChainv2::getChain($request, $user);
            foreach($chain->getData() as $category) {
                foreach($category as $item) {
                    if(is_array($item) && isset($item["chain"])) {
                        foreach($item["chain"] as $sub) {
                            if($filterPackages && !array_intersect($filterPackages, $sub['trades'])) {
                                continue;
                            }
                            $contractors[$sub["id"]] = $sub;
                        }
                    }
                }
            }
            return self::jsonResponse($contractors);
        }
        catch(\Exception $e) {
           return self::jsonResponse(["error" => $e->getMessage()]);
        }
    }


    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws Exception
     */
    public static function removeSub(Request $request, User $user) : jsonResponse
    {
        $aid  = $user->getAccountId();
        $data = $request->getJson();

        if($data && isset($data["sub"])) {
            $sub = (int) $data["sub"];
            $response = self::delete("account/$aid/supply_chain/" . $sub, $data);
            $state = [
                "status" => $response->hasStatus(203)
            ];
            $type_id = Account::getAccount($sub)['type_id'];
            return self::jsonResponse($state);
        }

        return self::throwJsonException("no data provided");
    }

    /**
     * @return Collection
     * @throws Exception
     */
    public static function getTradeCategories() : Collection {
        $categories = self::get("trade_category");
        return New Collection(array_map(function($id, $values) {
            return array_merge(["id" => (string) $id], $values);
        }, array_keys($categories), $categories), Category::class);
    }

    /**
     * @return Collection
     * @throws Exception
     */
    public static function getRegions() : Collection {
        return New Collection(self::get("region"), Base::class);
    }

    /**
     * @param int $aid
     * @param int $sid
     * @param array $keys
     * @param array $data
     * @return array
     */
    public static function mapInfo(int $aid, int $sid, array $keys, array $data, $add=false) {
        $state = [];
        foreach($keys as $key) {
            $plural = $key . "s";
            $info = $data[$plural] ?? false;
            $uri = "account/$aid/supply_chain/$sid/$key";
            if($add===true) {
                $uri .= "?add_only=1";
            }

            if($info !== false) {
                $res = self::patch($uri, [$plural => $info]);
                if($res->hasStatus(203)) {
                    $state[$plural . "_mapped"] = true;
                }
            }
        }

        return $state;
    }

    /**
     * @param Request $request
     * @param User $user
     * @return JsonResponse
     * @throws Exception
     */
    public static function regions(Request $request, User $user) : JsonResponse {
        //THIS WILL BE A REQUEST MADE BY THE FRONTEND DIRECTLY TO THE API SERVICE
        return self::jsonResponse([]);
        $token = app()->Cookie->getCookie('token');
        $region  = Api::get("attributes/category/region_category/attributes", [], ['Authorization' => "Bearer $token"]);
        return self::jsonResponse($region ?? []);
    }
}
