<?php

namespace SupplyChain\Model\v2;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use SupplyChain\Model\Abstraction as AbstractModel;

class Mapping extends AbstractModel
{

    /**
     * @var string
     */
    protected $table = 'account_attribute_mapping';

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
        'account_id',
        'group_id',
        'attribute_id'
    ];

    /**
     * @return HasOne
     */
    public function entity(): HasOne
    {
        return $this->hasOne(MappingEntities::class, "id", "attribute_id");
    }

}
