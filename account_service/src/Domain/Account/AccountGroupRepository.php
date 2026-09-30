<?php

namespace App\Domain\Account;

use App\Domain\AbstractRepository;
use Exception;

class AccountGroupRepository extends AbstractRepository
{
    const DEFAULT_MODEL = "group";

    protected $models = [
        "group" => AccountGroup::class
    ];

    public function getByAccountId(int $accountId): array
    {
        $model = $this->getModel("group");
        $query = sprintf(
            "SELECT id,label,logo,address FROM %s
            WHERE account_id = ?
            ORDER BY label ASC",
            $model->getName()
        );

        return $model->getDB()::getAll($query, [$accountId]);
    }

    public function assignUserToGroupMapping(int $userId, array $groupIds): bool
    {
        try {
            $model = new AccountGroupUserMapping();
            foreach ($groupIds as $groupId) {
                $exists = $model->getDB()::getCell(
                    "SELECT id FROM account_group_user_mapping WHERE user_id = ? AND account_group_id = ?",
                    [$userId, (int)$groupId]
                );

                if (!$exists) {
                    $model->save([
                        'user_id' => $userId,
                        'account_group_id' => (int)$groupId
                    ]);
                }
            }
        } catch (Exception $e) {
            return false;
        }

        return true;
    }

    public function updateUserGroupMapping(int $userId, array $groupIds): bool
    {
        $model = new AccountGroupUserMapping();
        $model->getDB()::exec(
            "DELETE FROM account_group_user_mapping WHERE user_id = ?",
            [$userId]
        );

        return $this->assignUserToGroupMapping($userId, $groupIds);
    }

    public function deleteUserGroupMapping(int $userId, int $groupId): int
    {
        $model = new AccountGroupUserMapping();
        return $model->getDB()::exec(
            "DELETE FROM account_group_user_mapping WHERE user_id = ? and account_group_id = ?",
            [$userId, $groupId]
        );
    }

    public function getGroupsByUserId(int $userId): array
    {
        $model = new AccountGroupUserMapping();

        $query = "
            SELECT g.id, g.label
            FROM account_group_user_mapping m
            INNER JOIN account_group g
                ON g.id = m.account_group_id
            WHERE m.user_id = ?
        ";

        return $model->getDB()::getAll($query, [$userId]);
    }
}
