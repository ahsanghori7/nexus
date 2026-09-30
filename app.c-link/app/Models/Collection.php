<?php

namespace App\Models;

use App\Models\Base;

class Collection implements \Countable, \Iterator, \JsonSerializable
{
    /**
     * @var int
     */
    protected int $i = 0;

    /**
     * @var array
     */
    protected array $items = [];

    /**
     * @var string
     */
    protected string $collectionModel;

    /**
     * @var mixed
     */
    protected $validator;

    /**
     * @var string
     */
    protected string $idField = "";

    /**
     * @param array $items
     */
    public function __construct(array $items, string $collectionModel,  $validator = null, $idField="id") {
        $this->items = $items;
        $this->setCollectionModel($collectionModel);
        $this->validator = $validator;
        $this->idField = $idField;
    }

    /**
     * @return int
     */
    public function count() : int {
        return count($this->items);
    }

    /**
     * @return mixed|null
     */
    public function current(): mixed {
        return $this->items[$this->i] ?? null;
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
    public function valid() : bool {
        $valid = true;
        if(is_callable($this->validator)) {
            $validatorFunction = $this->validator;
            $valid = ($validatorFunction($this->current()) === true);
        }else{
            return $this->key() < count($this->items);
        }
        return $valid;
    }

    /**
     * @param callable $cb
     * @return $this
     */
    public function sort(callable $cb) {
        usort($this->items, $cb);
        return $this;
    }

    /**
     * @param string $class
     * @return $this
     */
    public function setCollectionModel(string $class) : Collection {
        if(is_subclass_of($class, Abstraction::class)) {
            $this->collectionModel = $class;
        }else{
            throw new \Exception('class does not abstract model abstraction');
        }
        return $this;
    }

    /**
     * @return array
     */
    public function getItemsAsArray(): array
    {
        $list = [];
        foreach($this->getItems() as $item){
            $list[] = $item->getData();
        }
        return $list;
    }

    /**
     * @return array
     */
    public function getIds($asInts = false): array
    {
        $ids = [];
        foreach($this->getItems() as $items) {

            $id = $items->getId();
            if($asInts) {
                $id = (int) $id;
            }
            $ids[] = $id;
        }

        return $ids;
    }

    /**
     * @return array
     */
    public function getItems() : array {
        return array_map([$this, "getItemAsInstance"], $this->items);
    }

    /**
     * @param array $data
     * @return Abstraction
     */
    public function getCollectionModel(array $data) : Abstraction {
        return new $this->collectionModel($data, $data[$this->idField] ?? null);
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
     * @param string $method
     * @param $assertion
     * @param array $args
     * @return Collection
     */
    public function filterByModelFunction(string $method, $assertion, array $args = []): Collection
    {
        return $this->filter(function($i) use($method, $assertion, $args) {
            if(method_exists($i, $method)){
                return $i->$method($args) == $assertion;
            }
        });
    }

    /**
     * @param array $items
     * @return Collection
     */
    public function getNewCollection(array $items): Collection
    {
        return new self(
            $items,
            $this->collectionModel
        );
    }

    /**
     * @param $item
     * @return Abstraction
     */
    public function getItemAsInstance($item) : Abstraction {
        if($item instanceof Abstraction) {
            return $item;
        }

        return $this->getCollectionModel($item);
    }

    /**
     * @return Abstraction
     */
    public function getFirst() {
        return $this->getByIndex(0);
    }

    /**
     * @return Abstraction
     */
    public function getLast() {
        return $this->getByIndex($this->count() - 1);
    }

    /**
     * @param int $idx
     * @return Abstraction|null
     */
    public function getByIndex(int $idx) {
        if((count($this->items) - 1) >= $idx) {
            return $this->getItemAsInstance($this->items[$idx]);
        }
        return null;
    }

    /**
     * @param string $key
     * @param string $flag
     * @return Collection
     */
    public function sortBy(string $key, string $flag = 'ASC') : Collection {

        usort($this->items, static function($a, $b) use ($key, $flag) {
            $ak = $a[$key] ?? null;
            $bk = $b[$key] ?? null;

            if(!$ak || !$bk) {
                return false;
            }

            if ( $flag == 'DESC' ) {
                return strcmp($b[$key], $a[$key]);
            }
            if( $flag == 'ASC' ) {
                return strcmp($a[$key], $b[$key]);
            }
        });

        return $this->getNewCollection(
            array_values($this->items)
        );
    }

    /**
     * @param string $field
     * @param array $array
     * @param bool $strict
     * @param bool $operator
     * @return Collection
     */
    public function filterByExistInArray(string $field, array $array, bool $strict = true, $operator = true) : Collection {
        return $this->filter(function($i) use($field, $array, $strict, $operator) {
            return (in_array($i->getData($field), $array, $strict)) === $operator;
        });
    }

    /**
     * @param string $field
     * @param $value
     * @return Collection
     */
    public function filterByField(string $field, $value, $operator="=") : Collection {
         return $this->filter(function($i) use($field, $value, $operator) {
             $res = false;
             switch($operator) {
                 case "=":
                     $res = ($i->getData($field) === $value);
                     break;
                 case "!=":
                     $res = ($i->getData($field) !== $value);
                     break;
                 case ">":
                     $res = ($i->getData($field) > $value);
                     break;
                 case "<":
                     $res = ($i->getData($field) < $value);
                     break;
             }
             return $res;
         });
    }

    /**
     * @param string $field
     * @param $value
     * @return Collection
     */
    public function filterByStringField(string $field, $value) : Collection {
        return $this->filter(function($i) use($field, $value) {
            return (strcasecmp($i->getData($field), $value) === 0);
        });
    }

    /**
     * @param string $field
     * @param string $regex
     * @return Collection
     */
    public function filterByRegex(string $field, string $regex) : Collection {
        return $this->filter(function($i) use($field, $regex) {
            return preg_match('/'.$regex.'/', $i->getData($field));
        });
    }

    /**
     * @param int $id
     * @return Collection
     */
    public function filterById(int $id): Collection
    {
        return $this->filter(function($i) use($id) {
            return (int)$i->getId() === $id;
        });
    }

    /**
     * @param array $ids
     * @param bool $asInt
     * @return Collection
     */
    public function filterByIds(array $ids, bool $asInt = false) : Collection {
        return $this->filter(function($i) use($ids, $asInt) {
            $id = $i->getId();
            if($asInt) {
                $id = (int) $id;
            }

            return in_array($id, $ids);
        });
    }

    /**
     * @param callable $reducer
     * @return Collection
     */
    public function reduce(Callable $reducer, $collectionModel = null) : Collection {
        $results = [];
        foreach($this->getItems() as $item) {
            if($mapped = $reducer($item)) {
                if($mapped instanceof Collection) {
                    $results = array_merge($results, $mapped->getItemsAsArray());
                }
            }
        }
        return new Collection($results, $collectionModel ?? Base::class );
    }


    /**
     * @param Collection $newItems
     * @return Collection
     */
    public function merge(Collection $newItems) : Collection {
        return new Collection(
            array_merge($this->getItemsAsArray(), $newItems->getItemsAsArray()),
            $this->collectionModel
        );
    }

    /**
     * @param $map
     * @return array
     */
    public function map($map) : array {
        $mapped = [];
        foreach ($this->getItems() as $item) {
            $data = $item->getData();
            if(is_array($map)) {
                foreach($map as $k => $m) {
                    $newItem = [];
                    if(isset($data[$k])) {
                        $newItem[$m] = $data[$k];
                    }
                    $mapped[] = $newItem;
                }
            }
            elseif(is_string($map)) {
                $mapped[] = $item->getData($map);
            }
        }
        return $mapped;
    }

    /**
     * @param string $field
     * @param $default
     * @return array
     */
    public function getValues(string $field, $default=null) : array {
        $values = [];
        foreach($this->getItems() as $item) {
            $value = $item->getData($field, $default);
            if($value) {
                $values[] = $value;
            }
        }
        return $values;
    }

    /**
     * @return array
     */
    public function jsonSerialize() : array
    {
        return $this->getItemsAsArray();
    }
}
