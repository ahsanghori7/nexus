<?php

declare(strict_types=1);

namespace App\Domain\ApiClient;

use App\Domain\AbstractModel;

class ApiClientAudit extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'id',
        'api_client_id',
        'jti',
        'method',
        'endpoint',
        'entity_type',
        'entity_id',
        'external_id',
        'request_snapshot',
        'response_code',
        'ip',
        'created_at',
    ];

    /**
     * @var array
     */
    private const SENSITIVE_KEYS = [
        'client_secret',
        'client_secret_hash',
        'access_token',
        'token',
        'authorization',
        'password',
    ];

    /**
     * @param array $payload
     * @return array
     */
    public static function sanitise(array $payload): array
    {
        $clean = [];
        foreach ($payload as $key => $value) {
            if (in_array(strtolower((string) $key), self::SENSITIVE_KEYS, true)) {
                continue;
            }
            $clean[$key] = is_array($value) ? self::sanitise($value) : $value;
        }

        return $clean;
    }
}
