<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;

class DocumentDefaultCertificates extends AbstractModel
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
    protected $table = 'document_default_certificates';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'subtype',
        'parent_id',
        'name'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'subtype' => [
            'type' => 'int',
            'required' => true
        ],
        'parent_id' => [
            'type' => 'int',
            'required' => true
        ],
        'name' => [
            'type' => 'string',
            'required' => true
        ]
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function documentSubType(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(DocumentSubType::class, 'id', 'subtype');
    }
}
