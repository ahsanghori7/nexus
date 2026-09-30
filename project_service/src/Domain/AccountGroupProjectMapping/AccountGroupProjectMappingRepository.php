<?php
declare(strict_types=1);

namespace App\Domain\AccountGroupProjectMapping;

use App\Domain\AbstractRepository;

/**
 * @method AccountGroupProjectMapping getModel()
 */
class AccountGroupProjectMappingRepository extends AbstractRepository
{
    const DEFAULT_MODEL = 'accountGroupProjectMapping';

    protected $models = [
        'accountGroupProjectMapping' => AccountGroupProjectMapping::class,
    ];

    public function getByProjectId(int $projectId): array
    {
        return $this->getModel()->getByProjectId($projectId);
    }

    public function deleteByProjectId(int $projectId): void
    {
        $this->getModel()->deleteByProjectId($projectId);
    }
}
