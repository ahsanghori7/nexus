<?php
declare(strict_types=1);

namespace App\Domain\Feature;

use App\Domain\AbstractModel;

/**
 * Class Account
 * @package App\Domain\Account
 */
class Feature extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'parent_id' => [
            'type' => 'int',
            'required' => true
        ],
        "name" => [
            "type" => 'string',
            "required" => false
        ],
    ];
}
