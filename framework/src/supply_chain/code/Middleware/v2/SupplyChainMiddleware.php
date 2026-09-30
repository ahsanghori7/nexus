<?php

namespace SupplyChain\Middleware\v2;

use Core\Data\Collection;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use SupplyChain\EloquentService;
use SupplyChain\Middleware\RestMiddleware;

use SupplyChain\Model\v2\SupplyChain;


class SupplyChainMiddleware
{

    /**
     * @return EloquentService
     * @throws \Exception
     */
    public static function getEloquent(): EloquentService
    {
        $service = Manager::getService("eloquent");
        if ($service instanceof EloquentService) {
            return $service;
        }
        throw new \Exception("Invalid service class for Eloquence Service");
    }

    /**
     * @return callable
     */
    public static function validateData(): callable
    {
        return function ($action) {
            self::getEloquent()->getModel("supply_chain_v2")->validate(
                $action->get("body")
            );
        };
    }

    /**
     * @param string $idKey
     * @return callable
     */
    public static function loadAll(): callable
    {
        return function ($action) {
            $data = self::getEloquent()->getModel("supply_chain_v2")
                ->with(["subcontractor", "status", "history.type"])
                ->get()->toArray();
            $action->set("collection", new Collection($data, Shape::class));
        };
    }

    /**
     * @param string $idKey
     * @return callable
     */
    public static function loadTotal(string $idKey = "uriArgs.id"): callable
    {
        return function ($action) use ($idKey) {
            $action->set("parent_id", intval($action->get($idKey)));
            $data = self::getEloquent()->getModel("supply_chain_v2")
                ->where(["parent_id" => $action->get("parent_id")])
                ->count();
            $action->set("total", $data);
        };
    }

    /**
     * @param string $idKey
     * @return callable
     */
    public static function loadCollection(string $idKey = "uriArgs.id"): callable
    {
        return function ($action) use ($idKey) {
            $action->set("parent_id", intval($action->get($idKey)));
            $data = self::getEloquent()->getModel("supply_chain_v2")
                ->with(["subcontractor", "status", "history.type"])
                ->where(["parent_id" => $action->get("parent_id")])
                ->get()->toArray();
            $action->set("collection", new Collection($data, Shape::class));
        };
    }

    /**
     * @param string $idKey
     * @return callable
     */
    public static function loadStatusTypes(): callable
    {
        return function ($action) {
            $statusTypes = self::getEloquent()->getModel("supply_chain_status_type")
                ->get()->toArray();
            $action->set("status_types", new Collection($statusTypes, Shape::class));
        };
    }

    /**
     * @param string $resultKey
     * @return callable
     */
    public static function loadMappingEntities(string $resultKey = 'entities'): callable
    {
        return function ($action) use ($resultKey) {
            $data = self::getEloquent()->getModel("mapping_type_v2")
                ->with("entities")
                ->get()->toArray();
            $action->set($resultKey, new Collection($data, Shape::class));
        };
    }

    /**
     * @param string $type
     * @param string $resultKey
     * @return callable
     */
    public static function loadMappingEntitiesByType(string $type, string $resultKey = ''): callable
    {
        return function ($action) use ($type, $resultKey) {

            $data = self::getEloquent()->getModel("mapping_type_v2")
                ->with("entities")
                ->where("label", $type)
                ->first()->toArray();
            if (!$resultKey) {
                $resultKey = $type;
            }
            $action->set($resultKey, $data['entities'] ?? []);
        };
    }

    /**
     * @param string $resultKey
     * @return callable
     */
    public static function loadMappingTypes(string $resultKey = 'types'): callable
    {
        return function ($action) use ($resultKey) {
            $data = self::getEloquent()->getModel("mapping_type_v2")
                ->get()->toArray();
            $action->set($resultKey, new Collection($data, Shape::class));
        };
    }

    /**
     * @param string $resultKey
     * @param string $idKey
     * @return callable
     */
    public static function loadMapping(string $resultKey = 'mapping', string $idKey = "uriArgs.id"): callable
    {
        return function ($action) use ($resultKey, $idKey) {

            $data = self::getEloquent()->getModel("mapping_v2")
                ->with("entity")
                ->where("account_id", $action->get($idKey))
                ->get();
            $group_results = $data->groupBy('account_id', 'group_id');
            $results = $group_results->map(function ($group) {
                return $group->groupBy(['group_id', 'attribute_type_id']);
            })->toArray();

            $action->set($resultKey, $results);
        };
    }

