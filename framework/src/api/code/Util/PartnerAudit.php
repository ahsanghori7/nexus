<?php

namespace Api\Util;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Util\StructuredLogger;

class PartnerAudit
{
    const LOG_PREFIX = "PARTNER";

    /**
     * @param int $apiClientId
     * @param array $fields
     * @return void
     */
    public static function record(int $apiClientId, array $fields = []): void
    {
        $payload = $fields + [
            "jti" => null,
            "method" => null,
            "endpoint" => null,
            "entity_type" => null,
            "entity_id" => null,
            "external_id" => null,
            "request_snapshot" => [],
            "response_code" => null,
            "ip" => $_SERVER["REMOTE_ADDR"] ?? null,
        ];

        try {
            Manager::getService("account")->write("api_client/{$apiClientId}/audit", new Shape([
                "data" => $payload,
            ]));
        } catch (\Throwable $e) {
            StructuredLogger::log(self::LOG_PREFIX, "WARNING", "audit", "audit write failed", [
                "cid" => $apiClientId,
            ]);
        }
    }
}
