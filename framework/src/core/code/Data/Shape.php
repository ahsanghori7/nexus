<?php

namespace Core\Data;

use Core\Data\Shape\Value;
use Core\Data\Shape\Mixin;

class Shape implements \JsonSerializable, \Countable
{
    /**
     * @var array<string, mixed>
     */
    protected array $data = [];

    /**
     * @var array<string, Mixin>
     */
    protected array $mixins = [];

    /**
     * @param array<string, mixed>|Shape $data
     * @param array<string, Mixin> $mixins
     * @throws \Exception
     */
    public function __construct(array|Shape $data = [], array $mixins = []) {
        if(is_object($data)) {
            if(is_a($data, Shape::class)) {
                $data = $data->toArray();
            }
        }
        $this->setMixins($mixins);
        $this->setItems($data);
    }

    /**
     * @param string $key
     * @return Shape
     * @throws \Exception
     */
    public function getShape(string $key) : Shape {
        $data = $this->get($key, new Shape());
        if(is_object($data) && is_a($data, Shape::class)) {
            return $data;
        }

        if(is_null($data)) {
            $data = [];
        }

        return new Shape(
            is_array($data) ? $data : [$key => $data]
        );
    }

    /**
     * @param string $key
     * @param array $data
     * @return $this
     */
    public function setShape(string $key, array $data) {
        $this->set($key, new Shape($data));
        return $this;
    }

    /**
     * @param string $k
     * @param string|null $class
     * @return Collection
     * @throws \Exception
     */
    public function getCollection(string $k, string $class = null) : Collection {

        $data = $this->get($k);
        if(is_object($data) && is_a($data, Collection::class)) {
            return $data;
        }

        if(is_object($data) && is_a($data, Shape::class)) {
            $data = $data->toArray();
        }

        if(!is_array($data)) {
            throw new \Exception("Collections require array");
        }

        return new Collection($data, is_string($class) ? $class : self::class);
    }

    /**
     * @param string $k
     * @param callable $func
     * @return $this
     * @throws \Exception
     */
    public function modify($k, callable $func) {
        return $this->set($k, $func($this->get($k)));
    }

    /**
     * @param string $key
     * @param array $values
     * @return $this
     */
    public function updateShape(string $key, array $values) {
        $shape = $this->getShape($key);
        $shape->setItems($values);
        return $this->set($key, $shape);
    }

    /**
     * @param string $k
     * @param string|null $class
     * @return Shape
     * @throws \Exception
     */
    public function updateCollection(string $k, callable $func, string $class = null) : Shape {
        $collection = $this->getCollection($k);
        return $this->set($k, $collection->modify($func));

    }

    /**
     * @param string $key
     * @return array
     * @throws \Exception
     */
    public function getShapeArray(string $key) : array
    {
        $items = $this->get($key);
        if (is_array($items)) {
            $res = [];
            foreach ($items as $i => $item) {
                $res[$i] = new Shape($item);
            }
            return $res;
        }
        throw new \Exception("Shape Array requires source array");
    }

    /**
     * @param string|null $key
     * @param mixed|null $default
     * @return mixed
     */
    public function get(string $key = null, mixed $default = null) : mixed {
        if($key) {
            if(strpos($key, ".")) {
                $data = $this->getRecursive(explode(".", $key)) ?? $default;
            }
            else {
                $data = $this->data[$key] ?? $default;
            }

            if(isset($this->mixins[$key])) {
                $data = $this->mixins[$key]->get($data, $this);
            }
            return $data;
        }

        return $this->data;
    }


    /**
     * @param array<string> $keys
     * @return mixed
     */
    public function getRecursive(array $keys) : mixed {
        $item = $this->data[$keys[0] ?? ""] ?? null;
        for($i=1;$i<count($keys);$i++) {
            $key = $keys[$i] ?? null;
            if($item && $key) {
                if($item instanceof Shape) {
                    $item = $item->get($key);
                }
                elseif(is_array($item)) {
                    $item = $item[$key] ?? null;
                }
                else {
                    $item = null;
                }
            }
        }
        return $item;
    }

    /**
     * @param string $key
     * @param mixed $data
     * @param bool $append
     * @return $this
     */
    public function set(string $key, mixed $data, bool $append = false) : Shape {
        $setter = "set" . ucwords(strtolower($key));
        if(isset($this->mixins[$key])) {
            $data = $this->mixins[$key]->set($data, $this);
        }
        if(method_exists($this, $setter)) {
            $this->data[$key] = $this->$setter($data);
        }
        else {
            if($append && isset($this->data[$key])){
                if(is_array($this->data[$key]) && is_array($data)) {
                    $this->data[$key] = array_merge($this->data[$key], $data);
                }else{
                    $this->data[$key] += $data;
                }
            }else{
                $this->data[$key] = $data;
            }
        }
        return $this;
    }

