<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;

class DocumentSignatorySigner extends AbstractModel
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
    protected $table = 'document_signatory_signer';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'signatory_id',
        'signer_user_id',
        'signer_status_id',
        'signer_updated_at'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'signatory_id' => [
            'type' => 'int',
            'required' => true
        ],
        'signer_user_id' => [
            'type' => 'int',
            'required' => true
        ],
        'signer_status_id' => [
            'type' => 'int',
            'required' => true
        ],
        'signer_updated_at' => [
            'type' => 'string',
            'required' => false
        ]
    ];

}
