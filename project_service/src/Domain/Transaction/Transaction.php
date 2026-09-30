<?php

declare(strict_types=1);

namespace App\Domain\Transaction;

use App\Domain\AbstractModel;
use App\Domain\Project\BoQ\QuoteItem;
use App\Domain\Project\Project;
use App\Domain\Project\Tender;

class Transaction extends AbstractModel
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
    protected $table = 'transaction';

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'tender_id',
        'subcontractor_id',
        'type_id',
        'compliant',
        'price',
        'forecast',
        'price_selected',
        'measured_work',
        'prelims',
        'other_items',
        'programme',
        'order_number',
        'quote_created',
        'order_price',
        'order_created',
        'order_updated',
        'note',
        'source',
        'uploaded_by_user_id',
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'tender_id' => [
            'type' => 'int',
            'required' => true
        ],
        'subcontractor_id' => [
            'type' => 'int',
            'required' => true
        ],
        'type_id' => [
            'type' => 'int',
            'required' => false
        ],
        'compliant' => [
            'type' => 'int',
            'required' => false
        ],
        'price' => [
            'type' => 'int',
            'required' => true
        ],
        'forecast' => [
            'type' => 'int',
            'required' => false
        ],
        'price_selected' => [
            'type' => 'int',
            'required' => true,
            'default' => 0
        ],
        'measured_work' => [
            'type' => 'int',
            'required' => true
        ],
        'prelims' => [
            'type' => 'int',
            'required' => true
        ],
        'other_items' => [
            'type' => 'int',
            'required' => true
        ],
        'programme' => [
            'type' => 'string',
            'required' => true
        ],
        'status_id' => [
            'type' => 'id',
            'required' => true
        ],
        'meta' => [
            'type' => 'string',
            'required' => false
        ],
        'note' => [
            'type' => 'string',
            'required' => false
        ],
        'quote_created' => [
            'type' => 'string',
            'required' => false
        ],
        "order_number" => [
            'type' => 'string',
            'required' => false
        ],
        "order_price" => [
            'type' => 'int',
            'required' => false
        ],
        'order_created' => [
            'type' => 'string',
            'required' => false
        ],
        'order_updated' => [
            'type' => 'string',
            'required' => false
        ],
        'source' => [
            'type' => 'string',
            'required' => false
        ],
        'uploaded_by_user_id' => [
            'type' => 'int',
            'required' => false
        ],
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function tender(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tender::class, "tender_id");
    }

    public function quote(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(QuoteItem::class, "transaction_id");
    }

    public function document(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TransactionDocument::class, "transaction_id");
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function project(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Project::class, "project_id");
    }

    /**
     * @param int $pid
     * @return mixed
     */
    public function getLatestQuotes(int $pid)
    {
        /*
         * We need to get the latest transactions for a project
         * If a subcontractor sends multiple quotes to the same package we need to get the latest id
         */
        return $this->selectRaw('subcontractor_id,tender_id, MAX(transaction.id) as last_id, t.*')
            ->leftJoin('tender as t', 't.id', '=', 'transaction.tender_id')
            ->groupBy(['subcontractor_id', 'tender_id'])
            ->where('t.project_id', $pid);
    }
}