    /**
     * @param string $resultKey
     * @param string $idKey
     * @return callable
     */
    public static function groupMappingByTender(string $resultKey = 'mapping', string $idKey = "uriArgs.id"): callable
    {
        return function ($action) use ($resultKey, $idKey) {

            $data = self::getEloquent()->getModel("mapping_v2")
                ->with("entity")
                ->where("account_id", $action->get($idKey))
                ->get();
            $group_results = $data->groupBy('account_id', 'group_id');
            $results = $group_results->map(function ($group) {
                return $group->groupBy(['attribute_type_id', 'group_id']);
            })->toArray();

            $action->set($resultKey, $results);
        };
    }


    /**
     * @param string $parentKey
     * @return callable
     */
    public static function mapChainToCollection(string $parentKey = 'uriArgs.id'): callable
    {
        return function ($action) use ($parentKey) {

            $collection    = $action->getCollection("collection");
            $mapping       = $action->get("mapping");
            $mapping_types = $action->get("types");

            $accounts = [];
            $collection->map(function ($item) use (&$accounts) {
                $accounts[$item->get("child_id")] = $item;
            });
            $parent_id = $action->get($parentKey);
            $results  = [];
            $entities = [];
            if ($mapping) {
                $mapping = array_shift($mapping);
                foreach ($mapping as $entity_id => $subcontractors) {
                    $label = null;
                    foreach ($subcontractors as $sid => &$account) {
                        $account = array_shift($account);
                        SupplyChain::mapEntitiesTypeByAccount($mapping_types, $entity_id, $account, $entities);
                        if (isset($accounts[$sid])) {
                            $label = $account['entity']['label'];
                            $account = $accounts[$sid]->get("subcontractor") + [
                                'users' => $accounts[$sid]->get("users"),
                                'parent_id' => $parent_id,
                            ];
                        }
                    }
                    unset($account);

                    $category_parent = $action->get("trades")->filterByStringField("label", $label);
                    if ($category_parent->count()) {
                        SupplyChain::mapChainEntitiesSubcontractors($results, $category_parent, $subcontractors, $entity_id, $label);
                    }
                }
            }

            SupplyChain::mapChainEntitiesToCollection($entities, $results);

            $action->set("collection", (new Collection(['data' => $results], Shape::class, $results)));
        };
    }

    /**
     * @return callable
     */
    public static function mapEntitiesToCollection(): callable
    {
        return function ($action) {

            $collection = $action->getCollection("collection");
            $mapping = $action->get("mapping");
            $mapping_types = $action->get("types");

            if ($collection->count()) {
                $action->getCollection("collection")->update(function ($i) use ($mapping, $mapping_types) {
                    if (!is_a($i, Shape::class)) {
                        $i = new Shape($i);
                    }
                    if (isset($mapping[$i->get("parent_id")][$i->get("child_id")])) {
                        $entities = new Collection($mapping[$i->get("parent_id")][$i->get("child_id")], Shape::class);
                        $items = [];
                        $entities->map(function ($entity) use (&$items, $mapping_types) {
                            $entityData = $entity->get();
                            $entity = array_shift($entityData);

                            foreach ($mapping_types->getItemsAsArray() as $type) {
                                if (intval($entity['entity']['mapping_type']) === intval($type['id'])) {
                                    $items[$type['label']][] = [
                                        'id'    => $entity['entity']['id'],
                                        'label' => $entity['entity']['label'],
                                    ];
                                    return $entity;
                                }
                            }
                        });
                    }
                    foreach ($mapping_types->getItemsAsArray() as $type) {
                        $i->set($type['label'], $items[$type['label']] ?? []);
                    }
                    return $i;
                });
            }
        };
    }

