<?php

declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractModel;

class Instruction extends AbstractModel
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
    protected $table = 'instruction';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'transaction_id',
        'type_id',
        'price',
        'description',
        'status',
        'date',
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'transaction_id' => [
            'type' => 'int',
            'required' => true
        ],
        'type_id' => [
            'type' => 'int',
            'required' => true
        ],
        'price' => [
            'type' => 'int',
            'required' => false
        ],
        'description' => [
            'type' => 'string',
            'required' => true
        ],
        'status' => [
            'type' => 'int',
            'required' => true
        ],
        'date' => [
            'type' => 'string',
            'required' => true
        ]
    ];
}
