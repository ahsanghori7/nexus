<?php

declare(strict_types=1);

namespace App\Domain\Project\BoQ;

use App\Domain\AbstractModel;

class ItemVersion extends AbstractModel
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
    protected $table = 'boq_item_version';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'boq_item_mapping_id',
        'version',
        'status'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'boq_item_mapping_id' => [
            'type' => 'int',
            'required' => false
        ],
        'version' => [
            'type' => 'int',
            'required' => true
        ],
        'status' => [
            'type' => 'int',
            'required' => true
        ]
    ];
}
