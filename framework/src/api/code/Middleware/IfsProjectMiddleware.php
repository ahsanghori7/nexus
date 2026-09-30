<?php

namespace Api\Middleware;

use Core\Router\Route\Action;
use Core\Service\Manager;

class IfsProjectMiddleware
{
    const IFS_FEATURE = "IFS";
    const DEFAULT_PER_PAGE = 25;

    /**
     * @return callable
     */
    public static function listAvailable(): callable
    {
        return function (Action $action) {
            $mappingIds = self::mappingIds($action);
            if (!$mappingIds) {
                $action->set("json", json_encode(["data" => ["records" => [], "total" => 0]]));
                return;
            }

            $args = $action->getRoute()->getRequest()->getArgs();
            $page = max((int) $args->get("page", 1), 1);
            $perPage = max((int) $args->get("per_page", self::DEFAULT_PER_PAGE), 1);

            try {
                $res = Manager::getService("project")->fetch("partner_catalogue/available", [
                    "mapping_ids" => implode(",", $mappingIds),
                    "search" => (string) $args->get("search", ""),
                    "limit" => $perPage,
                    "offset" => ($page - 1) * $perPage,
                ]);
            } catch (\Throwable $e) {
                $action->set("json", json_encode(["data" => ["records" => [], "total" => 0]]));
                return;
            }

            $action->set("json", json_encode(["data" => $res->getShape("data")->toArray()]));
        };
    }

    /**
     * @return callable
     */
    public static function linkedForProject(): callable
    {
        return function (Action $action) {
            $projectId = (int) $action->get("uriArgs.id", 0);
            $mappingIds = self::mappingIds($action);

            if (!$projectId || !$mappingIds) {
                $action->set("json", json_encode(["data" => []]));
                return;
            }

            try {
                $res = Manager::getService("project")->fetch(
                    sprintf("partner_catalogue/project/%d", $projectId),
                    ["mapping_ids" => implode(",", $mappingIds)]
                );
            } catch (\Throwable $e) {
                $action->set("json", json_encode(["data" => []]));
                return;
            }

            $action->set("json", json_encode(["data" => $res->getShape("data")->toArray()]));
        };
    }

    /**
     * @param Action $action
     * @return array
     */
    private static function mappingIds(Action $action): array
    {
        $accountId = (int) $action->get("account.id");
        if (!$accountId || !self::hasFeature($accountId)) {
            return [];
        }

        try {
            $res = Manager::getService("account")->fetch(
                sprintf("api_client/business_unit/account/%d", $accountId)
            );
        } catch (\Throwable $e) {
            return [];
        }

        $ids = [];
        foreach ($res->getShape("data")->toArray() as $mapping) {
            $ids[] = (int) (((array) $mapping)["id"] ?? 0);
        }

        return array_values(array_filter($ids));
    }

    /**
     * @param int $accountId
     * @return bool
     */
    private static function hasFeature(int $accountId): bool
    {
        try {
            $res = Manager::getService("account")->fetch(sprintf("feature/accounts/%d", $accountId));
        } catch (\Throwable $e) {
            return false;
        }

        foreach ($res->getShape("data")->toArray() as $row) {
            $row = (array) $row;
            if (strcasecmp((string) ($row["feature"] ?? ""), self::IFS_FEATURE) === 0) {
                return true;
            }
        }

        return false;
    }
}
