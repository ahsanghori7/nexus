<?php
declare(strict_types=1);

namespace App\Domain\Project\Integration;

use App\Domain\AbstractModel;

class ProjectIntegration extends AbstractModel
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'project_integration_mapping';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'project_id',
        'provider_id',
        'integration_id',
        'integration_name',
        'integration_uri',
        'meta',
        'created_at',
        'updated_at'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'project_id' => [
            'type' => 'int',
            'required' => true
        ],
        'provider_id' => [
            'type' => 'int',
            'required' => true
        ],
        'integration_id' => [
            'type' => 'string',
            'required' => false
        ],
        'integration_name' => [
            'type' => 'string',
            'required' => false
        ],
        'integration_uri' => [
            'type' => 'string',
            'required' => false
        ],
        'meta' => [
            'type' => 'string',
            'required' => false
        ],
        'created_at' => [
            'type' => 'string',
            'required' => false
        ],
        'updated_at' => [
            'type' => 'string',
            'required' => false
        ],
    ];
}
