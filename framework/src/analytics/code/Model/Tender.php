<?php

declare(strict_types=1);

namespace Analytics\Model;

use Analytics\Model\Abstraction as AbstractModel;

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
     * @var string
     */
    protected $connection = "project_service";

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'project_id',
        'label',
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
        'published_at'
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
        'budget' => [
            'type' => 'budget',
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
        ]
    ];


    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function history(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TenderHistory::class, "tender_id");
    }
}
