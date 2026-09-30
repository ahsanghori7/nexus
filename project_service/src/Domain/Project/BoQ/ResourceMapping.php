<?php

declare(strict_types=1);

namespace App\Domain\Project\BoQ;

use App\Domain\AbstractModel;

class ResourceMapping extends AbstractModel
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
    protected $table = 'boq_resource_mapping';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'boq_resource_id',
        'boq_id',
        'boq_resource_type_id',
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'boq_id' => [
            'type' => 'int',
            'required' => true
        ],
        'boq_resource_id' => [
            'type' => 'int',
            'required' => true
        ],
        'boq_resource_type_id' => [
            'type' => 'int',
            'required' => false
        ]
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function resourceVersion(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(ResourceVersion::class, "id", "boq_resource_mapping_id");
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function resourceData(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Resource::class, "id", "boq_resource_id");
    }
}
