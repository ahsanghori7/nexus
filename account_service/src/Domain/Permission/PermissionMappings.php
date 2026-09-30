<?php

declare(strict_types=1);

namespace App\Domain\Permission;

use App\Domain\AbstractModel;

/**
 * Class PermissionMappings
 * @package App\Domain\Threshold
 */
class PermissionMappings extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true,
        ],
        'user_id' => [
            'type' => 'int',
            'required' => false,
        ],
        'account_role_id' => [
            'type' => 'int',
            'required' => false,
        ],
        'permission_id' => [
            'type' => 'int',
            'required' => true,
        ],
    ];
}
