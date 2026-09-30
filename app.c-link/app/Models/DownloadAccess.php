<?php

namespace App\Models;

use App\Api\Account;
use App\Api\Project;
use Exception;

class DownloadAccess
{
    public const LOG_ENTITY_TYPE = 'tender_document_download';

    private const LOG_REVOKED = 'Access Revoked';

    /**
     * Withdraws download access from every recipient except the winner.
     *
     * @param int $tenderId
     * @param int $winnerAccountId
     * @return int
     */
    public static function revokeForTender(int $tenderId, int $winnerAccountId): int
    {
        if ($tenderId < 1) {
            return 0;
        }

        try {
            ['ids' => $ids, 'subcontractors' => $subcontractors] = self::tokensToRevoke($tenderId, $winnerAccountId);

            if ($ids === []) {
                return 0;
            }

            $response = Account::post('token/disable/bulk', ['ids' => $ids]);
            $revoked  = (int) ($response->json()['data']['revoked'] ?? 0);

            self::recordRevocation($tenderId, $winnerAccountId, $revoked, $subcontractors);

            return $revoked;
        } catch (Exception $e) {
            error_log("DownloadAccess: could not withdraw access for tender {$tenderId}: " . $e->getMessage());

            return 0;
        }
    }

    /**
     * The links issued for a tender that the winner does not hold.
     *
     * @param int $tenderId
     * @param int $winnerAccountId
     * @return array
     */
    private static function tokensToRevoke(int $tenderId, int $winnerAccountId): array
    {
        $empty  = ['ids' => [], 'subcontractors' => []];
        $typeId = (int) (Account::getTypes('token')[DownloadManager::TOKEN_LABEL] ?? 0);

        if (!$typeId) {
            return $empty;
        }

        $tokens = Account::get('token', ['token_type_id' => $typeId, 'active' => 1]) ?: [];

        $ids            = [];
        $subcontractors = [];

        foreach ($tokens as $token) {
            $meta = json_decode((string) ($token['meta'] ?? ''), true);
            if (!is_array($meta)) {
                continue;
            }

            $subcontractorId = (int) ($meta['subcontractor_id'] ?? 0);

            if ($subcontractorId < 1
                || (int) ($meta['tender_id'] ?? 0) !== $tenderId
                || $subcontractorId === $winnerAccountId
            ) {
                continue;
            }

            $ids[] = (int) $token['id'];
            $subcontractors[$subcontractorId] = $subcontractorId;
        }

        return ['ids' => $ids, 'subcontractors' => array_values($subcontractors)];
    }

    /**
     * @param int $tenderId
     * @param int $winnerAccountId
     * @param int $revoked
     * @param int[] $subcontractors
     */
    private static function recordRevocation(
        int $tenderId,
        int $winnerAccountId,
        int $revoked,
        array $subcontractors
    ): void {
        try {
            Project::post('logs/bulk', ['records' => [[
                'user_id'     => 0,
                'entity_type' => self::LOG_ENTITY_TYPE,
                'entity_id'   => $tenderId,
                'type'        => self::LOG_REVOKED,
                'meta'        => json_encode([
                    'winner_account_id'         => $winnerAccountId,
                    'revoked_count'             => $revoked,
                    'revoked_subcontractor_ids' => $subcontractors,
                ]),
            ]]]);
        } catch (Exception $e) {
            error_log("DownloadAccess: could not record the withdrawal for tender {$tenderId}: " . $e->getMessage());
        }
    }
}
