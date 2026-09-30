<?php

declare(strict_types=1);

namespace App\Domain\Project\BoQ;

use App\Domain\AbstractModel;

class Item extends AbstractModel
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
    protected $table = 'boq_item';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'boq_entity_id',
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'boq_entity_id' => [
            'type' => 'int',
            'required' => true
        ],
        'created_at' => [
            'type' => 'string',
            'required' => false
        ],
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function entity(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Entity::class, 'boq_entity_id');
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function itemMappings(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ItemMapping::class, "boq_item_id");
    }
}
