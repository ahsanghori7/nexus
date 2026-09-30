<?php

namespace Api\Data\Boq;

use \Core\Data\Shape;
use Api\Data\Transaction\QuoteCollection;

class Resource extends Shape
{

    const SECTION_TYPE = "section";

    const ITEM_TYPE = "item";

    /**
     * @return Shape
     * @throws \Exception
     * Group BOQ entries by section description
     */
    public static function getLatestResource($resources): array
    {
        $version = 1;
        $result = null;
        foreach ($resources as $resource) {
            $resourceVersion = $resource["resource_version"]["version"];
            if ($resourceVersion >= $version) {
                $version = $resourceVersion;
                $result = $resource;
            }
        }
        return $result;
    }
}
