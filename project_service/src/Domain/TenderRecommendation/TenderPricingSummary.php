<?php
declare(strict_types=1);

namespace App\Domain\TenderRecommendation;

use App\Domain\AbstractModel;

class TenderPricingSummary extends AbstractModel
{
    protected $table = 'transaction';

    /**
     * Retrieve all subcontractor quotes per package
    */
    public function getQuotesByPackage(int $projectId, int $packageId): array
    {
        $sql = "
            SELECT
                t.id AS transaction_id,
                t.subcontractor_id,
                pkg.label AS package_name,
                t.price AS quoted_price,
                t.forecast,
                pkg.budget AS package_budget,
                t.note,
                t.quote_created AS created_at,
                t.order_updated AS updated_at
            FROM transaction t
            JOIN tender pkg ON pkg.id = t.tender_id
            JOIN project p ON p.id = pkg.project_id
            WHERE pkg.id = :package_id
            AND p.id = :project_id
            ORDER BY t.id ASC
        ";

        return $this->getDb()::select($sql, [
            'package_id' => $packageId,
            'project_id' => $projectId
        ]);
    }

    /**
     * Update forecast and/or note for a transaction (quote)
    */
    public function updateForecastAndNote(int $transactionId, array $data): bool
    {
        $setParts = [];
        $params = [];

        foreach ($data as $key => $value) {
            $setParts[] = "$key = :$key";
            $params[$key] = $value;
        }

        $params['transaction_id'] = $transactionId;

        $sql = "
            UPDATE transaction
            SET " . implode(', ', $setParts) . ", order_updated = NOW()
            WHERE id = :transaction_id
        ";

        return $this->getDb()::update($sql, $params) > 0;
    }
}
