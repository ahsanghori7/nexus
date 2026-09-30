<?php
declare(strict_types=1);

namespace App\Domain\AccountGroupProjectMapping;

use App\Domain\AbstractModel;

class AccountGroupProjectMapping extends AbstractModel
{
    public $timestamps = false;

    protected $table = 'account_group_project_mapping';

    protected $fillable = [
        'project_id',
        'account_group_id',
        'created_at',
        'updated_at'
    ];

    protected $columns = [
        'id' => ['type' => 'int'],
        'project_id' => ['type' => 'int', 'required' => true],
        'account_group_id' => ['type' => 'int', 'required' => true],
    ];

    public function getByProjectId(int $projectId): array
    {
        $sql = "
            SELECT
                id,
                project_id,
                account_group_id,
                created_at,
                updated_at
            FROM account_group_project_mapping
            WHERE project_id = ?
            ORDER BY created_at DESC
        ";

        return $this->getDb()::select($sql, [$projectId]);
    }

    public function deleteByProjectId(int $projectId): void
    {
        $this::where('project_id', $projectId)->delete();
    }
}
