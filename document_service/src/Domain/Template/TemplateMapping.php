<?php

declare(strict_types=1);

namespace App\Domain\Template;

use App\Domain\AbstractModel;
use App\Domain\Template\Template;

class TemplateMapping extends AbstractModel
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
    protected $table = 'template_mapping';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'template_id',
        "user_id"
    ];

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'template_id' => [
            'type' => 'int',
            'required' => true
        ],
        'user_id' => [
            'type' => 'int',
            'required' => true
        ]
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function templates(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Template::class, "id", "template_id");
    }
}
