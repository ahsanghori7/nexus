<?php
declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;

/**
 * Class Account
 * @package App\Domain\Account
 */
class AccountOrganisation extends AbstractTypeModel
{

    /**
     * @var array
     */
    protected $columns = [
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
        "title" => [
            "type" => 'string',
            "required" => true
        ],
        'fullname' => [
            'type' => 'string',
            'required' => true
        ],
        "email" => [
            "type" => 'string',
            "required" => true
        ],
    ];
}
