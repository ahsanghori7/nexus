<?php
declare(strict_types=1);

namespace App\Domain\Logs;

use App\Domain\AbstractModel;

class Logs extends AbstractModel
{
    protected $table = 'logs';

    protected $fillable = [
        'user_id',
        'entity_type',
        'entity_id',
        'type',
        'meta',
        'created_at',
        'updated_at',
    ];

    /**
     * @var array
    */
    protected $columns = [
        'id' => ['type' => 'int'],
        'user_id' => ['type' => 'int', 'required' => true],
        'entity_type' => ['type' => 'string', 'required' => true],
        'entity_id' => ['type' => 'int', 'required' => true],
        'type' => ['type' => 'string', 'required' => true],
        'meta' => ['type' => 'text'],
        'created_at' => ['type' => 'datetime'],
        'updated_at' => ['type' => 'datetime'],
    ];

    public $timestamps = true;

    /**
   * Apply latest ordering
   */
    protected static function booted()
    {
        static::addGlobalScope('latest', function ($query) {
            $query->orderBy('id', 'desc');
        });
    }

}
