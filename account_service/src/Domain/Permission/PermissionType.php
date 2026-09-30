<?php

declare(strict_types=1);

namespace App\Domain\Permission;

use App\Domain\AbstractModel;

/**
 * Class PermissionType
 * @package App\Domain\Permission
 */
class PermissionType extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true,
        ],
        'label' => [
            'type' => 'string',
            'required' => true,
        ],
    ];
}
