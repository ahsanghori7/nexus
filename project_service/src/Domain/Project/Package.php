<?php

declare(strict_types=1);

namespace App\Domain\Project;

use App\Domain\AbstractModel;

class Package extends AbstractModel
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
    protected $table = 'package_mapping';

    /**
     * The attributes that are mass assignable.
     * @var string[]
     */
    protected $fillable = [
        'package_id',
        'tender_id'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'package_id' => [
            'type' => 'int',
            'required' => true
        ],
        'tender_id' => [
            'type' => 'int',
            'required' => true
        ]
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function mapping()
    {
        return $this->belongsTo('App\Domain\Project\Tender');
    }

}
