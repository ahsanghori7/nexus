<?php


namespace Email\Model;

use Email\Model\Abstraction as AbstractModel;

class UserSettingsKey extends AbstractModel
{

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'user_settings_key';

    /**
     * @var string
     */
    protected $connection = "account_service";

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true
        ],
        "label" => [
            'type' => 'string',
            'required' => true
        ],
        "group" => [
            "type" => "string",
            "required" => true
        ],
    ];
}
