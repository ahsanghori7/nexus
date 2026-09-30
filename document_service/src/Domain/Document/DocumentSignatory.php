<?php

declare(strict_types=1);

namespace App\Domain\Document;

use App\Domain\AbstractModel;

class DocumentSignatory extends AbstractModel
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
    protected $table = 'document_signatory';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'document_id',
        'signatory_id'
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'document_id' => [
            'type' => 'int',
            'required' => true
        ],
        'signatory_id' => [
            'type' => 'int',
            'required' => true
        ]
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function signer(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(DocumentSignatorySigner::class, "signatory_id");
    }

}
