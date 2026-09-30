<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;

class DocumentRequestType extends AbstractModel
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
    protected $table = 'request_type';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'label'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'label' => [
            'type' => 'int',
            'required' => true
        ]
    ];

}
