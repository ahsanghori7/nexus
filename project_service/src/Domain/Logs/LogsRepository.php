<?php

declare(strict_types=1);

namespace App\Domain\Logs;

use App\Domain\AbstractRepository;

/**
 * @method logs getModel()
 */
class LogsRepository extends AbstractRepository
{
    const DEFAULT_MODEL = "logs";

    protected $models = [
        "logs" => Logs::class,
    ];

    /**
     * Records many log entries in one statement.
     *
     * @param array $records
     * @return array{inserted: int, skipped: int}
     */
    public function bulkCreate(array $records): array
    {
        $rows    = [];
        $skipped = 0;

        foreach ($records as $record) {
            $entityType = trim((string) ($record["entity_type"] ?? ""));
            $entityId   = (int) ($record["entity_id"] ?? 0);
            $type       = trim((string) ($record["type"] ?? ""));

            if ($entityType === "" || $entityId <= 0 || $type === "") {
                $skipped++;
                continue;
            }

            $meta = $record["meta"] ?? null;

            $rows[] = [
                "user_id"     => (int) ($record["user_id"] ?? 0),
                "entity_type" => $entityType,
                "entity_id"   => $entityId,
                "type"        => $type,
                "meta"        => is_string($meta) ? $meta : json_encode($meta ?? []),
            ];
        }

        if ($rows) {
            $this->getModel()->insert($rows);
        }

        return ["inserted" => count($rows), "skipped" => $skipped];
    }
}
