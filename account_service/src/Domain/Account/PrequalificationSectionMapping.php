<?php

declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;

/**
 * Class Account
 * @package App\Domain\Account
 */
class PrequalificationSectionMapping extends AbstractTypeModel
{
    /**
     * @var array
     */
    protected $columns = [
        "id" => [
            "type" => 'int',
            "required" => true
        ],
        'parent_id' => [
            'type' => 'int',
            'required' => true
        ],
        'section_id' => [
            'type' => 'int',
            'required' => true
        ],
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
        "status" => [
            "type" => 'string',
            "required" => true
        ],
        "created_at" => [
            "type" => 'string',
            "required" => false
        ],
        "updated_at" => [
            "type" => 'string',
            "required" => false
        ],
    ];
}
