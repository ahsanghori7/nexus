<?php

namespace CostPlanningTool;

use Core\Data\Shape;
use Core\Data\Shape\Mixin;
use Core\Layer\OutgoingInterface;
use Core\Service\ServiceAbstract;

use CostPlanningTool\Model\Submitted;
use Illuminate\Database\Capsule\Manager as Capsule;
use CostPlanningTool\Model\Abstraction as AbstractModel;

use CostPlanningTool\Eloquent\Outgoing;

class EloquentService extends ServiceAbstract
{

    /**
     * @var array<string, string>
     */
    protected static array $models = [
        "submitted" => Submitted::class,
    ];

    /**
     * @param array<string, mixed>|Shape $data
     * @param array<string, Mixin> $mixins
     * @throws \Exception
     */
    public function __construct(array|Shape $data, array $mixins = [])
    {
        $capsule = new Capsule;
        foreach($data as $key => $value){
            $capsule->addConnection($value, $key);
        }
        //Make this Capsule instance available globally via static methods... (optional)
        $capsule->setAsGlobal();
        //Setup the Eloquent ORM
        $capsule->bootEloquent();
        parent::__construct(["connection" => $capsule], $mixins);
    }

    /**
     * @return mixed
     */
    public function beginTransaction(): mixed
    {
        $connection = $this->get("connection")->getConnection();
        $connection->beginTransaction();
        return $connection;
    }

    public function getNewRequest(string $path): OutgoingInterface
    {
        return (new Outgoing())->setPath($path);
    }

    /**
     * @param string $path
     * @return OutgoingInterface
     */
    public function query(string $path) : OutgoingInterface
    {
        return $this->getNewRequest($path);
    }


    public function getPath(string $suffix = ""): string
    {
        return $suffix;
    }

    /**
     * @param string $name
     * @return AbstractModel
     * @throws \Exception
     */
    public function getModel(string $name) : AbstractModel {
        $model = self::$models[$name] ?? "";
        if(!$model) {
            throw new \Exception("Unknown Model $name");
        }
        if(is_subclass_of($model, AbstractModel::class)) {
            return new $model();
        }
        throw new \Exception("Model $name not subclass of Abstract Model");
    }

    /**
     * @param object|string $object
     * @return bool
     */
    public function isModel(object|string $object) : bool {
        //Parameter #1 $object_or_class of function is_a expects object, object|string given.
        //which is weird as the 1 parameter is of type mixed
        // * @link https://php.net/manual/en/function.is-a.php
        // * @param object|string $object_or_class <p>
        /** @phpstan-ignore-next-line */
        return is_a($object, AbstractModel::class);
    }

    /**
     * @param string $path
     * @param array<string, mixed> $params
     * @return Shape
     * @throws \Exception
     */
    public function fetch(string $path, array $params = []): Shape
    {
        $model = $this->getModel($path);
        $where = $params["where"] ?? [];
        $with  = $params["with"]  ?? [];

        if($where) {
            $model = $model->where($where);
        }

        if(is_array($with)) {
            foreach($with as $relation) {
                $model = $model->with($relation);
            }
        }

        return new Shape([
            "results" => $model->get()->toArray()
        ]);
    }

    public function write(string $path, shape $shape): Shape
    {
        return new Shape();
    }

    public function update(string $path, shape $shape): Shape
    {
        return new Shape();
    }

    public function delete(string $path, array $params = []): Shape
    {
        return new Shape();
    }
}
