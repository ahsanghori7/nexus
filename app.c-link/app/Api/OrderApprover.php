<?php

namespace App\Api;

use App\Api\Project as ProjectApi;
use App\Models\Collection;
use App\Models\OrderApprover\Type as OrderApproverType;


class OrderApprover extends ProjectApi
{
    /**
     * Allow Config to be overridden
     */
    const API_CONFIG_KEY = "project";

    CONST ENTITY_TYPE = "order_approvers";

    /**
     * @var array
     */
    protected static array $typeCache = [];

    /**
     * @return Collection|mixed
     * @throws Exception
     */
    public static function getTypes(): Collection
    {
        if(!isset(self::$typeCache["orderApprover"])) {
            self::$typeCache["orderApproval"] = new Collection(
                self::get("order_approver/type"),
                OrderApproverType::class
            );
        }

        return self::$typeCache["orderApproval"];
    }

    /**
     * @param $labels
     * @return array
     * @throws Exception
     */
    public static function getTypeIds($labels) : array {
        return self::getTypes()
            ->getIds();
    }
}
