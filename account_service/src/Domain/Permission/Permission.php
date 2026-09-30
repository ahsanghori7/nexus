<?php

declare(strict_types=1);

namespace App\Domain\Permission;

use App\Domain\AbstractModel;

/**
 * Class Permission
 * @package App\Domain\Threshold
 */
class Permission extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true,
        ],
        'key' => [
            'type' => 'string',
            'required' => true,
        ],
        'label' => [
            'type' => 'string',
            'required' => false,
        ],
        'permission_type_id' => [
            'type' => 'int',
            'required' => false,
        ],
    ];
}
