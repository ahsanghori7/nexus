<?php

namespace SupplyChain\Model;

use SupplyChain\Model\Abstraction as AbstractModel;

class Subscription extends AbstractModel
{
    /**
     * @var string
     */
    protected $table = 'subscription';

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
        'uid',
        'label',
        'price',
        'price_label',
        'interval_type',
        'interval_unit',
        'interval_amount',
        'expires',
        'website_id',
        'description',
    ];




}
