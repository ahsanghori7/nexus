<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;

class DocumentRequest extends AbstractModel
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
    protected $table = 'document_request';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'type',
        'subtype',
        'request_type',
        'label',
        'document_owner',
        'requestor_id',
        'requested_at',
        'request_fullfilled_at',
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'type' => [
            'type' => 'int',
            'required' => true
        ],
        'subtype' => [
            'type' => 'int',
            'required' => true
        ],
        'request_type' => [
            'type' => 'int',
            'required' => true
        ],
        'label' => [
            'type' => 'string',
            'required' => true
        ],
        'document_owner' => [
            'type' => 'id',
            'required' => true
        ],
        'requestor_id' => [
            'type' => 'id',
            'required' => true
        ],
        'requested_at' => [
            'type' => 'string',
            'required' => true
        ],
        'request_fullfilled_at' => [
            'type' => 'string',
            'required' => true
        ]
    ];

}
