<?php


namespace App\Domain\User;

use \App\Domain\AbstractTypeModel as ATM;

/**
 * Class Role
 * @package App\Domain\User
 */
class Role extends ATM
{
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'label' => [
            'type' => 'string'
        ],
        'level' => [
            'type' => 'int'
        ],
        'display_label' => [
            'type' => 'string'
        ],
        'is_contractor_user_type' => [
            'type' => 'bool'
        ],
        'is_external' => [
            'type' => 'bool'
        ]
    ];

    public function getWhereIn(string $column, array $values)
    {
        if (count($values) === 0) {
            return [];
        }
        $data = [];
        $placeholders = implode(',', array_fill(0, count($values), '?'));
        if (method_exists($this->getDb(), 'getAll')) {
            $data = $this->getDb()::getAll(
                sprintf('SELECT * FROM %s WHERE %s in (%s)', $this->getName(), $column, $placeholders),
                $values
            );
        }
        return $data;
    }
}
