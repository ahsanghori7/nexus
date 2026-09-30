<?php
declare(strict_types=1);

namespace App\Domain\TenderRecommendation;

use App\Domain\AbstractRepository;

/**
 * @method TenderPricingSummary getModel()
 */
class TenderPricingSummaryRepository extends AbstractRepository
{
    const DEFAULT_MODEL = "tenderPricingSummary";

    protected $models = [
        "tenderPricingSummary" => TenderPricingSummary::class,
    ];

    public function getQuotesByPackage(int $projectId, int $packageId): array
    {
        return $this->getModel()->getQuotesByPackage($projectId, $packageId);
    }

    public function updateForecastAndNote(int $transactionId, array $data): bool
    {
        return $this->getModel()->updateForecastAndNote($transactionId, $data);
    }
}
