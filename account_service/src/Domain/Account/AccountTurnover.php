<?php
declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;

/**
 * Class Account
 * @package App\Domain\Account
 */
class AccountTurnover extends AbstractTypeModel
{

    /**
     * @var array
     */
    protected $columns = [
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
        "year" => [
            "type" => 'string',
            "required" => true
        ],
        'value' => [
            'type' => 'string',
            'required' => false
        ],
        "active_trading" => [
            "type" => 'int',
            "required" => true
        ],
        "profit_before_tax" => [
            "type" => 'int',
            "required" => true
        ],
    ];
}
