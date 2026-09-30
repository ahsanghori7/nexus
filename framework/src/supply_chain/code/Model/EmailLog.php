<?php

namespace SupplyChain\Model;

use SupplyChain\Model\Abstraction as AbstractModel;

class EmailLog extends AbstractModel
{
    /**
     * @var string
     */
    protected $table = 'email_log';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'email_id',
        'user_id',
        'template',
        'send_date',
        'meta'
    ];
}
