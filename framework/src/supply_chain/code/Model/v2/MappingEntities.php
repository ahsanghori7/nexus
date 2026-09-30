<?php

namespace SupplyChain\Model\v2;

use SupplyChain\Model\Abstraction as AbstractModel;
use SupplyChain\Middleware\v2\SupplyChainMiddleware as SupplyChainMiddlewarev2;

class MappingEntities extends AbstractModel
{

    /**
     * @var string
     */
    protected $table = 'attribute';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'label',
        'attribute_type_id'
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function type(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(MappingType::class, "id", "attribute_type_id");
    }

    /**
     * @param mixed $ids
     * @return bool
     * @throws \Exception
     */
    public static function isListOfValidIdsByTradeIds(mixed $ids) : bool {

        $collection = self::getInstance()->getAll();

        if(is_array($ids) && !empty($ids)) {
            foreach($ids as $value) {
                $id = (int) $value;
                if(!$id) {
                    throw new \Exception("Id not int");
                }

                $collection = $collection->filterByField("attribute_type_id", 1);
                if($isId = $collection->count()) {
                    $isId = $collection->filterByField("id", $id)->count();
                }

                if($isId === 0) {
                    throw new \Exception("Invalid $id not found");
                }
            }
            return true;
        }
        throw new \Exception("Ids not Array or empty");
    }

    /**
     * @param mixed $ids
     * @return bool
     * @throws \Exception
     */
    public static function isListOfValidIdsByRegionsIds(mixed $ids) : bool {

        $collection = self::getInstance()->getAll();

        if(is_array($ids) && !empty($ids)) {
            foreach($ids as $value) {
                $id = (int) $value;
                if(!$id) {
                    throw new \Exception("Id not int");
                }

                $collection = $collection->filterByField("attribute_type_id", 2);
                if($isId = $collection->count()) {
                    $isId = $collection->filterByField("id", $id)->count();
                }

                if($isId === 0) {
                    throw new \Exception("Invalid $id not found");
                }
            }
            return true;
        }
        throw new \Exception("Ids not Array or empty");
    }
}
