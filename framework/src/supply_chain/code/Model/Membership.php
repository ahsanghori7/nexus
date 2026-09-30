<?php

namespace SupplyChain\Model;

use SupplyChain\Model\Abstraction as AbstractModel;

class Membership extends AbstractModel
{
    /**
     * @var string
     */
    protected $table = 'membership';

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
        'subscription_id',
        'meta',
    ];




}
