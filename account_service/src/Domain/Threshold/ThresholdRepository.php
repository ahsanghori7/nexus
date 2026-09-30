<?php

declare(strict_types=1);

namespace App\Domain\Threshold;

use App\Domain\AbstractRepository;

class ThresholdRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "approval_thresholds";

    /**
     * @var string[]
     */
    protected $models = [
        "approval_thresholds" => ApprovalThresholds::class,
        "approval_thresholds_user_mapping" => ApprovalThresholdsUserMapping::class,
    ];

    /**
     * @param int $accountId
     * @return array
     * @throws \Exception
     */
    public function getThresholds(int $accountId = 0): array
    {
        $model = $this->getModel();
        $query = sprintf("SELECT * FROM %s WHERE account_id = ? ORDER BY from_value ASC", $model->getName());
        $results = [];
        if (method_exists($model->getDB(), 'getAll')) {
            $results = $model->getDB()::getAll($query, [$accountId]);
        }
        return $results;
    }

    /**
   * @param int $userId
   * @param int $accountId
   * @return array
   * @throws \ReflectionException
   */
    public function fetchTRApprovers(int $userId, int $accountId): array
    {
        $sql = sprintf("SELECT DISTINCT
                            u.id,
                            u.account_id,
                            u.firstname,
                            u.lastname,
                            u.display_name,
                            u.email
                        FROM
                            user u
                        JOIN
                            permission_mappings pm ON pm.user_id = u.id
                        JOIN
                            permission p ON p.id = pm.permission_id
                        WHERE
                            u.account_id = %s
                            AND
                            p.`key` = 'tender_recommendation'
                            AND u.status = 2
                            AND u.id != %s;", $accountId, $userId);
        $result = $this->getModel()->getDb()::getAll($sql);
        return $result;
    }

    /**
   * @param int $userId
   * @return array
   * @throws \ReflectionException
   */
    public function fetchTIApprovers(int $userId, int $accountId): array
    {
        $sql = sprintf("SELECT DISTINCT
                            u.id,
                            u.account_id,
                            u.firstname,
                            u.lastname,
                            u.display_name,
                            u.email
                        FROM
                            user u
                        JOIN
                            permission_mappings pm ON pm.user_id = u.id
                        JOIN
                            permission p ON p.id = pm.permission_id
                        WHERE
                            p.`key` = 'tender_inquiry_approval'
                            AND u.status = 2
                            AND u.id != %d
                            AND u.account_id = %d;", $userId, $accountId);
        $result = $this->getModel()->getDb()::getAll($sql);
        return $result;
    }

    /**
     * @param int $userId
     * @return array
     * @throws \ReflectionException
     */
    public function fetchSLApprovers(int $userId): array
    {
        $sql = sprintf(
            "SELECT DISTINCT
                u.id,
                u.account_id,
                u.firstname,
                u.lastname,
                u.display_name,
                u.email
            FROM
                user u
            JOIN
                permission_mappings pm ON pm.user_id = u.id
            JOIN
                permission p ON p.id = pm.permission_id
            WHERE
                p.`key` = 'subcontractor_list_approval'
                AND u.status = 2
                AND u.id != %s
                AND u.account_id = (
                    SELECT
                        account_id
                    FROM
                        user
                    WHERE
                        id = %s
                );",
            $userId,
            $userId
        );

        return $this->getModel()->getDb()::getAll($sql);
    }

}
