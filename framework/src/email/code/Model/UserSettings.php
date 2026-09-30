<?php


namespace Email\Model;

use Email\Model\Abstraction as AbstractModel;

class UserSettings extends AbstractModel
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
    protected $table = 'user_settings';

    /**
     * @var string
     */
    protected $connection = "account_service";

    /**
     * @var array
     */
    protected $columns = [
        'user_id' => [
            'type' => 'int',
            'required' => true
        ],
        "settings_key" => [
            'type' => 'string',
            'required' => true
        ],
        "settings_value" => [
            "type" => "string",
            "required" => false
        ],
        "updated_at" => [
            "type" => "date",
            "required" => false
        ],
    ];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function settingsKey(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserSettingsKey::class, "id", "settings_key");
    }
}
