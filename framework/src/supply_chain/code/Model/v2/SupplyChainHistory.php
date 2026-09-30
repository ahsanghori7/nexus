<?php

namespace SupplyChain\Model\v2;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use SupplyChain\Model\Abstraction as AbstractModel;

class SupplyChainHistory extends AbstractModel
{

    /**
     * @var string
     */
    protected $table = 'supply_chain_history';

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
        'supply_chain_id',
        'type_id',
        'value',
        'created_at',
    ];

    /**
     * @return HasOne
     */
    public function type(): HasOne
    {
        return $this->hasOne('SupplyChain\Model\v2\SupplyChainHistoryType', "id", "type_id");
    }

    /**
     * @return BelongsTo
     */
    public function supplyChain(): BelongsTo
    {
        return $this->belongsTo('SupplyChain\Model\v2\SupplyChain', 'id');
    }
}
