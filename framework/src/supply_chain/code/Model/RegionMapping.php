<?php

namespace SupplyChain\Model;

use SupplyChain\Model\Abstraction as AbstractModel;

class RegionMapping extends AbstractModel
{

    /**
     * @var string
     */
    protected $table = 'region_mapping';

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
        'region_id',
        'group_id',
        'type_id'
    ];
}
