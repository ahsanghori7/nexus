<?php

declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractModel;
use App\Domain\Project\Project;
use App\Domain\Project\Package as PackageMapping;
use App\Domain\Project\BoQ\QuoteItem;
use App\Domain\Transaction\Transaction;
use Illuminate\Database\Eloquent\Builder;

class Tender extends AbstractModel
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
    protected $table = 'tender';

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'project_id',
        'label',
        'reference_no',
        'is_custom',
        'send_date',
        'tender_return',
        'start_on_site',
        'size',
        'state',
        'service',
        'budget',
        'awarded',
        'has_document',
        'has_tender_addendum',
        'was_suggestion',
        'published_at',
        'status'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'project_id' => [
            'type' => 'int',
            'required' => true
        ],
        'label' => [
            'type' => 'string',
            'required' => true
        ],
        'reference_no' => [
            'type' => 'string',
            'required' => true
        ],
        'budget' => [
          'type' => 'budget',
          'required' => false
        ],
        'budget_updated_at' => [
          'type' => 'string',
          'required' => false
        ],
        'awarded' => [
            'type' => 'int',
            'required' => false
        ],
        'has_document' => [
          'type' => 'int',
          'required' => false
        ],
        'has_tender_addendum' => [
          'type' => 'int',
          'required' => false
        ],
        'is_custom' => [
            'type' => 'int',
            'required' => false,
            'default' => 0
        ],
        'send_date' => [
            'type' => 'string',
            'required' => true,
        ],
        'tender_return' => [
          'type' => 'string',
          'required' => true,
        ],
        'start_on_site' => [
          'type' => 'string',
          'required' => true,
        ],
        'size' => [
          'type' => 'int',
          'required' => true,
        ],
        'service' => [
          'type' => 'string',
          'required' => true,
        ],
        'state' => [
            'type' => 'int',
            'required' => false
        ],
        'was_suggestion' => [
            "type" => "int",
            'required' => false
        ],
        'published_at' => [
            "type" => "string",
            'required' => false
        ],
        'status' => [
            "type" => "enum",
            'required' => true
        ]
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function packages(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PackageMapping::class, "tender_id");
    }

  /**
   * @return \Illuminate\Database\Eloquent\Relations\HasMany
   */
    public function history(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
      return $this->hasMany(TenderHistory::class, "tender_id");
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function transaction(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
      return $this->hasMany(Transaction::class, "tender_id");
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function project(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Project::class, "project_id");
    }

    public function lastQuote(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(QuoteItem::class, "transaction_id", "id");
    }

  /**
   * @param int $pid
   * @param Builder $latestQuotes
   * @return mixed
   */
    public function getTenderQuotes(int $pid, Builder $latestQuotes)
    {
      return $this->select(['tender.*', 'transaction_history.*', 'transaction_history.quote_created as qca', 'transaction_history.order_created as oca', 'tender.id as tid'])
        ->leftJoin('transaction as transaction_history', 'tender.id', '=', 'tender_id')
        ->leftJoinSub($latestQuotes, 'transaction', static function($query){
          $query->on('transaction_history.id','transaction.last_id');
        })
        ->with("lastQuote")
        ->where('tender.project_id', $pid);
    }
}