    /**
     * @return callable
     */
    public static function loadUsers(): callable
    {
        return function ($action) {
            $subIds = $action->get("collection")->values("child_id", true);
            if ($subIds) {
                $users = self::getEloquent()
                    ->getModel("user")
                    ->whereIn('account_id', $subIds)
                    ->get()
                    ->toArray();
                $memberships = self::getEloquent()
                    ->getModel("membership")
                    ->whereIn('account_id', $subIds)
                    ->get()
                    ->toArray();
            }

            $action->set("users", $users ?? []);
            $action->set("memberships", $memberships ?? []);
        };
    }

    /**
     * @return callable
     */
    public static function loadUserByAccountId($idKey): callable
    {
        return function ($action) use ($idKey){
            $users = [];
            if ($idKey) {
                $users = self::getEloquent()
                    ->getModel("user")
                    ->where('account_id', $action->int($idKey))
                    ->get()
                    ->toArray();
            }
            $action->set("users", $users);
        };
    }

    /**
     * @return callable
     */
    public static function mapUsersToCollection(): callable
    {
        return function ($action) {

            $users = [];
            array_map(function ($user) use (&$users) {
                //get the first user per account
                if (!isset($users[$user['account_id']])) {
                    $users[$user['account_id']] = $user;
                }
            }, $action->getCollection("users")->getItemsAsArray());

            $accounts = [];
            array_map(function ($account) use (&$accounts) {
                $accounts[$account['account_id']] = $account['subscription_id'];
            }, $action->getCollection("memberships")->getItemsAsArray());

            $action->getCollection("collection")->update(function ($i) use ($users, $accounts) {
                if (!is_a($i, Shape::class)) {
                    $i = new Shape($i);
                }

                $aid    = $i->get("parent_id");
                $meta   = $i->json("contractor.meta");
                $mobile = $i->get("contractor.mobile");
                if ($meta) {
                    $user   = $meta[$aid]["user"]   ?? [];
                    $mobile = $meta[$aid]["mobile"] ?? "";
                } else {
                    $user = $users[$i->get("child_id")];
                }

                $i->set("users", [
                    'id'           => $user['id'] ?? null,
                    'account_id'   => $i->get("child_id"),
                    'email'        => $user['email'] ?? "",
                    'firstname'    => $user['firstname'] ?? "",
                    'lastname'     => $user['lastname'] ?? "",
                    'display_name' => $user['display_name'] ?? "",
                    'mobile'       => $mobile
                ]);

                $i->set("subscription_id", $accounts[$i->get("child_id")] ?? null);

                return $i;
            });
        };
    }
    /**
     * @param string $dataKey
     * @return callable
     */
    public static function filterDataByName(string $dataKey = 'subcontractor'): callable
    {
        return function ($action) use ($dataKey) {
            $args = $action->getRoute()->getRequest()->getArgs();
            $term = strtolower($args->get("term", ""));

            $collection = $action->getCollection("collection")->getItemsAsArray();

            //filter by subcontractor name
            $data = array_filter($collection, function ($sp) use ($term, $dataKey) {
                if ($term && isset($sp[$dataKey])) {
                    return strpos(strtolower($sp[$dataKey]["name"]), strtolower($term)) !== false;
                }
                return true;
            });

            //filter by trades
            $data += array_filter($collection, function ($sp) use ($term, $dataKey) {
                if ($term && isset($sp[$dataKey])) {
                    return array_filter($sp['trades'] ?? [], function ($i) use ($term) {
                        return strpos(strtolower($i["label"]), strtolower($term)) !== false;
                    });
                }
                return true;
            });

            $action->set("total", count($data));
            $action->set("collection", new Collection($data, Shape::class));
        };
    }

