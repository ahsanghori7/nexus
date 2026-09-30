<?php

namespace CompanyProfile\Middleware;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Data\Collection as CollectionClass;

class CompanyProfileMiddleware
{

    public const REGION_TYPE_ID = 3;
    public const MEMBERSHIP_REGIONAL_ID = 12;

    /**
     * @param string $aidKey
     * @return callable
     */
    public static function loadCollection(string $aidKey = 'uriArgs.aid'): callable
    {
        return function ($action) use ($aidKey) {
            $aid = (int)$action->get($aidKey);
            try {
                $data = Manager::getService('account')->fetch("prequalification/$aid")->getCollection('data');
            } catch (\Exception $e) {
                $data = [];
            }

            $user = Manager::getService('account')->fetch("user", ['account_id' => $aid])->getShape('data');
            $users = $user->get();
            if (is_array($users)) {
                $user_data = array_shift($users);
            }

            $action->setItems([
                "collection" => $data,
                "aid"        => $aid,
                'user'       => new Shape($user_data ?? [])
            ]);
        };
    }

    /**
     * @param array<string> $offerings
     * @return callable
     */
    public static function updateOfferingsLabel(array $offerings = []): callable
    {
        return function ($action) use ($offerings) {

            if ($offerings) {
                foreach ($offerings as $offering) {
                    $items = [];
                    $ids = $action->get("company_information")[$offering] ?? [];
                    if ($ids) {
                        array_map(function ($item) use ($action, &$items, $offering) {
                            if ($action->get($offering)) {
                                $find = $action->get($offering)->filterByField("id", (int)$item, cast: 'int');
                                if ($find->count()) {
                                    $items[] = [
                                        'id'    => (int)$item,
                                        'label' => $find->getFirst()->get("label")
                                    ];
                                }
                            }
                        }, $ids);
                        $action->set("company_information", [$offering => $items], true);
                    }
                }
            }
        };
    }

    /**
     * @return callable
     */
    public static function loadCompanyRegions(): callable
    {
        return function ($action) {
            $aid = $action->get("aid");
            $regions = Manager::getService('account')->fetch("account/$aid/region", ['type_id' => self::REGION_TYPE_ID])->getCollection('data');
            $action->set("company_information", ['regions' => $regions->values('region_id')], true);
        };
    }

    /**
     * @return callable
     */
    public static function loadCompanyTrades(): callable
    {
        return function ($action) {
            $aid = $action->get("aid");
            $trades = Manager::getService('account')->fetch("account/$aid/trades")->getCollection('data');
            $action->set("company_information", ['trades' => $trades->values('trade_id')], true);
        };
    }

    /**
     * @return callable
     */
    public static function loadCompanyTypes(): callable
    {
        return function ($action) {
            $aid = $action->get("aid");
            $types = Manager::getService('account')->fetch("account/$aid/projecttypes")->getCollection('data');
            $action->set("company_information", ['types' => $types->values('type_id')], true);
        };
    }

    /**
     * @return callable
     */
    public static function loadRegions(): callable
    {
        return function ($action) {
            $data = Manager::getService('account')->fetch("region")->getCollection('data');
            $action->set("regions", $data);
        };
    }

    /**
     * @param string $regionCollectionKey
     * @return callable
     */
    public static function filterRegionsByAccountRegionId(string $regionCollectionKey = 'regions'): callable
    {
        return function ($action) use ($regionCollectionKey){
            if($action->get("account")) {
                $region_id = $action->get("account")->int("region_group_id");
                $regions = $action->get($regionCollectionKey)->filterByField("region_group_id", $region_id, cast: "int");
                if ( $regions->count() ) {
                    $action->set("regions", (new CollectionClass($regions->getItemsAsArray(), Shape::class)));
                }
            }
        };
    }


    /**
     * @return callable
     */
    public static function loadConstants(): callable
    {
        return function ($action) {
            $data = Manager::getService('project')->fetch('project/constants')->getCollection('data');
            $action->set("constants", $data);
        };
    }

