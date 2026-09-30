<?php

declare(strict_types=1);

namespace App\Domain\ApiClient;

use App\Domain\AbstractRepository;

class ApiClientRepository extends AbstractRepository
{
    const DEFAULT_MODEL = "apiClient";

    /**
     * @var string[]
     */
    protected $models = [
        "apiClient" => ApiClient::class,
        "apiClientAudit" => ApiClientAudit::class,
        "apiClientBusinessUnitMapping" => ApiClientBusinessUnitMapping::class,
    ];

    /**
     * @param string $clientId
     * @param string $clientSecret
     * @return ApiClient|null
     * @throws \ReflectionException
     */
    public function authenticate(string $clientId, string $clientSecret): ?ApiClient
    {
        /** @var ApiClient $client */
        $client = $this->getModel("apiClient")->load($clientId, "client_id");

        if (!$client->isLoaded()) {
            return null;
        }

        if (!$client->isActive()) {
            return null;
        }

        if (!$client->verifySecret($clientSecret)) {
            return null;
        }

        return $client;
    }

    /**
     * @param int $id
     * @return ApiClient|null
     */
    public function loadById(int $id): ?ApiClient
    {
        /** @var ApiClient $client */
        $client = $this->getModel("apiClient")->load($id);
        return $client->isLoaded() ? $client : null;
    }

    /**
     * @param int $id
     * @return void
     */
    public function touchLastUsed(int $id): void
    {
        $model = $this->getModel("apiClient");
        $db = $model->getDB();
        if (method_exists($db, 'exec')) {
            $db::exec('UPDATE api_client SET last_used_at = ? WHERE id = ?', [date('Y-m-d H:i:s'), $id]);
        }
    }

    /**
     * @param array $data
     * @return int
     * @throws \Exception
     */
    public function writeAudit(array $data): int
    {
        $snapshot = $data['request_snapshot'] ?? [];
        if (!is_array($snapshot)) {
            $snapshot = [];
        }
        $data['request_snapshot'] = json_encode(ApiClientAudit::sanitise($snapshot));

        return $this->getModel("apiClientAudit")->save($data)->getId();
    }

    /**
     * @param int $apiClientId
     * @param string $externalCode
     * @return ApiClientBusinessUnitMapping|null
     */
    public function resolveBusinessUnit(int $apiClientId, string $externalCode): ?ApiClientBusinessUnitMapping
    {
        $model = $this->getModel("apiClientBusinessUnitMapping");
        $db = $model->getDB();
        if (!method_exists($db, 'getRow')) {
            return null;
        }

        $row = $db::getRow(
            'SELECT * FROM api_client_business_unit_mapping WHERE api_client_id = ? AND external_code = ? LIMIT 1',
            [$apiClientId, $externalCode]
        );
        if (!$row) {
            return null;
        }

        /** @var ApiClientBusinessUnitMapping $mapping */
        $mapping = $model->setData($row);

        return $mapping->isActive() ? $mapping : null;
    }

    /**
     * Mappings an account may link projects against. Inactive mappings and
     * deactivated clients are excluded
     *
     * @param int $accountId
     * @return array
     */
    public function listBusinessUnitsByAccount(int $accountId): array
    {
        $db = $this->getModel("apiClientBusinessUnitMapping")->getDB();
        if (method_exists($db, 'getAll')) {
            return $db::getAll(
                'SELECT m.id, m.api_client_id, m.account_group_id, m.external_code, m.external_name, c.provider_id
                   FROM api_client_business_unit_mapping m
                   INNER JOIN api_client c ON c.id = m.api_client_id
                   INNER JOIN account_group g ON g.id = m.account_group_id
                  WHERE g.account_id = ? AND m.active = 1 AND c.active = 1
                  ORDER BY m.external_code',
                [$accountId]
            );
        }

        return [];
    }

    /**
     * @param int $apiClientId
     * @return array
     */
    public function listBusinessUnits(int $apiClientId): array
    {
        $db = $this->getModel("apiClientBusinessUnitMapping")->getDB();
        if (method_exists($db, 'getAll')) {
            return $db::getAll(
                'SELECT * FROM api_client_business_unit_mapping WHERE api_client_id = ? ORDER BY external_code',
                [$apiClientId]
            );
        }

        return [];
    }
}
