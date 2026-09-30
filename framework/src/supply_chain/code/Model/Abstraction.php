<?php

namespace SupplyChain\Model;

use Illuminate\Database\Eloquent\Model as EloquentModel;
use Core\Data\Collection;
use Core\Data\Shape;
use Core\Data\Shape\Validation;

class Abstraction extends EloquentModel
{

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [];

    /**
     * @var array<string, array<string, mixed>>
     */
    protected static array $validationShape = [];

    /**
     * @var array<Abstraction>
     */
    protected static array $instances;

    /**
     * @return Abstraction
     */
    public static function getInstance(): Abstraction
    {
        $class = static::class;
        if(!isset(self::$instances[$class]) ) {
            self::$instances[$class] = new $class;
        }
        return self::$instances[$class];
    }

    /**
     * @param Shape $data
     * @return \Core\Data\Shape
     */
    public function validate(Shape $data) : Shape {
        $vShape = $this::$validationShape;
        if($vShape) {
            $validation = new Validation($vShape);
            return $validation->validate($data);
        }
        throw new \Exception("Failed to validate no validation shape set");
    }

    /**
     * @return Collection
     * @throws \Exception
     */
    public function getAll() : Collection {
        return new Collection($this->all()->toArray(), Shape::class);
    }

    /**
     * @param mixed $ids
     * @return bool
     * @throws \Exception
     */
    public static function isListOfValidIds(mixed $ids) : bool {

        $collection = self::getInstance()->getAll();
        if(is_array($ids) && !empty($ids)) {
            foreach($ids as $value) {
                $id = (int) $value;
                if(!$id) {
                    throw new \Exception("Id not int");
                }
                $isId = $collection->filterByField("id", $id)->count();
                if($isId === 0) {
                    throw new \Exception("Invalid $id not found");
                }
            }
            return true;
        }
        throw new \Exception("Ids not Array or empty");
    }

    /**
     * @param array<int, string> $data
     * @return array<string, mixed>
     */
    public function extract(array $data) : array {
        $item = [];
        foreach($this->fillable as $key) {
            $item[$key] = $data[$key] ?? null;
        }
        return $item;
    }
}
