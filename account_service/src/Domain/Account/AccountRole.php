<?php

declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractTypedModel;

class AccountRole extends AbstractTypedModel
{
    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'account_role';

    protected $fillable = [
    'account_id',
    'role_id',
    'label',
    'description'
    ];

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
      'role_id' => [
        'type' => 'int',
        'required' => true
      ],
      'label' => [
        'type' => 'string',
        'required' => true
      ],
      'description' => [
        'type' => 'string',
        'required' => true
      ]
    ];

    public function labelExistsForAccount(int $accountId, string $label, ?int $excludeId = null): bool
    {
        if (!method_exists($this->getDB(), 'getRow')) {
            return false;
        }

        $query = 'SELECT id FROM account_role WHERE account_id = ? AND LOWER(label) = LOWER(?)';
        $bindings = [$accountId, $label];

        if ($excludeId !== null) {
            $query .= ' AND id != ?';
            $bindings[] = $excludeId;
        }

        $row = $this->getDB()::getRow($query, $bindings);

        return !empty($row);
    }

    public function getWhereIn(string $column, array $values)
    {
        if (empty($values)) {
            return [];
        }
        $data = [];
        $placeholders = implode(',', array_fill(0, count($values), '?'));
        if (method_exists($this->getDb(), 'getAll')) {
            $data = $this->getDb()::getAll(
                sprintf('SELECT id, label, description, role_id as user_type_id FROM %s WHERE %s in (%s)', $this->getName(), $column, $placeholders),
                $values
            );
        }
        return $data;
    }

    public function getUserAccountRole(int $userId)
    {
        if (method_exists($this->getDb(), 'getAll')) {
            $data = $this->getDb()::getAll(
                sprintf('SELECT
                        *
                      FROM
                        account_role ar
                      JOIN account_role_user_mapping arum ON
                        ar.id = arum.account_role_id
                      WHERE
                        arum.user_id = %s;', $userId)
            );
        }
        return $data;
    }

    public function getUsersWithAccountRole(array $userIds)
    {
        if (method_exists($this->getDb(), 'getAll')) {
            $data = $this->getDb()::getAll(
                sprintf('SELECT
                        u.id,
                        u.firstname,
                        u.lastname,
                        u.email,
                        u.account_id,
                        ar.id as account_role_id,
                        ar.label as account_role_label,
                        ar.description as account_role_description,
                        r.id as user_type_id,
                        r.label as user_type_label,
                        r.display_label as user_type_display_label
                      FROM
                        user u
                      JOIN account_role_user_mapping arum ON
                        u.id = arum.user_id
                      JOIN account_role ar ON
                        ar.id = arum.account_role_id
                      LEFT JOIN role r ON
                        r.id = ar.role_id
                      WHERE
                        arum.user_id IN (%s);', implode(',', $userIds))
            );
        }
        return $data;
    }

    public function getUserAccountRoleWithPermissions(int $userId): ?array
    {
        if (!method_exists($this->getDb(), 'getAll')) {
            return null;
        }

        $rows = $this->getDb()::getAll(
            'SELECT
              ar.id,
              ar.account_id,
              ar.role_id,
              ar.label,
              ar.description,
              r.id as user_type_id,
              r.label as user_type_label,
              p.id           AS permission_id,
              p.key          AS permission_key,
              p.label        AS permission_label,
              p.permission_type_id
           FROM account_role ar
           JOIN account_role_user_mapping arum ON ar.id = arum.account_role_id
           JOIN role r ON ar.role_id = r.id
           LEFT JOIN permission_mappings pm    ON ar.id = pm.account_role_id
           LEFT JOIN permission p             ON pm.permission_id = p.id
           WHERE arum.user_id = ?',
            [$userId]
        );

        if (empty($rows)) {
            return null;
        }

        $first = $rows[0];
        $result = [
            'id'          => (int) $first['id'],
            'account_id'  => (int) $first['account_id'],
            'user_type_id' => (int) $first['user_type_id'],
            'user_type_label' => $first['user_type_label'],
            'role_id'     => (int) $first['role_id'],
            'label'       => $first['label'],
            'description' => $first['description'],
            'permissions' => [],
        ];

        foreach ($rows as $row) {
            if ($row['permission_id'] !== null) {
                $result['permissions'][] = [
                    'id'                 => (int) $row['permission_id'],
                    'key'                => $row['permission_key'],
                    'label'              => $row['permission_label'],
                    'permission_type_id' => $row['permission_type_id'] !== null
                                                ? (int) $row['permission_type_id']
                                                : null,
                ];
            }
        }

        return $result;
    }

}
