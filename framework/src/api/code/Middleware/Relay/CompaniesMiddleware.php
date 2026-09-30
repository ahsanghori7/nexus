<?php

namespace Api\Middleware\Relay;

use Core\Middleware\ServiceMiddleware;
use Core\Service\Manager;



class CompaniesMiddleware extends ServiceMiddleware
{

    public const SERVICE = 'account';

    /**
     * Key for Consistent Shape Access
     */
    public const BOQ_KEY  = "companies";

    /**
     * @param int $regionId
     * @param string $saveKey
     * @param bool $alwaysStrict
     * @return callable
     */
    public static function loadByRegion(int $regionId, string $saveKey = "accounts", bool $alwaysStrict = false): callable
    {
        return function ($action) use ($regionId, $saveKey, $alwaysStrict) {
            $prosperAccounts = [3, 4];
            $args = $action->getRoute()->getRequest()->getArgs();
            $filters = $args->toArray();
            $accounts = Manager::getService('account')
                ->fetch("account/region/$regionId", array_merge($filters, [
                    'type_id' => implode(",", $prosperAccounts),
                    'strict' => $alwaysStrict || array_key_exists("reg_number", $filters) ? "true" : "false"
                ]))->getCollection('data');
            if ($accounts->count()) {
                $action->set($saveKey, $accounts);
            }
        };
    }

    /**
     * @param string $key
     * @param string $spKey
     * @return callable
     */
    public static function checkSupplyChain(string $key = "accounts", string $spKey = "supply_chain_list"): callable
    {
        return function ($action) use ($key, $spKey) {

            $spList = $action->get($spKey);
            $collection = $action->get($key);
            if ($collection && $collection->count()) {
                $collection->update(function ($item) use ($spList) {
                    $item["in_supply_chain"] = in_array(intval($item["id"]), $spList);
                    return $item;
                });
            }
        };
    }
}
