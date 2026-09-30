<?php
declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;

/**
 * Class Account
 * @package App\Domain\Account
 */
class AccountPrequalificationStatus extends AbstractTypeModel
{
    /**
     * @var array
     */
    protected $columns = [
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
        "status" => [
            "type" => 'int',
            "required" => true
        ],
        "section_id" => [
            "type" => 'int',
            "required" => true
        ],
        "section_message" => [
            "type" => 'string',
            "required" => false
        ],
    ];
}
