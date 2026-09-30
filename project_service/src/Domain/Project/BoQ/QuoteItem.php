<?php

declare(strict_types=1);

namespace App\Domain\Project\BoQ;

use App\Domain\AbstractModel;
use App\Domain\Transaction\Transaction;

class QuoteItem extends AbstractModel
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
    protected $table = 'boq_quote_item';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'boq_item_id',
        'rate',
        'custom_price',
        'transaction_id',
        'version',
        'boq_version',
        'status_id'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'boq_item_id' => [
            'type' => 'int',
            'required' => true
        ],
        'rate' => [
            'type' => 'decimal',
            'required' => true
        ],
        'custom_price' => [
            'type' => 'decimal',
            'required' => true
        ],
        'version' => [
            'type' => 'int',
            'required' => false
        ],
        'boq_version' => [
            'type' => 'int',
            'required' => false
        ],
        'status_id' => [
            'type' => 'int',
            'required' => false
        ],
        'created_at' => [
            'type' => 'string',
            'required' => true
        ],
        'updated_at' => [
            'type' => 'string',
            'required' => true
        ],
        'transaction_id' => [
            'type' => 'string',
            'required' => false
        ]
    ];


    public function transaction(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function itemMapping(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->HasOne(ItemMapping::class, "boq_item_id", "boq_item_id");
    }

}
