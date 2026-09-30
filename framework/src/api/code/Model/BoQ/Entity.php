<?php

namespace Api\Model\BoQ;

use Core\Data\Collection;
use Core\Service\Manager;
use Core\Data\Shape;

class Entity
{

    const PUBLISHED_STATE = 3;
    const TENDERED_STATE = 6;

    /**
     * @param int $tender_id
     * @throws \Exception
     */
    public static function createEntityFromTenderId(int $tender_id): void
    {
        Manager::getService("project")->write("boq/entity/$tender_id", new Shape([]));
    }

    /**
     * @param int $entity_id
     * @param bool $published
     * @return int
     * @throws \Exception
     */
    public static function getLatestVersionByEntityId(int $entity_id, bool $published = false): int
    {
        $version = 1;
        $entity = Manager::getService("project")->fetch("boq/entity/$entity_id")->getCollection("data.entries");
        $entity->map(function ($items) use (&$version, $published) {
            $mappings = (new Collection($items->get("item_mappings"), Shape::class));
            $mappings->map(function ($item) use (&$version, $published) {
                if ($item->get("item_version.version") > $version) {
                    if ($published) {
                        $status = $item->get("item_version.status");
                        $version = $status === self::PUBLISHED_STATE || $status === self::TENDERED_STATE ?
                            $item->get("item_version.version") : $version;
                    } else {
                        $version = $item->get("item_version.version");
                    }
                }
                return $item;
            });
        });
        return intval($version);
    }

    /**
     * @param int $eid
     * @return bool
     * @throws \Exception
     */
    public static function hasPublishedVersion(int $eid): bool
    {
        $entity = Manager::getService("project")->fetch("boq/entity/$eid")->getCollection("data.entries");
        $hasPublishedVersion = false;
        $entity->map(function ($items) use (&$hasPublishedVersion) {
            $mappings = (new Collection($items->get("item_mappings"), Shape::class));
            $mappings->map(function ($item) use (&$hasPublishedVersion) {
                $status = $item->get("item_version.status");
                $hasPublishedVersion = $status === self::PUBLISHED_STATE || $status === self::TENDERED_STATE;
                return $item;
            });
            return $items;
        });
        return $hasPublishedVersion;
    }
}
