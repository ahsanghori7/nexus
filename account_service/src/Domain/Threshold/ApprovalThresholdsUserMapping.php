<?php

declare(strict_types=1);

namespace App\Domain\Threshold;

use App\Domain\AbstractModel;

/**
 * Class ApprovalThresholdsUserMapping
 * @package App\Domain\Threshold
 */
class ApprovalThresholdsUserMapping extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'approval_threshold_id' => [
            'type' => 'int',
            'required' => true,
        ],
        'user_id' => [
            'type' => 'int',
            'required' => true,
        ],
        'can_approve_all' => [
            'type' => 'int'
        ],
        'is_restricted' => [
            'type' => 'int'
        ],
    ];

    /**
     * @param int $id
     * @param float $value
     * @return array
     * @throws \ReflectionException
     */
    public function getByOrderValue(int $id, float $value, int $userId): array
    {
        $sql = sprintf("SELECT DISTINCT
                u.id,
                u.account_id,
                u.firstname,
                u.lastname,
                u.display_name,
                u.email
            FROM
                approval_thresholds at2
            JOIN approval_thresholds_user_mapping atum ON
                at2.id = atum.approval_threshold_id
            JOIN user u ON u.id = atum.user_id
            WHERE
                at2.account_id = %s
                AND u.status = 2
                AND u.id <> %s
                AND (
                    atum.can_approve_all = 1
                    OR (
                        atum.is_restricted = 0
                        AND %s >= at2.from_value
                        AND (at2.to_value IS NULL
                            OR %s <= at2.to_value)))", $id, $userId, $value, $value);
        $result = $this->getDb()::getAll($sql);

        return $result;
    }

    /**
     * @param int $id
     * @param float $value
     * @return array
     * @throws \ReflectionException
     */
    public function getUsersRecordsCount(array $users): array
    {
        $sql = sprintf("SELECT user_id, COUNT(*) AS record_count
                            FROM approval_thresholds_user_mapping
                            WHERE user_id IN (%s)
                            GROUP BY user_id
                            ORDER BY record_count DESC;", implode(',', $users));
        $result = $this->getDb()::getAll($sql);

        return $result;
    }
}