    /**
     * @return callable
     */
    public static function loadTrades(): callable
    {
        return function ($action) {
            $data = Manager::getService('account')->fetch('trade')->getCollection('data');
            $action->set("trades", $data);
        };
    }

    /**
     * @param boolean $withCollection
     * @return callable
     */
    public static function loadTypes($withCollection = true): callable
    {
        return function ($action) use ($withCollection) {
            $data = $action->get("constants")->getItems()['project']->get("type");

            $types = [];
            foreach ($data as $key => $value) {
                $types[] = [
                    'id'    => $key,
                    'label' => $value
                ];
            }

            if ($withCollection) {
                $action->set("types", new CollectionClass($types, $action->getCollection("collection")->getObjectClass()));
            } else {
                $action->set("types", $types);
            }
        };
    }

    /**
     * @return callable
     * Check for unique name as the company cannot change the name to an existing company
     */
    public static function checkUniqueCompanyName(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $sid = (int)$action->get("aid");
            $json = $data->getShape("json");
            $name = $json->get("name");
            if ($name) {
                $account_exist = Manager::getService('account')->fetch("account", ['name' => $name])->getCollection('data');
                if ($account_exist->count()) {
                    $exist = $account_exist->filterByField("id", $sid, cast: "int");
                    if (!$exist->count()) {
                        throw new \Exception("Company Name is already used");
                    }
                }
            }
        };
    }

    /**
     * @return callable
     */
    public static function checkUniqueUserEmailAddress(): callable
    {
        return function ($action) {
            $json = $action->getRoute()->getRequest()->getData()->getShape("json");
            if ( $email = $json->get("email")) {
                $user_exist = Manager::getService('account')->fetch("user", ['email' => $email])->getCollection('data');
                if ($user_exist->count()) {
                    $exist = $user_exist->filterByField("id", (int)$action->get("uid"), cast: "int");
                    if (!$exist->count()) {
                        throw new \Exception("Email address is already used");
                    }
                }
            }
        };
    }

    /**
     * @return callable
     */
    public static function restrictRegionsByRegionalAccount(): callable
    {
        return function ($action) {

            $sid = (int)$action->get("aid");
            $membership =  Manager::getService('account')->fetch("account/$sid/membership")->getShape("data");
            $meta = json_decode((strval($membership->get("meta", ''))), true);
            if ($membership->get()) {
                $regional = (self::MEMBERSHIP_REGIONAL_ID == $action->get("account_subscriptions")->filterByField('label', $membership->get("label"))->getFirst()->get("id"));

                /*
                 * If the account membership is regional we need to override the company regions with the ones from account meta
                 * that was choosen when the client created his account
                 */
                if ($regional) {
                    if (is_array($meta) && isset($meta['regions'])) {
                        $regions = $meta['regions'];
                    }
                    $action->set("company_information", ['regions' => $regions ?? []], true);
                }
            }
        };
    }

    /**
     * @return callable
     */
    public static function loadCompanyInformation(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");
            $account = Manager::getService('account')->fetch("account/" . $action->get("aid"))->getShape('data');
            if ($collection->count()) {
                $items = $collection->getItems();
                $meta = $items && isset($items['meta']) ? $items['meta'] : new Shape();
                $action->set("company_information", [
                    'name'                      => $account->get("name", ""),
                    'user_id'                   => $action->get("user.id", ""),
                    'firstname'                 => $action->get("user.firstname", ""),
                    'lastname'                  => $action->get("user.lastname", ""),
                    'email'                     => $account->get("email", ""),
                    'logo'                      => $account->get("logo", ""),
                    'reg_number'                => $account->get("reg_number", ""),
                    'registered_address'        => $account->get("address", ""),
                    'landline'                  => $account->get("landline", ""),
                    'mobile'                    => $account->get("mobile", ""),
                    'description'               => $account->get("description", ""),
                    'strapline'                 => $account->get("slogan", ""),
                    'status'                    => $account->get("status", ""),
                    'website'                   => $account->get("website", ""),
                    'num_current_employees'     => (int)$meta->get("num_current_employees", 0),
                    'num_current_contractors'   => (int)$meta->get("num_current_contractors", 0),
                    'trading_name'              => $meta->get("trading_name", ""),
                    'utr_number'                => $meta->get("utr_number", ""),
                    'vat_number'                => $meta->get("vat_number", ""),
                    'linkedin'                  => $meta->get("linkedin", ""),
                    'operating_company_address' => $meta->get("operating_company_address", ""),
                    'bank_name'                 => $meta->get("bank_name", ""),
                    'address'                   => $meta->get("address", ""),
                    'sort_code'                 => $meta->get("sort_code", ""),
                    'account_number'            => $meta->get("account_number", ""),
                    'collateral_warranties'     => $meta->get("collateral_warranties", ""),
                    'performance_guarantee_bonds' => $meta->get("performance_guarantee_bonds", ""),
                ]);
            }
        };
    }

    /**
     * @return callable
     */
    public static function updateUserInformation(): callable
    {
        return function ($action) {
            $json = $action->getRoute()->getRequest()->getData()->getShape("json");
            Manager::getService('account')->update("user/" . $action->get("uid") . "/profile", new Shape([
                'data' => [
                    "email"        => $json->get("email"),
                    "job_title"    => $json->get("job_description"),
                    "firstname"    => $json->get("firstname"),
                    "lastname"     => $json->get("lastname"),
                    "display_name" => $json->get("firstname") . " " . $json->get("lastname")
                ],
                'options' => [
                    CURLOPT_CUSTOMREQUEST => "PATCH"
                ]
            ]));
        };
    }

    /**
     * @return callable
     */
    public static function updateCompanyInformation(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $sid = (int)$action->get("aid");
            $json = $data->getShape("json");

            Manager::getService('account')->update("account/$sid", new Shape([
                'data' => [
                    "name"        => $json->get("name"),
                    "email"       => $json->get("email"),
                    "reg_number"  => $json->get("reg_number"),
                    "address"     => $json->get("registered_address"),
                    "landline"    => $json->get("landline"),
                    "mobile"      => $json->get("mobile"),
                    "description" => $json->get("description"),
                    "slogan"      => $json->get("strapline"),
                    "status"      => $json->get("status"),
                    "website"     => $json->get("website"),
                    "vat_number"  => $json->get("vat_number"),
                ]
            ]));

            Manager::getService('account')->update("prequalification/$sid/company_information", new Shape([
                'data' => $json->get()
            ]));
        };
    }

    /**
     * @return callable
     */
    public static function updateCompanyOfferingsTypes(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $action->set("new_project_types", $data->getShape("json")->get("types"));
            return self::updateCompanyOfferings(
                "projecttypes", "new_project_types",
            )($action);
        };
    }

    /**
     * @return callable
     */
    public static function updateCompanyOfferingsTrades(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $action->set("new_trades", $data->getShape("json")->get("trades"));
            return self::updateCompanyOfferings(
                "trades", "new_trades",
            )($action);
        };

    }

    /**
     * @return callable
     */
    public static function updateCompanyOfferingsRegions(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();
            $action->set("new_regions", $data->getShape("json")->get("regions"));
            return self::updateCompanyOfferings(
                "region", "new_regions",
            )($action);
        };
    }

    /**
     * @param string $type
     * @param string $key
     * @return callable
     */
    public static function updateCompanyOfferings(string $type, string $key) : callable {
        return function(Shape $action) use($type, $key) {
            $aid  = $action->int("aid");
            Manager::getService('account')->update("account/$aid/$type", new Shape([
                'data' => $action->getShape($key)->toArray()
            ]));
        };
    }
}
