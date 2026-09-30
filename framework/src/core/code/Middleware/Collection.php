<?php

namespace Core\Middleware;

use Core\Data\Collection as CollectionClass;

class Collection
{

    /**
     * @param callable $reducer
     * @param string $k
     * @return callable
     */
    public static function reduce(callable $reducer, string $k = "collection") : callable {

        return function($shape) use($reducer, $k) {
            $collection = $shape->getCollection($k);
            $items   = [];
            foreach($collection as $item) {
                if($reducer($item, $items, $shape)) {
                    $items[] = $item;
                }
            }
            $shape->set($k, new CollectionClass($items, $collection->getObjectClass()));
        };
    }

    /**
     * @param callable $formatter
     * @param string $k
     * @return callable
     */
    public static function format(callable $formatter, string $k = "collection") : callable {
        return function($shape) use ($k, $formatter) {
            $collection = $shape->getCollection($k);
            $items   = [];
            foreach($collection as $item) {
                $items[] = $formatter($item, $shape);
            }
            $shape->set($k, new CollectionClass($items, $collection->getObjectClass()));
        };
    }

    /**
     * @param string $aggregationKey
     * @param array<int, string> $aggregatedFields
     * @param string $k
     * @return callable
     */
    public static function aggregate(string $aggregationKey, array $aggregatedFields = [], string $k = "collection") : callable {
        return function($shape) use ($k, $aggregatedFields, $aggregationKey) {
            $shape->getCollection($k)->aggregate(
                $aggregationKey, $aggregatedFields
            );
        };
    }

    /**
     * Get all the values of a collection by field and store them in as array in shape arg
     * @param string|callable $field
     * @param string $saveKey
     * @param string $k
     * @return callable
     */
    public static function storeFieldValues(string|callable $field, string $saveKey, string $k = "collection") : callable {
        return function($shape) use ($k, $field, $saveKey) {
            $collection = $shape->getCollection($k);
            $values     = [];
            foreach($collection as $item) {
                $values[] = is_string($field) ? $item->get($field) : $field($item, $collection);
            }
            $shape->set($saveKey, $values);
        };
    }
}
