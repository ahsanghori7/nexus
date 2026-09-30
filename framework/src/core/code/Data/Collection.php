<?php

namespace Core\Data;

use Countable;
use Iterator;
use JetBrains\PhpStorm\Pure;
use JsonSerializable;

class Collection implements Countable, Iterator, JsonSerializable
{
    /**
     * @var int
     */
    protected int $i = 0;

    /**
     * @var array<mixed, mixed>
     */
    protected array $items = [];

    /**
     * @var string
     */
    protected string $objectClass  = "";

    /**
     * @param array<mixed, mixed> $items
     * @param string $objectClass
     * @throws \Exception
     */
    public function __construct(array $items, string $objectClass) {
        $this->items = $items;
        $this->setObjectModel($objectClass);
    }

    /**
     * @return int
     */
    public function count() : int {
        return count($this->items);
    }

    /**
     * @return Shape
     * @throws \Exception
     */
    public function current() : Shape {
        return $this->getByIndex($this->i);
    }

    /**
     * @return int
     */
    public function key() : int {
        return $this->i;
    }

    /**
     * @return void
     */
    public function next() : void {
        ++$this->i;
    }

    /**
     * @return void
     */
    public function rewind() : void {
        $this->i = 0;
    }

    /**
     * @return bool
     */
    #[Pure] public function valid() : bool {
        return $this->key() < count($this->items);
    }

    /**
     * @param callable $cb
     * @return $this
     */
    public function sort(callable $cb): static
    {
        usort($this->items, $cb);
        return $this;
    }

    /**
     * @param string $field
     * @return $this
     */
    public function sortBy(string $field) {
        return $this->sort(function($a, $b) use ($field) {
           return $a->get($field) - $b->get($field);
        });
    }

    /**
     * @param string $type
     * @return $this
     */
    public function sortByKeys(string $type = 'ASC'): static
    {
        ($type === "ASC") ? ksort($this->items) : krsort($this->items);
        return $this;
    }

    /**
     * @return string
     */
    public function getObjectClass() : string {
        return $this->objectClass;
    }

    /**
     * @param string $class
     * @return $this
     * @throws \Exception
     */
    public function setObjectModel(string $class) : Collection {
        if(class_exists($class)) {
            $this->objectClass = $class;
            if(!is_a($class, Shape::class, true) && !is_subclass_of($class, Shape::class)) {
                throw new \Exception(
                    "Invalid Object Class $class must be Data Shape or sub class of Data\Shape"
                );
            }
        }
        else {
            throw new \Exception("Unknown Object Class $class");
        }
        return $this;
    }

    /**
     * @return array<array<string, mixed>>
     */
    public function getItemsAsArray() : array
    {
        $list = [];
        foreach($this->getItems() as $item){
            $list[] = $item->toArray();
        }
        return $list;
    }

    /**
     * @param mixed $subject
     * @return bool
     */
    public function isObjectInstance(mixed $subject) : bool {
        return (
            (is_string($subject) || is_object($subject)) &&
            //Parameter #1 $object_or_class of function is_a expects object, object|string given.
            //which is weird as the 1 parameter is of type mixed
            // * @link https://php.net/manual/en/function.is-a.php
            // * @param object|string $object_or_class <p>
            /** @phpstan-ignore-next-line */
            (is_a($subject, Shape::class))
        );
    }

    /**
     * @return array<Shape>
     */
    public function getItems() : array {
        return array_map(function($i) {
                if(is_array($i) || $this->isObjectInstance($i)) {
                    /* PHPStan doesn't recognise this as an array or an object instance... */
                    /* @phpstan-ignore-next-line */
                    return $this->getItemAsInstance($i);
                }
            },
            $this->items
        );
    }

    /**
     * @param bool $asInts
     * @return array<int, mixed>
     */
    public function getIds(bool $asInts = false): array
    {
        $ids = [];
        foreach($this->getItems() as $item) {

            $id = $item->toArray()['id'];
            if($asInts) {
                $id = intval($id);
            }
            $ids[] = $id;
        }

        return $ids;
    }

    /**
     * @param array<mixed, mixed> $data
     * @return Shape
     */
    public function getObjectModel(array $data) : Shape {
        $shape = new $this->objectClass($data);
        if(!is_a($shape, Shape::class)) {
            throw new \Exception("Invalid Collection model : Non Shape Found");
        }
        return $shape;
    }

    /**
     * @param callable $callback
     * @return Collection
     */
    public function filter(Callable $callback) : Collection {
        return $this->getNewCollection(
            array_values(array_filter($this->getItems(), $callback))
        );
    }

    /**
     * @param array<array<string, mixed>>|array<int, Shape> $items
     * @return Collection
     * Deprecated: Use clone instead as this only returns the parent class, not a child instance
     */
    public function getNewCollection(array $items): Collection
    {
        return new self(
            $items,
            $this->objectClass
        );
    }

    /**
     * @param array<mixed, mixed>|Shape $item
     * @return Shape
     */
    public function getItemAsInstance(array|Shape $item) : Shape {
        if($item instanceof Shape) {
            return $item;
        }

        return $this->getObjectModel($item);
    }

    /**
     * @return Shape
     * @throws \Exception
     */
    public function getFirst(): Shape
    {
        return $this->getByIndex(0);
    }

    /**
     * Replacement for deprecated function above
     * @return Shape
     * @throws \Exception
     */
    public function first(): Shape {
        if($this->count() === 0) {
            return new Shape();
        }
        return $this->getByIndex(0);
    }

    /**
     * @param int $start
     * @param $offset
     * @return Collection
     */
    public function slice(int $start = 0, $offset = 1) {
        return $this->clone(array_slice($this->items, $start, $offset, true));
    }


    /**
     * @return Shape
     */
    public function getLast(): Shape
    {
        return $this->getByIndex($this->count() - 1);
    }

    /**
     * @param int $idx
     * @return Shape
     */
    public function getByIndex(int $idx): Shape
    {
        if((count($this->items) - 1) >= $idx) {
            $indexedItems = array_values($this->items);
            $item = $indexedItems[$idx] ?? null;
            if(!$item) {
                throw new \Exception("Invalid Index $idx, not item found");
            }

            if(is_array($item) || $this->isObjectInstance($item)) {
                /* PHPStan doesn't recognise this as an array or an object instance... */
                /* @phpstan-ignore-next-line */
                return $this->getItemAsInstance($item);
            }

            throw new \Exception("Invalid value found at idx $idx");
        }
        throw new \Exception("Invalid index $idx");
    }

    /**
     * @param string $field
     * @param mixed $value
     * @param string $operator
     * @param string|null $cast
     * @return Collection
     */
    public function filterByField(string $field, mixed $value, string $operator="=", string $cast = null) : Collection {
        return $this->filter(function($i) use($field, $value, $operator, $cast) {

            $field = ($i->get($field));

            if($cast){
                $field = match ($cast) {
                    'int' => (int)$field,
                    'string' => (string)$field,
                    'bool' => (bool)$field,
                    'float' => (float)$field,
                    default => strval($field),
                };
            }
            return match($operator){
                "=" => $field === $value,
                "!=" => $field !== $value,
                ">" => $field > $value,
                "<" => $field < $value,
                default => $field === $value,
            };
        });
    }

    /**
     * @param string $field
     * @param array<mixed, mixed> $array
     * @param bool $strict
     * @return Collection
     */
    public function filterByExistInArray(string $field, array $array, bool $strict = true) : Collection {
        return $this->filter(function($i) use($field, $array, $strict) {
            return (in_array($i->get($field), $array, $strict));
        });
    }

    /**
     * @param string $field
     * @param array $array
     * @param bool $strict
     * @return Collection
     */
    public function filterByNotExistInArray(string $field, array $array, bool $strict = true) : Collection {
        return $this->filter(function($i) use($field, $array, $strict) {
            return !(in_array($i->get($field), $array, $strict));
        });
    }

    /**
     * @param string $field
     * @param mixed $value
     * @param bool $cleanSearch
     * @return Collection
     */
    public function filterByStringField(string $field, mixed $value, bool $cleanSearch = false) : Collection {
        return $this->filter(function($i) use($field, $value, $cleanSearch) {
            if ($cleanSearch) {
                return strcasecmp(preg_replace('/\s+/', '', $i->get($field)), strval($value)) === 0 ? $i : false;
            }
            return (strcasecmp($i->get($field), strval($value)) === 0) ? $i : false;
        });
    }

    /**
     * @param string $field
     * @param string $regex
     * @return Collection
     */
    public function filterByRegex(string $field, string $regex) : Collection {
        return $this->filter(function($i) use($field, $regex) {
            return preg_match('/'.$regex.'/', $i->get($field));
        });
    }


    /**
     * @param Collection $newItems
     * @return Collection
     */
    public function merge(Collection $newItems) : Collection {
        return new Collection(
            array_merge($this->getItemsAsArray(), $newItems->getItemsAsArray()),
            $this->objectClass
        );
    }

    /**
     * @param string $key
     * @param bool $unique
     * @return array<int, mixed>
     */
    public function values(string $key, $unique=false) : array {
        $values = [];
        foreach ($this as $i) {
            $values[] = $i->get($key);
        }
        return ($unique) ? array_unique($values) : $values;
    }

    /**
     * @param callable $callback
     * Deprictated, use modify until safe to use as this method is slightly broken
     * @return Collection
     */
    public function update(callable $callback) : Collection {
        foreach($this->items as $i => $item) {
            //This this might be a mistake we update the item twice
            //ToDo: Check unit tests and cover this before altering code
            $this->items[$i] = $callback($item, $i);
            $new_item = $callback($item, $i);
            if(!is_array($new_item) && !$this->isObjectInstance($new_item)){
                throw new \Exception('Update callback must either return shape or array');
            }
            $this->items[$i] = $new_item;
        }
        return $this;
    }

    /**
     * Use to Modify the internal state of a Collection, replacement for update method above
     * @param callable $callback
     * @return Collection
     */
    public function modify(callable $callback) : Collection {
        foreach($this as $i => $item) {

            $new_item = $callback($item, $i);
            if(!is_array($new_item) && !$this->isObjectInstance($new_item)){
                throw new \Exception('Update callback must either return shape or array');
            }
            $this->items[$i] = $new_item;
        }
        return $this;
    }


    /**
     * @param string $childKey
     * @param callable $callback
     * @return $this
     */
    public function mapChild(string $childKey, callable $callback) : Collection {
        foreach($this->getItems() as $i => $item) {
            $childData = $item->get($childKey);
            if(!$childData){
                throw new \Exception('Child data does not exist');
            }
            foreach($childData as $child){
                $this->items[$i]->set($childKey, $callback($item, $child));
            }
        }
        return $this;
    }

    /**
     * @param callable $callback
     * @return $this
     */
    public function map(callable $callback) : Collection {
        $data = [];
        foreach($this->getItems() as $i => $item) {
            $data[] = $callback($item, $i);
        }
        $this->items = $data;
        return $this;
    }

    /**
     * @param string $factorField
     * @param array<int, string> $aggregateFields
     * @return void
     * @throws \Exception
     */
    public function aggregate(string $factorField, array $aggregateFields = []) {
        $aggregation = [];
        $fields      = [];
        foreach($this->getItems() as $item) {
            $factor = $item->get($factorField);
            if(!$factor) {
                throw new \Exception("Invalid Aggregation Factor $factorField");
            }
            if(!isset($aggregation[$factor])) {
                $aggregation[$factor] = $item;
            }
            foreach($aggregateFields as $field) {
                if($value = $item->get($field)) {
                    $fields[$factor][$field][] = $value;
                }

            }
        }
        foreach($fields as $key => $values) {
            foreach($values as $k => $v) {
                $aggregation[$key]->set($k, $v);
            }
        }

        $this->items = $aggregation;
    }

    /**
     * @param string $groupingKey
     * @param callable $reducer
     * @return void
     *
     * Loop items collection and group then reduce down for a callback
     */
    public function mapReduce(string $groupingKey, callable $reducer, $updateInternalState=false) : Collection {
        $groups = [];

        $newCollection = $this->clone();
        foreach($this->getItems() as $item) {
            $groupClauseValue = $item->get($groupingKey);
            $groups[$groupClauseValue][] = $item;
        }

        foreach ($groups as $groupVal => $items) {
            $reducedItems = $reducer($this->clone($items), $groupVal, $this);
            if(!$reducedItems || is_array($reducedItems) || (!$reducedItems instanceof Collection)) {
                throw new \Exception("Reducer must return array or collection");
            }

            if(count($reducedItems)) {
                $newCollection = $newCollection->merge(
                    is_array($reducedItems) ? $this->clone($reducedItems) : $reducedItems
                );
            }
        }

        if($updateInternalState) {
            $this->items = $newCollection->getItems();
            return $this;
        }

        return $newCollection;
    }

    /**
     * @param $item
     * @return $this
     */
    public function append($item) : Collection {
        $this->items[] = $item;
        return $this;
    }

    /**
     * @return array<array<string, mixed>>
     */
    public function jsonSerialize() : array
    {
        return $this->getItemsAsArray();
    }

    /**
     * @param array $items
     * @return Collection
     */
    public function clone(array $items = []) : Collection {
        return new ($this::class)($items, $this->objectClass);
    }

    /**
     * @param string $key
     * @param bool $returnFirst
     * @return Collection
     */
    public function groupByKey(string $key, bool $returnFirst = false) : Collection  {
        $items = [];
        foreach($this->getItems() as $item) {
            $group_key = $item->get($key);
            if(!$group_key){
                continue;
            }
            if($returnFirst) {
                if(!isset($items[$group_key])) {
                    $items[$group_key] = $item;
                }
            }
            else{
                $items[$group_key] = $item;
            }
        }
        return $this->clone($items);
    }
}
