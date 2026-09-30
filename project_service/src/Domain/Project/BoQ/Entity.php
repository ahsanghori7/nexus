<?php

declare(strict_types=1);

namespace App\Domain\Project\BoQ;

use App\Domain\AbstractModel;
use App\Domain\Project\Tender;

class Entity extends AbstractModel
{

    protected const ENTITY_ID = 1;

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
    protected $table = 'boq_entity';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'tender_id',
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
        'created_at' => [
            'type' => 'string',
            'required' => true
        ],
        'updated_at' => [
            'type' => 'string',
            'required' => true
        ]
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function tender(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tender::class, "tender_id");
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function entries(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Item::class, "boq_entity_id");
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasManyThrough
     */
    public function note(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(Resource::class, ResourceMapping::class, 'boq_id', 'id', 'id', 'boq_resource_id')
            ->where('boq_resource_type_id', self::ENTITY_ID);
    }
}
