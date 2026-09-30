<?php

declare(strict_types=1);

namespace App\Domain\TenderRecommendation;

use App\Domain\AbstractRepository;

/**
 * @method TenderRecommendation getModel()
 */
class TenderRecommendationRepository extends AbstractRepository
{
    const DEFAULT_MODEL = "tenderRecommendation";

    protected $models = [
        "tenderRecommendation" => TenderRecommendation::class,
    ];

    public function getByProjectId(int $projectId): array
    {
        return $this->getModel()->getByProjectId($projectId);
    }

    public function getByProjectAndId(int $projectId, int $id): array
    {
        return $this->getModel()->getByProjectAndId($projectId, $id);
    }

    public function updateTransactionForecast(int $transactionId, $forecast): bool
    {
        $sql = "UPDATE transaction SET forecast = ?, order_updated = NOW() WHERE id = ?";
        return $this->getModel()->getDb()::update($sql, [$forecast, $transactionId]) > 0;
    }

    public function getActiveRecommendationsByProject(int $tenderId): array
    {
        return $this->getModel()->getActiveRecommendationsByProject($tenderId);
    }

    public function getRecommendationStatusByProject(int $projectId): array
    {
        return $this->getModel()->getRecommendationStatusByProject($projectId);
    }

}