    /**
     * @param string $dataKey
     * @return callable
     */
    public static function orderData(string $dataKey = 'subcontractor'): callable
    {
        return function ($action) use ($dataKey) {
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                list($order, $desc) = RestMiddleware::getOrderQuery()($action);
                if ($order && $order === "company") {
                    $action->getCollection("collection")->sort(function ($a, $b) use ($desc, $dataKey) {
                        $nameA = strtolower($a[$dataKey]["name"]);
                        $nameB = strtolower($b[$dataKey]["name"]);
                        if ($nameA == $nameB) return 0;
                        $condition = $desc ?
                            $nameA > $nameB :
                            $nameA < $nameB;
                        return $condition ? 1 : -1;
                    });
                }
            }
        };
    }

    /**
     * @param int $defaultLimit
     * @param int $maxLimit
     * @return callable
     */
    public static function paginationData(int $defaultLimit = 20, int $maxLimit = 100): callable
    {
        return function ($action) use ($defaultLimit, $maxLimit) {
            $collection = $action->get("collection");
            if ($collection->count()) {
                list($limit, $offset) = RestMiddleware::getLimitOffset($defaultLimit, $maxLimit)($action);
                $items = $collection->getItemsAsArray();
                $nItems = count($items);
                $iterations = !$limit ? $nItems : min($limit, $nItems);
                $data = [];
                for ($i = 0; $i < $iterations; $i++) {
                    if (($i + $offset) < $nItems) {
                        $data[] = $limit ? $items[$i + $offset] : $items[$i];
                    }
                }
                $action->set("collection", new Collection($data, Shape::class));
            }
        };
    }

    /**
     * @param string $urlArg
     * @param string $key
     * @return callable
     */
    public static function loadAccount(string $urlArg = "id", string $key = "main_contractor"): callable
    {
        return function (Shape $a) use ($urlArg, $key) {

            $id = intval($a->get("uriArgs." . $urlArg));
            if ($id) {
                $contractor = self::getEloquent()->getModel("account_v2")->where("id", $id);
                if (!$contractor->exists()) {
                    throw new MiddlewareException("invalid_contractor", "Id for contractor is incorrect");
                }
                $a->set($key, $contractor->first());
                $a->set($key . "_id", $contractor->first()->id);
                return;
            }

            throw new MiddlewareException("invalid_contractor", "Id supplied for contractor missing or not int");
        };
    }

    /**
     * @return callable
     */
    public static function addUser(): callable
    {
        return function ($a) {
            $aid = $a->get("main_contractor")->id;
            $sid = $a->get("subcontractor")->id;
            $data = [
                'child_id'  => $sid,
                'parent_id' => $aid,
            ];
            $connection = self::getEloquent()->beginTransaction();
            try {
                /** PHPstan fails to find abstract method */
                /** @phpstan-ignore-next-line */
                self::getEloquent()->getModel("supply_chain_v2")->where($data)->delete();

                /** PHPstan fails to find abstract method */
                /** @phpstan-ignore-next-line */
                self::getEloquent()->getModel("supply_chain_v2")->insert($data);

                $connection->commit();
            } catch (\Exception $e) {
                //TODO
                //catch error with SNS
                $connection->rollback();
            }
        };
    }

    /**
     * @param string $type
     * @return callable
     */
    public static function mapEntities(string $type): callable
    {
        return function ($a) use ($type) {

            $aid = $a->get("main_contractor")->id;
            $sid = $a->get("subcontractor")->id;

            $data = array_map(function ($type_id) use ($aid, $sid) {
                return [
                    'account_id'      => $aid,
                    'group_id'        => $sid,
                    'mapping_type_id' => $type_id
                ];
            }, $a->get("body.$type", []));

            $connection = self::getEloquent()->beginTransaction();
            try {
                /** PHPstan fails to find abstract method */
                /** @phpstan-ignore-next-line */
                $type_id = self::getEloquent()->getModel("mapping_type_v2")->where(['label' => $type])->get()->first()->toArray();
                $existing_trades = self::getEloquent()->getModel("mapping_v2")
                    ->where([
                        'account_id'      => $aid,
                        'group_id'        => $sid
                    ])
                    ->whereHas("entity", function ($q) use ($type_id) {
                        return $q->where("attribute_type_id", "=", $type_id['id']);
                    })->get()->toArray();

                foreach ($existing_trades as $trade) {
                    self::getEloquent()->getModel("mapping_v2")->where(['id' => $trade['id']])->delete();
                }
                /** PHPstan fails to find abstract method */
                /** @phpstan-ignore-next-line */
                self::getEloquent()->getModel("mapping_v2")->insert($data);
                $connection->commit();
            } catch (\Exception $e) {
                //TODO
                //catch error with SNS
                $connection->rollback();
            }
        };
    }

    /**
     * @return callable
     */
    public static function createSubcontractor(): callable
    {
        return function (Shape $action) {

            if ($action->get("is_new_account")) {
                $body = $action->getShape("body");
                /** PHPstan fails to find abstract method */
                /** @phpstan-ignore-next-line */
                $data = self::getEloquent()->getModel("account_v2")->extract($body->toArray());
                $data["type_id"] = intval($body->get("account_type_id"));
                $data['region_group_id'] = $action->get("main_contractor")->region_group_id;
                $subcontractor = self::getEloquent()->getModel("account_v2")->create($data);
                $action->set("subcontractor", $subcontractor);
                $action->set("subcontractor_id", $subcontractor->id);
                //Create a placeholder user account
                $action->set("subcontractor_user", self::getEloquent()->getModel("user")->create(
                    [
                        'account_id' => $subcontractor->id,
                        'password'  => md5(bin2hex(random_bytes(16))),
                        'firstname' => $body->get("users.firstname"),
                        'lastname'  => $body->get("users.lastname"),
                        'display_name'  => sprintf("%s %s", $body->get("users.firstname"), $body->get("users.lastname")),
                        'type_id'   => intval($body->get("user_type_id")),
                        'email'     => bin2hex(random_bytes(16))
                    ]
                ));
                //Create membership entry
                $membership = self::getEloquent()->getModel("subscription")->where("uid", 'external_subcontractor')->first()->toArray();
                self::getEloquent()->getModel("membership")->create(
                    [
                        'account_id' => $subcontractor->id,
                        'subscription_id'  => $membership['id']
                    ]
                );
            }
        };
    }

    /**
     * @return callable
     */
    public static function mapMeta(): callable
    {
        return function ($a) {
            $aid = $a->get("main_contractor_id");
            $subcontractor = $a->get("subcontractor");
            $e = self::getEloquent();
            if ($e->isModel($subcontractor)) {
                /** PHPstan fails to find abstract method */
                /** @phpstan-ignore-next-line */
                $isExternal = $e->getModel("account_type_v2")->isType($subcontractor, "external_subcontractor");
                $specialist = $e->getModel("account_type_v2")->isType($subcontractor, "specialist");
                if ($isExternal || $specialist) {
                    $meta = $subcontractor->toArray()["meta"];
                    $body = $a->getShape("body");
                    $json = is_string($meta) ? json_decode($meta, true) : [];
                    if (!$json) {
                        $json = [];
                    }
                    /** PHPstan thinks $aid is mixed.. good one phpstan */
                    /** @phpstan-ignore-next-line */
                    $display_name = $body->get("users.firstname");
                    if ($body->get("users.lastname")) {
                        $display_name .= " " . $body->get("users.lastname");
                    }
                    $json[intval($aid)] = [
                        'name'    => $body->get("name"),
                        'email'   => $body->get("email"),
                        'address' => $body->get("address"),
                        'mobile'  => $body->get("phone"),
                        'user' => [
                            'display_name' => $display_name,
                            'firstname' => $body->get("users.firstname"),
                            'lastname' => $body->get("users.lastname"),
                            'email' => $body->get("email"),
                        ]
                    ];
                    $subcontractor->update(["meta" => json_encode($json)]);
                }
            }
        };
    }

    /**
     * @param string $parentKey
     * @param string $childKey
     * @return callable
     */
    public static function loadSupplyChain(string $parentKey = 'uriArgs.id', string $childKey = 'uriArgs.child_id'): callable
    {
        return function ($a) use ($parentKey, $childKey) {

            $parentId = $a->get($parentKey);
            $childId = $a->get($childKey);

            $sp = self::getEloquent()->getModel("supply_chain_v2")
                ->where('parent_id', $parentId)
                ->where('child_id', $childId);

            $a->set('supply_chain_model', $sp);
        };
    }

    /**
     * @param string $statusKey
     * @return callable
     */
    public static function updateSupplyChainStatus(string $statusKey = 'status_id'): callable
    {
        return function ($a) use ($statusKey) {
            $a->set('success_updated', 0);
            $status = intval($a->getShape("body")->get($statusKey));

            $statusTypes = $a->get('status_types')->values('id');
            $validStatus = in_array($status, $statusTypes);

            $sp = $a->get('supply_chain_model');
            if ($sp && $sp->exists() && $validStatus) {
                $sp->update([$statusKey => $status]);
                $a->set('success_updated', true);
            }
        };
    }

    /**
     * @param int $min
     * @param int $max
     * @return callable
     */
    public static function rateSupplyChain(int $min = 1, int $max = 5): callable
    {
        return function ($a) use ($min, $max) {
            $a->set('rate_created', false);
            $a->set('success_updated', false);
            $data = $a->getShape("body");

            $stars = intval($data->get('value'));
            $validStars = $stars >= $min && $stars <= $max;

            $sp = $a->get('supply_chain_model');
            if ($sp && $sp->exists() && $validStars) {
                $data->set('supply_chain_id', $sp->first()->id);
                $rate = self::getEloquent()->getModel("supply_chain_history")->create($data->toArray());
                $a->set('rate_created', $rate->id);
            }
        };
    }

    /**
     * @param int $defaultLimit
     * @param int $maxLimit
     * @return callable
     */
    public static function loadSubContractorIds(int $defaultLimit = 20, int $maxLimit = 100, string $parentKey = "parent_id"): callable
    {
        return function ($action) use ($defaultLimit, $maxLimit, $parentKey) {

            $parentId = intval($action->get($parentKey));
            list($limit, $offset) = RestMiddleware::getLimitOffset($defaultLimit, $maxLimit)($action);

            $ids = self::getEloquent()
                ->getModel("supply_chain")
                ->where(["parent_id" => $parentId])
                ->groupBy('child_id')
                ->limit($limit)
                ->offset($offset)
                ->get("child_id")
                ->toArray();

            $action->set(
                "subcontractor_ids",
                array_map(function ($i) {
                    return intval($i["child_id"]);
                }, $ids)
            );
        };
    }

    /**
     * @param string $returnKey
     * @return callable
     */
    public static function loadTradesWithCategory(string $returnKey = 'trades'): callable
    {
        return function ($action) use ($returnKey) {
            $data = self::getEloquent()->getModel("trade")
                ->select(
                    "trade.id as id",
                    "trade.label as label",
                    "trade_category_mapping.category_id as category_id"
                )
                ->leftJoin('trade_category_mapping', function ($join) {
                    $join->on('trade.id', '=', 'trade_category_mapping.trade_id');
                })->get()->toArray();

            $action->set($returnKey, new Collection($data, Shape::class));
        };
    }

    /**
     * @return callable
     */
    public static function mapRegionsToCollection(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                $group = $collection->getFirst()->get("parent_id");
                $regionMapping = [];
                foreach (
                    self::getEloquent()->getModel("region_mapping")
                        ->where("group_id", $group)->get()->toArray() as $row
                ) {
                    $regionMapping[$row["account_id"]][] =
                        $action->getCollection("region")
                        ->filterByField("id", intval($row["region_id"]))
                        ->getFirst();
                }

                $action->getCollection("collection")->update(function ($i) use ($regionMapping) {
                    $id = $i->get("child_id");
                    if (isset($regionMapping[$id])) {
                        $i->set("region", $regionMapping[$id]);
                    }
                    return $i;
                });
            }
        };
    }

    /**
     * @return callable
     */
    public static function mapRegions(): callable
    {
        return function ($a) {
            $aid = $a->get("main_contractor")->id;
            $sid = $a->get("subcontractor")->id;
            $type = intval(self::getEloquent()->getModel("region_mapping_type")
                ->where("label", "supply_chain")
                ->first()
                ->toArray()["id"]);

            $data = array_map(function ($region) use ($aid, $sid, $type) {
                return [
                    'account_id' => $sid,
                    'region_id' => $region,
                    "group_id"   => $aid,
                    "type_id"    => $type
                ];
            }, $a->get("body.regions"));

            /** PHPstan fails to find abstract method */
            /** @phpstan-ignore-next-line */
            self::getEloquent()->getModel("region_mapping")
                ->where(["group_id" => $aid, "account_id"  => $sid, "type_id" => $type])
                ->delete();

            /** PHPstan fails to find abstract method */
            /** @phpstan-ignore-next-line */
            self::getEloquent()->getModel("region_mapping")->insert($data);
        };
    }
}
