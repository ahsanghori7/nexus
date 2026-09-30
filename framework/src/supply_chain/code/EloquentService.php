<?php

namespace SupplyChain;

use Core\Data\Shape;
use Core\Data\Shape\Mixin;
use Core\Layer\OutgoingInterface;
use Core\Service\ServiceAbstract;

use Illuminate\Database\Capsule\Manager as Capsule;

use SupplyChain\Model\Abstraction as AbstractModel;
use SupplyChain\Model\Subscription;
use SupplyChain\Model\SupplyChain as SupplyChainModel;
use SupplyChain\Model\Region as RegionModel;
use SupplyChain\Model\RegionMapping as RegionMappingModel;
use SupplyChain\Model\User as UserModel;
use SupplyChain\Model\Contractor as ContractorModel;
use SupplyChain\Model\Trade as TradeModel;
use SupplyChain\Model\RegionMappingType as RegionMappingTypeModel;
use SupplyChain\Model\ContractorType as ContractorTypeModel;
use SupplyChain\Model\Membership as MembershipModel;
use SupplyChain\Model\EmailLog as EmailLogModel;

use SupplyChain\Eloquent\Outgoing;

use SupplyChain\Model\v2\SupplyChain as SupplyChainModelv2;
use SupplyChain\Model\v2\SupplyChainHistory;
use SupplyChain\Model\v2\SupplyChainHistoryType;
use SupplyChain\Model\v2\SupplyChainStatusType;
use SupplyChain\Model\v2\Mapping as MappingModelv2;
use SupplyChain\Model\v2\MappingEntities as MappingEntitiesModelv2;
use SupplyChain\Model\v2\MappingType as MappingTypeModelv2;
use SupplyChain\Model\v2\Account as Accountv2;
use SupplyChain\Model\v2\AccountType as AccountTypev2;

class EloquentService extends ServiceAbstract
{

    /**
     * @var array<string, string>
     */
    protected static array $models = [

        //v2
        "supply_chain_v2"           => SupplyChainModelv2::class,
        "supply_chain_history"      => SupplyChainHistory::class,
        "supply_chain_history_type" => SupplyChainHistoryType::class,
        "supply_chain_status_type"  => SupplyChainStatusType::class,
        "mapping_v2"                => MappingModelv2::class,
        "mapping_entities_v2"       => MappingEntitiesModelv2::class,
        "mapping_type_v2"           => MappingTypeModelv2::class,
        "account_v2"                => Accountv2::class,
        "account_type_v2"           => AccountTypev2::class,

        //v1
        "supply_chain" => SupplyChainModel::class,
        "region" => RegionModel::class,
        "trade" => TradeModel::class,
        "user" => UserModel::class,
        "contractor" => ContractorModel::class,
        "contractor_type" => ContractorTypeModel::class,
        "region_mapping" => RegionMappingModel::class,
        "region_mapping_type" => RegionMappingTypeModel::class,
        "membership" => MembershipModel::class,
        "subscription" => Subscription::class,
        "email_log" => EmailLogModel::class,
    ];

    /**
     * @param array<string, mixed>|Shape $data
     * @param array<string, Mixin> $mixins
     * @throws \Exception
     */
    public function __construct(array|Shape $data, array $mixins = [])
    {
        $capsule = new Capsule;
        $capsule->addConnection(is_array($data) ? $data : $data->toArray());

        // Make this Capsule instance available globally via static methods... (optional)
        $capsule->setAsGlobal();
        // Setup the Eloquent ORM
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
    public function query(string $path): OutgoingInterface
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
    public function getModel(string $name): AbstractModel
    {
        $model = self::$models[$name] ?? "";
        if (!$model) {
            throw new \Exception("Unknown Model $name");
        }
        if (is_subclass_of($model, AbstractModel::class)) {
            return new $model();
        }
        throw new \Exception("Model $name not subclass of Abstract Model");
    }

    /**
     * @param object|string $object
     * @return bool
     */
    public function isModel(object|string $object): bool
    {
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

        if ($where) {
            $model = $model->where($where);
        }

        if (is_array($with)) {
            foreach ($with as $relation) {
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
