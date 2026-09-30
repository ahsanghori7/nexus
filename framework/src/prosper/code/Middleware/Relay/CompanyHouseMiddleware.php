<?php
namespace Prosper\Middleware\Relay;

use Core\Middleware\Rest;
use Core\Middleware\ServiceMiddleware;

class CompanyHouseMiddleware extends ServiceMiddleware
{

    const SERVICE = 'company_house' ;
    const EXTERNAL_ACCOUNT_ID = 4 ;

    /**
     * @param string $nameKey
     * @param string $saveKey
     * @return \Closure
     */
    public static function searchByName(string $nameKey, string $saveKey = 'data')
    {
        return function ($action) use ($nameKey, $saveKey) {
            $res = self::getService()->fetch("/search/companies", ["q" => urldecode($action->get($nameKey))]);
            $action->set($saveKey, $res->get("data"));
        };
    }

    /**
     * @param string $resultKey
     * @return \Closure
     */
    public static function parseResults(string $resultKey)
    {
        return function ($action) use ($resultKey) {
            $result = $action->get($resultKey);
            $companies = array_map(function ($company) use ($action) {
                $has_title = $company['matches']['title'] ?? $company['title'] ?? null;
                $accountMatch = false;
                if($has_title) {
                    $account = $action->get("accounts")->filterByStringField('name', strtolower($company['title']));
                    if($account->count()){
                        if((int)$account->getFirst()->get("type_id") !== self::EXTERNAL_ACCOUNT_ID){
                            $accountMatch = true;
                        }
                    }
                    return [
                        'name' => $company['title'],
                        'number' => $company['company_number'],
                        'account_match' => $accountMatch,
                        'address' => $company['address'] ?? [],
                    ];
                }
            }, $result->toArray());
            $action->set("companies", array_values(array_filter($companies)));
        };
    }
}
