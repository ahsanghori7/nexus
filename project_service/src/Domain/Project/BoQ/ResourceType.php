<?php

declare(strict_types=1);

namespace App\Domain\Project\BoQ;

use App\Domain\AbstractModel;

class ResourceType extends AbstractModel
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
    protected $table = 'boq_resource_type';

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
        ],
    ];
}
