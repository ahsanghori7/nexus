<?php

namespace Api\Model\Project;

use Core\Data\Collection;
use Core\Service\Manager;
use Core\Data\Shape;

class Statuses
{

    /**
     * @throws \Exception
     */
    public static function fetchStatuses(): array
    {
        $statuses = Manager::getService("project")->fetch("project/statuses");
        return $statuses ? $statuses->getCollection('data')->getItemsAsArray() : [];
    }
}
