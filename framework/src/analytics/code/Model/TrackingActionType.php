<?php

namespace Analytics\Model;

use Analytics\Model\Abstraction as AbstractModel;

class TrackingActionType extends AbstractModel
{
    /**
     * @var string
     */
    protected $table = 'account_action_type';

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
     * @var string
     */
    protected $connection = "account_service";
}
