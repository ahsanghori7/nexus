<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;

class DocumentRequestMapping extends AbstractModel
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
    protected $table = 'document_request_mapping';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'request_id',
        'document_id'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'request_id' => [
            'type' => 'int',
            'required' => true
        ],
        'document_id' => [
            'type' => 'int',
            'required' => true
        ]
    ];

}
