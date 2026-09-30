<?php

namespace SupplyChain\Model\v2;

use SupplyChain\Model\Abstraction as AbstractModel;

class SupplyChainStatusType extends AbstractModel
{

    /**
     * @var string
     */
    protected $table = 'supply_chain_status_type';

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
    ];
}
