<?php
declare(strict_types=1);

namespace App\Domain\User;

use App\Domain\AbstractModel;

class RoleMappings extends AbstractModel
{
    protected $columns = [
        'user_id' => [
            'type' => 'int',
            'required' => true
        ],
        'role_id' => [
            'type' => 'int',
            'required' => true
        ]
    ];
}