    /**
     * @param array<string, mixed> $items
     * @return void
     */
    public function setItems(array $items) {
        foreach($items as $k => $v) {
            $this->set($k, $v);
        }
    }

    /**
     * @param string $k
     * @return Value
     */
    public function value(string $k) : Value {
        return new Value($this->get($k));
    }

    /**
     * @param array<string, Mixin> $mixins
     * @return $this
     * @throws \Exception
     */
    public function setMixins(array $mixins) : Shape {
        foreach($mixins as $k => $mixin) {
            if($mixin instanceof Mixin) {
                $this->mixins[$k] = $mixin;
            }
            else {
                throw new \Exception("Invalid data mixin provided");
            }
        }
        return $this;
    }

    /**
     * @param string $key
     * @return bool
     */
    public function has(string $key) : bool {
        if(strpos($key, ".")) {
            $root = $this->data;
            foreach(explode(".", $key) as $i) {
                if(!is_array($root) || !isset($root[$i])) {
                    return false;
                }
                $root = $root[$i];
            }
            return true;
        }

        return isset($this->data[$key]);
    }

    /**
     * @param string $key
     * @param mixed $value
     * @return bool
     */
    public function valueIs(string $key,  mixed $value)  : bool {
        if($this->has($key)) {
            return ($this->get($key) === $value);
        }
        return false;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray() : array {
        return $this->data;
    }

    /**
     * @param string $k
     * @param string $default
     * @return string
     */
    public function string(string $k, string $default = "") : string {
        $value = $this->get($k);
        return is_string($value) ? $value : $default;
    }

    /**
     * @param string $k
     * @param int $default
     * @return int
     */
    public function int(string $k, int $default = 0) : int {
        $value = $this->get($k);
        return is_int($value) ? $value : intval($value);
    }

    /**
     * @param string $k
     * @return array
     * @throws \Exception
     */
    public function getArray(string $k) : array {
        $data = $this->get($k, []);
        if(!is_array($data)) {
            throw new \Exception("Invalid data key $k, array not found");
        }
        return $data;
    }


    /**
     * @param array<int|string,string> $keys
     * @return Shape
     * @throws \Exception
     */
    public function keys(array $keys) : Shape {
        $values = [];
        foreach($keys as $k => $map) {
            $key = is_int($k) ? $map : $k;
            if(is_string($map)) {
                $values[$map] = $this->get($key);
            }
        }
        return new Shape($values);
    }

    /**
     * @return bool
     */
    public function hasData() : bool
    {
        return (count($this->data) > 0);
    }

    /**
     * @param Shape $shape
     * @return $this
     */
    public function merge(Shape $shape) : Shape {
        foreach($shape->toArray() as $k => $v) {
            $this->set($k, $v);
        }
        return $this;
    }

    /**
     * @param string $k
     * @return mixed
     */
    public function json(string $k) : mixed {
        return json_decode($this->string($k), true);
    }

    /**
     * @param string $k
     * @return Shape
     * @throws \Exception
     */
    public function jsonDecode(string $k) : Shape {
        $data = json_decode($this->string($k), true);
        return new Shape(
            is_array($data) ? $data : [
                "error" => [
                    "message" => json_last_error_msg(),
                    "code"    => json_last_error()
                ]
            ]
        );
    }

    /**
     * @return string
     */
    public function jsonEncode() : string {
        $json = json_encode($this->data);
        return is_string($json) ? $json : "";
    }

    /**
     * @return mixed
     */
    public function jsonSerialize() : mixed {
        return $this->data;
    }

    /**
     * @param string $key
     * @return mixed
     */
    public function extract(string $key) : mixed {
        $child = null;
        if(isset($this->data[$key])) {
            $child = $this->data[$key];
            unset($this->data[$key]);
        }
        return $child;
    }

    /**
     * @param string $key
     * @param mixed $value
     * @return $this
     * @throws \Exception
     */
    public function append(string $key, mixed $value) : Shape {
        $items = $this->get($key, []);
        if(!is_array($items)) {
            throw new \Exception("Key $key must be an array or empty: " . gettype($items) . " found");
        }
        $items[] = $value;
        $this->set($key, $items);
        return $this;
    }

    /**
     * @return int
     */
    public function count() : int
    {
        return count($this->data);
    }
}
