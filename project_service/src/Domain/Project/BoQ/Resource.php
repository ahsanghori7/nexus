<?php

declare(strict_types=1);

namespace App\Domain\Project\BoQ;

use App\Domain\AbstractModel;

class Resource extends AbstractModel
{
    protected $hidden = [
        'laravel_through_key'
    ];

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
    protected $table = 'boq_resource';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'text',
        'id_account'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'text' => [
            'type' => 'string',
            'required' => false
        ],
        'id_account' => [
            'type' => 'string',
            'required' => false
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
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function resourceMappings(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ResourceMapping::class, "boq_resource_id");
    }
}
