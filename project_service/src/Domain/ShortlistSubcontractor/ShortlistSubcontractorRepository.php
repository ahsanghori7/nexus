<?php

declare(strict_types=1);

namespace App\Domain\ShortlistSubcontractor;

use App\Domain\AbstractRepository;

/**
 * @method ShortlistSubcontractor getModel()
 */
class ShortlistSubcontractorRepository extends AbstractRepository
{
    const DEFAULT_MODEL = 'shortlistSubcontractor';

    protected $models = [
        'shortlistSubcontractor' => ShortlistSubcontractor::class,
    ];

    public function getByTenderId(int $projectId, int $tenderId): array
    {
        return $this->getModel()->getByTenderId($projectId, $tenderId);
    }

    public function getByTenderIds(int $projectId, array $tenderIds, bool $isApproved = false): array
    {
        return $this->getModel()->getByTenderIds($projectId, $tenderIds, $isApproved);
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
        return $this->getModel()->getByProjectAndTenderIds($projectId, $tenderIds);
    }

}
