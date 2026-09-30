<?php

namespace SupplyChain\Model\v2;

use SupplyChain\Model\Abstraction as AbstractModel;

class MappingType extends AbstractModel
{

    /**
     * @var string
     */
    protected $table = 'attribute_type';

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
        'label'
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function entities(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(MappingEntities::class, "attribute_type_id", "id");
    }
}
