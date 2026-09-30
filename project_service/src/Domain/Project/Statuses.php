<?php

declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractModel;

class Statuses extends AbstractModel
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
    protected $table = 'project_entity_status';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'label',
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'label' => [
            'type' => 'string',
            'required' => true
        ]
    ];
}
