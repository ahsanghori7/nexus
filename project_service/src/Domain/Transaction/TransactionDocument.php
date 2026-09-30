<?php

declare(strict_types=1);

namespace App\Domain\Transaction;

use App\Domain\AbstractModel;

class TransactionDocument extends AbstractModel
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
    protected $table = 'transaction_document';

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'transaction_id',
        'quote_version',
        'name',
        's3_key'
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
        'quote_version' => [
            'type' => 'int',
            'required' => true
        ],
        'name' => [
            'type' => 'string',
            'required' => true
        ],
        's3_key' => [
            'type' => 'string',
            'required' => true
        ],
    ];
}
