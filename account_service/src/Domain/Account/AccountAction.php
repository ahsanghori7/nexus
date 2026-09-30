<?php

declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;
use App\Infrastructure\Persistence\DB;
use DateTime;
use DateTimeZone;

class AccountAction extends AbstractTypeModel
{
    // protected DB $db;
    protected string $table = 'account_action';

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
        'related_account_id' => [
            'type' => 'int',
            'required' => true
        ],
        'account_user_id' => [
            'type' => 'int',
            'required' => true
        ],
        'related_account_user_id' => [
            'type' => 'int',
            'required' => false
        ],
        'action_type' => [
            'type' => 'int',
            'required' => true
        ],
        'description' => [
            'type' => 'string'
        ],
        'action_date' => [
            'type' => 'date'
        ]
    ];

    public function fetchAllActions(): array
    {
        $query = "
            SELECT
                aa.id,
                aa.account_id,
                aa.related_account_id,
                aa.account_user_id,
                aa.related_account_user_id,
                aat.label AS action_type,
                aa.description,
                aa.action_date
            FROM account_action aa
            LEFT JOIN account_action_type aat
                ON aa.action_type = aat.id
            ORDER BY aa.action_date DESC
        ";

        return $this->getDB()::getAll($query);
    }

}
