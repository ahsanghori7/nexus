<?php

declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;

/**
 * Class Account
 * @package App\Domain\Account
 */
class PrequalificationSection extends AbstractTypeModel
{
    /**
     * @var array
     */
    protected $columns = [
        "id" => [
            "type" => 'int',
            "required" => true
        ],
        'code' => [
            'type' => 'string',
            'required' => true
        ],
        'name' => [
            'type' => 'string',
            'required' => true
        ]
    ];
}
