<?php

namespace SupplyChain\Middleware;

use Core\Data\Collection;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Service\UserMiddleware;
use Core\Middleware\Exception as MiddlewareException;
use SupplyChain\EloquentService;
use SupplyChain\Middleware\RestMiddleware;


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
            self::getEloquent()->getModel("supply_chain")->validate(
                $action->get("body")
            );
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

            $parentId = (int) $action->get($parentKey);
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
                    return (int) $i["child_id"];
                }, $ids)
            );
        };
    }

    /**
     * @param int $defaultLimit
     * @param int $maxLimit
     * @param string $idKey
     * @return callable
     */
    public static function loadCollection(string $idKey = "uriArgs.id"): callable
    {
        return function ($action) use ($idKey) {
            $action->set("parent_id", (int) $action->get($idKey));
            $data = self::getEloquent()->getModel("supply_chain")
                ->with(["trade", "contractor"])
                ->where(["parent_id" => $action->get("parent_id")])
                ->get()->toArray();
            $action->set("collection", new Collection($data, Shape::class));
        };
    }

    /**
     * @return callable
     */
    public static function filterDataByName(): callable
    {
        return function ($action) {
            $args = $action->getRoute()->getRequest()->getArgs();
            $term = strtolower($args->get("term", ""));

            $collection = $action->getCollection("collection")->getItemsAsArray();

            $data = array_filter($collection, function ($sp) use ($term) {
                if ($term && isset($sp["contractor"])) {
                    return strpos(strtolower($sp["contractor"]["name"]), $term) !== false;
                }
                return true;
            });

            $action->set("total", count($data));
            $action->set("collection", new Collection($data, Shape::class));
        };
    }

    /**
     * @return callable
     */
    public static function orderData(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                list($order, $desc) = RestMiddleware::getOrderQuery()($action);
                if ($order && $order === "company") {
                    $action->getCollection("collection")->sort(function ($a, $b) use ($desc) {
                        if ($a["contractor"]["name"] == $b["contractor"]["name"]) return 0;
                        $condition = $desc ?
                            $a["contractor"]["name"] > $b["contractor"]["name"]
                            : $a["contractor"]["name"] < $b["contractor"]["name"];
                        return $condition ? 1 : -1;
                    });
                }
            }
        };
    }

    /**
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
     * @return callable
     */
    public static function loadTradesWithCategory(): callable
    {
        return function ($action) {
            $data = self::getEloquent()->getModel("trade")
                ->select(
                    "trade.id as id",
                    "trade.label as label",
                    "trade_category_mapping.category_id as category_id"
                )
                ->leftJoin('trade_category_mapping', function ($join) {
                    $join->on('trade.id', '=', 'trade_category_mapping.trade_id');
                })->get()->toArray();

            $action->set("collection", new Collection($data, Shape::class));
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
                        ->filterByField("id", (int)$row["region_id"])
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
    public static function mapUsersToCollection(): callable
    {
        return function ($action) {
            $userCollection = $action->getCollection("users");
            $membershipsCollection = $action->getCollection("memberships");

            $action->getCollection("collection")->update(function ($i) use ($userCollection, $membershipsCollection) {
                $aid  = $i->get("parent_id");
                $meta = $i->json("contractor.meta");
                $mobile = $i->get("contractor.mobile");
                if ($meta) {
                    $user   = $meta[$aid]["user"]   ?? [];
                    $mobile = $meta[$aid]["mobile"] ?? "";
                } else {
                    $user = $userCollection
                        ->filterByField("account_id", $i->get("child_id"))
                        ->getFirst()
                        ->toArray();
                }
                $i->set("users", [
                    'id' => $user['id'] ?? null,
                    'account_id' => $i->get("child_id"),
                    'email'      => $user['email'] ?? "",
                    'firstname'  => $user['firstname'] ?? "",
                    'lastname'   => $user['lastname'] ?? "",
                    'display_name' => $user['display_name'] ?? "",
                    'mobile'       => $mobile
                ]);

                $subscription = $membershipsCollection
                    ->filterByField("account_id", $i->get("child_id"));

                if ($subscription->count()) {
                    $i->set("subscription_id", $subscription->getFirst()->get("subscription_id"));
                }

                return $i;
            });
        };
    }

    /**
     * @param string $urlArg
     * @return callable
     */
    public static function loadContractor(string $urlArg = "id", string $key = "main_contractor"): callable
    {
        return function (Shape $a) use ($urlArg, $key) {

            $id = intval($a->get("uriArgs." . $urlArg));
            if ($id) {
                $contractor = self::getEloquent()->getModel("contractor")->where("id", $id);
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
    public static function createSubcontractor(): callable
    {
        return function (Shape $action) {

            if ($action->get("is_new_account")) {
                $body = $action->getShape("body");
                /** PHPstan fails to find abstract method */
                /** @phpstan-ignore-next-line */
                $data = self::getEloquent()->getModel("contractor")->extract($body->toArray());
                $data["type_id"] = intval($body->get("account_type_id"));

                $subcontractor = self::getEloquent()->getModel("contractor")->create($data);
                $action->set("subcontractor", $subcontractor);
                $action->set("subcontractor_id", $subcontractor->id);
                //Create a placeholder user account
                $action->set("subcontractor_user", self::getEloquent()->getModel("user")->create(
                    [
                        'account_id' => $subcontractor->id,
                        'password'  => md5(bin2hex(random_bytes(16))),
                        'firstname' => "------",
                        'lastname'  => "------",
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
    public static function mapTrades(): callable
    {
        return function ($a) {
            $aid = $a->get("main_contractor")->id;
            $sid = $a->get("subcontractor")->id;
            $data = array_map(function ($trade) use ($aid, $sid) {
                return [
                    'trade_id' => $trade,
                    'child_id' => $sid,
                    'parent_id' => $aid,
                ];
            }, $a->get("body.trades"));

            /** PHPstan fails to find abstract method */
            /** @phpstan-ignore-next-line */
            self::getEloquent()->getModel("supply_chain")
                ->where(["parent_id" => $aid, "child_id"  => $sid])
                ->delete();

            /** PHPstan fails to find abstract method */
            /** @phpstan-ignore-next-line */
            self::getEloquent()->getModel("supply_chain")->insert($data);
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
            $type = (int) self::getEloquent()->getModel("region_mapping_type")
                ->where("label", "supply_chain")
                ->first()
                ->toArray()["id"];

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
                if ($e->getModel("contractor_type")->isType($subcontractor, "external_subcontractor")) {
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
     * @return callable
     */
    public static function getOwner(): callable
    {
        return function ($action) {
            UserMiddleware::loadTypes()($action);
            $roles = $action->get("user_types");
            $role = "";
            foreach ($action->getCollection("users") as $u) {
                $owner["name"] = $u->get("display_name");
                $userType = $u->get("type_id");
                $userRole = array_filter($roles->getItemsAsArray(), function ($r) use ($userType) {
                    return intval($r["id"]) === intval($userType);
                });
                $userRole = array_shift($userRole);
                $role = str_replace('_', ' ', $userRole["label"]);
                $role = ucwords($role);
                $owner["role"] = $role;
                if ($role) {
                    $action->set("owner", $owner);
                    break;
                }
            }
        };
    }
}
