<?php

namespace SupplyChain\Model;

use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Core\Data\Validator;
use SupplyChain\Model\Abstraction as AbstractModel;

class SupplyChain extends AbstractModel
{
    /**
     * @var array<string, array<string, mixed>>
     */
    protected static array $validationShape = [
        "name"   => ["type" => "string"],
        "email"  => ["type" => "string"],
        "number" => ["type" => "string"],
        "contractor"  => [
            "company"  => ["type" => "string"],
            "name"     => ["type" => "string"],
            "address"  => ["type" => "string"],
            "reg_number"  => ["reg_number" => "string"],
        ],
        "users"  => [
            "isArray" => [Validator::class, "isArrayWithItems"],
            "hasUser" => [
                "name"  => ["type" => "string"],
                "email" => ["type" => "string"]
            ]
        ],
        "trades"  =>  [
            "test" => [
                "areValidTradeIds" => [
                    Trade::class, "isListOfValidIds"
                ]
            ]
        ],
        "regions" =>  [
            "test" => [
                "areValidRegionIds" => [
                    Region::class, "isListOfValidIds"
                ]
            ]
        ]
    ];

    /**
     * @var string
     */
    protected $table = 'supply_chain';

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
        'parent_id',
        'child_id',
        'trade_id',
    ];

    /**
     * @return HasOne
     */
    public function contractor(): HasOne
    {
        return $this->hasOne('SupplyChain\Model\Contractor', "id", "child_id");
    }

    /**
     * @return HasOne
     */
    public function trade(): HasOne
    {
        return $this->hasOne('SupplyChain\Model\Trade', "id", "trade_id");
    }

    /**
     * @returnHasMany
     */
    public function user(): HasMany
    {
        return $this->hasMany('SupplyChain\Model\User', "account_id", "child_id");
    }
}
