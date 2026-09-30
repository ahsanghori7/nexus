<?php

namespace SupplyChain\Model;

use SupplyChain\Model\Abstraction as AbstractModel;

class Contractor extends AbstractModel
{
    /**
     * @var string
     */
    protected $table = 'account';

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
        'name',
        'email',
        'address',
        'mobile',
        'reg_number',
        'type_id',
        'meta'
    ];




}
