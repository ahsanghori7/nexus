<?php

declare(strict_types=1);

namespace App\Domain\Project\BoQ;

use App\Domain\AbstractModel;

class ItemMapping extends AbstractModel
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
    protected $table = 'boq_item_mapping';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'boq_entity_id',
        'parent_id',
        'type',
        'unit_id',
        'item_no',
        'description',
        'quantity',
        'budget_rate',
        'budget_total',
        'tenderee_note',
        'position',
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
        'type' => [
            'type' => 'string',
            'required' => false
        ],
        'parent_id' => [
            'type' => 'int',
            'required' => true
        ],
        'unit_id' => [
            'type' => 'int',
            'required' => true
        ],
        'item_no' => [
            'type' => 'string',
            'required' => true
        ],
        'description' => [
            'type' => 'string',
            'required' => true
        ],
        'quantity' => [
            'type' => 'decimal',
            'required' => true
        ],
        'budget_rate' => [
            'type' => 'decimal',
            'required' => false
        ],
        'budget_total' => [
            'type' => 'decimal',
            'required' => false
        ],
        'tenderee_note' => [
            'type' => 'string',
            'required' => false
        ],
        'position' => [
            'type' => 'int',
            'required' => false
        ]
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function item(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function itemVersion(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(ItemVersion::class, "id", "boq_item_mapping_id");
    }
}
