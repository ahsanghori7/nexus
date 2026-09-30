<?php
declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypeModel;

class AccountActionType extends AbstractTypeModel
{
    protected $columns = [
        'label' => [
            'type'     => 'string',
            'required' => true,
        ],
    ];

    public function getActionTypeId(string $actionName)
    {
        $query = "SELECT id FROM account_action_type WHERE label = ?";
        $result = $this->getDB()::getRow($query, [$actionName]);
        return $result['id'] ?? null;
    }
}
