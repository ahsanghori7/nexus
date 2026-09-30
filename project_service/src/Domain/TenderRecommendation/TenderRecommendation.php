<?php

declare(strict_types=1);

namespace App\Domain\TenderRecommendation;

use App\Domain\AbstractModel;

class TenderRecommendation extends AbstractModel
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
    protected $table = 'tender_recommendation';

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
    */
    protected $fillable = [
        'tender_id',
        'transaction_id',
        'author_id',
        'subcontractor_user_id',
        'exec_summary',
        'final_comment',
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
        'transaction_id' => ['type' => 'int', 'required' => true],
        'author_id' => ['type' => 'int', 'required' => true],
        'subcontractor_user_id' => ['type' => 'int', 'required' => true],
        'exec_summary' => ['type' => 'string'],
        'final_comment' => ['type' => 'string'],
        'status' => ['type' => 'string', 'required' => true],
        'created_at' => ['type' => 'datetime'],
        'updated_at' => ['type' => 'datetime'],
    ];

    /**
     * Fetch all recommendations by project_id
    */
    public function getByProjectId(int $projectId): array
    {
        $sql = sprintf(
            "SELECT tr.*, t.label as tender_label, p.name as project_name
             FROM tender_recommendation tr
             JOIN `tender` t ON tr.tender_id = t.id
             JOIN `project` p ON t.project_id = p.id
             WHERE p.id = %d;",
            $projectId
        );

        return $this->getDb()::select($sql);
    }

    /**
     * Fetch recommendation by ID and project_id
    */
    public function getByProjectAndId(int $projectId, int $id): array
    {
        $sql = sprintf(
            "SELECT tr.*, t.label as tender_label, p.name as project_name
             FROM tender_recommendation tr
             JOIN `tender` t ON tr.tender_id = t.id
             JOIN `project` p ON t.project_id = p.id
             WHERE tr.id = %d AND p.id = %d
             LIMIT 1;",
            $id,
            $projectId
        );

        $result = $this->getDb()::select($sql);
        return $result;
    }

    public function getActiveRecommendationsByProject(int $tenderId): array
    {
        $sql = sprintf(
            "SELECT tr.id, tr.tender_id, tr.status
            FROM tender_recommendation tr
            WHERE tr.tender_id = %d AND LOWER(tr.status) != 'cancelled';",
            $tenderId
        );

        return $this->getDb()::select($sql);
    }

    /**
     * Fetch only id, transaction_id, status for a project
    */
    public function getRecommendationStatusByProject(int $projectId): array
    {
        $sql = "
            SELECT tr.id AS id, tr.transaction_id, tr.status
            FROM tender_recommendation tr
            JOIN tender t ON tr.tender_id = t.id
            WHERE t.project_id = ?
        ";

        return $this->getDb()::select($sql, [$projectId]);
    }

}
