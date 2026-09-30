<?php

declare(strict_types=1);

namespace App\Domain\ShortlistSubcontractor;

use App\Domain\AbstractModel;

class ShortlistSubcontractor extends AbstractModel
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
    protected $table = 'shortlisted_subcontractor';

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
    */
    protected $fillable = [
        'tender_id',
        'account_id',
        'author_id',
        'status',
        'created_at',
        'updated_at'
    ];

    /**
     * @var array
    */
    protected $columns = [
        'id' => ['type' => 'int'],
        'tender_id' => ['type' => 'int', 'required' => true],
        'account_id' => ['type' => 'int', 'required' => true],
        'author_id' => ['type' => 'int', 'required' => true],
        'status' => ['type' => 'string', 'required' => true],
        'created_at' => ['type' => 'datetime'],
        'updated_at' => ['type' => 'datetime'],
    ];

    public function getByTenderId(int $projectId, int $tenderId): array
    {
        $sql = $this->buildGetByTenderQuery('ss.tender_id = ?', '1 = 1');

        return $this->getDb()::select($sql, [$projectId, $tenderId]);
    }

    public function getByTenderIds(int $projectId, array $tenderIds, bool $isApproved = false): array
    {
        $tenderIds = array_values(array_filter(array_map('intval', $tenderIds), static fn ($id) => $id > 0));
        if ($tenderIds === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($tenderIds), '?'));
        $statusCondition = $isApproved ? "ss.status != 'Approved'" : "1=1";
        $sql = $this->buildGetByTenderQuery("ss.tender_id IN ({$placeholders})", $statusCondition);
        return $this->getDb()::select($sql, array_merge([$projectId], $tenderIds));
    }
    private function buildGetByTenderQuery(string $tenderCondition, string $statusCondition): string
    {
        return "
            SELECT
                ss.id,
                ss.tender_id,
                t.label AS tender_label,
                ss.account_id,
                ss.author_id,
                ss.status,
                ss.created_at,
                ss.updated_at
            FROM shortlisted_subcontractor ss
            INNER JOIN tender t ON t.id = ss.tender_id
            WHERE t.project_id = ?
            AND {$tenderCondition}
            AND {$statusCondition}
            ORDER BY ss.created_at DESC
        ";
    }

    /**
     * Get shortlisted subcontractors for a project filtered by tender ids.
     *
     * @param int $projectId
     * @param array $tenderIds
     * @return array
     */
    public function getByProjectAndTenderIds(int $projectId, array $tenderIds): array
    {
        $tenderIds = array_values(array_unique(array_map('intval', $tenderIds)));
        $placeholders = implode(',', array_fill(0, count($tenderIds), '?'));
        $params = array_merge([$projectId], $tenderIds);

        $sql = "
            SELECT
                ss.id,
                ss.tender_id,
                t.label AS tender_label,
                ss.account_id,
                ss.author_id,
                ss.status,
                ss.created_at,
                ss.updated_at,
                a.id AS approver_id,
                a.user_id AS approver_user_id,
                a.comment AS approver_notes
            FROM shortlisted_subcontractor ss
            INNER JOIN tender t ON t.id = ss.tender_id
            LEFT JOIN approvals a
                ON a.entity_type = 'shortlisted_subcontractor'
                AND a.entity_id = ss.id
            WHERE t.project_id = ?
            AND ss.tender_id IN ($placeholders)
            ORDER BY ss.tender_id, ss.created_at DESC
        ";

        return $this->getDb()::select($sql, $params);
    }
}
