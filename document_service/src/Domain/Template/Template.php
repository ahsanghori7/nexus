<?php

declare(strict_types=1);

namespace App\Domain\Template;

use App\Domain\AbstractModel;

class Template extends AbstractModel {

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
    protected $table = 'template';

    /**
     * The attributes that are mass assignable.
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'label',
        'type_id',
        'etag',
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
        'type_id' => [
            'type' => 'int',
            'required' => true
        ],
        'etag' => [
            'type' => 'string',
            'required' => false
        ]
    ];
}
