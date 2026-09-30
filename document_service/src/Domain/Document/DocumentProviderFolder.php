<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;

class DocumentProviderFolder extends AbstractModel
{
    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'document_provider_folder';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'provider_id',
        'identifier',
        'folder_name',
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
        'provider_id' => [
            'type' => 'int',
            'required' => true,
            'unsigned' => true
        ],
        'identifier' => [
            'type' => 'string',
            'required' => true
        ],
        'folder_name' => [
            'type' => 'string',
            'required' => true
        ],
        'created_at' => [
            'type' => 'string',
            'required' => false
        ],
        'updated_at' => [
            'type' => 'string',
            'required' => false
        ]
    ];
}
