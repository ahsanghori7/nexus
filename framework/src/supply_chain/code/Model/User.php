<?php

namespace SupplyChain\Model;

use SupplyChain\Model\Abstraction as AbstractModel;

class User extends AbstractModel
{
    /**
     * @var string
     */
    protected $table = 'user';

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
        'firstname',
        'lastname',
        'display_name',
        'email',
        'password',
        'type_id',
        'contact_number',
        'meta'
    ];
}
