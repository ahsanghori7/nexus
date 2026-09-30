<?php

declare(strict_types=1);

namespace App\Domain\Permission;

use App\Domain\AbstractModel;

class PermissionUserType extends AbstractModel
{
    protected $columns = [
        'id' => [
            'type' => 'int',
            'required' => true,
        ],
        'permission_id' => [
            'type' => 'int',
            'required' => true,
        ],
        'user_type_id' => [
            'type' => 'int',
            'required' => true,
        ],
        'is_checked' => [
            'type' => 'bool',
            'required' => false,
        ],
    ];
}
