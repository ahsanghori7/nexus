<?php

declare(strict_types=1);

namespace App\Domain\Project\PartnerCatalogue;

use App\Domain\AbstractRepository;

/**
 * @package App\Domain\Project\PartnerCatalogue
 */
class PartnerProjectCatalogueRepository extends AbstractRepository
{
    const DEFAULT_MODEL = "partner_project_catalogue";

    /**
     * @var string[]
     */
    protected $models = [
        "partner_project_catalogue" => PartnerProjectCatalogue::class,
    ];

    /**
     * @param array $fields
     * @return string
     */
    public function canonicalHash(array $fields): string
    {
        $canonical = [
            'external_id' => (string) ($fields['external_id'] ?? ''),
            'project_code' => (string) ($fields['project_code'] ?? ''),
            'project_name' => (string) ($fields['project_name'] ?? ''),
            'business_unit_code' => (string) ($fields['business_unit_code'] ?? ''),
            'business_unit_name' => (string) ($fields['business_unit_name'] ?? ''),
        ];
        ksort($canonical);

        return hash('sha256', (string) json_encode($canonical));
    }

    /**
     * @param int $apiClientId
     * @param string $externalId
     * @return PartnerProjectCatalogue|null
     */
    public function findByExternalId(int $apiClientId, string $externalId): ?PartnerProjectCatalogue
    {
        $model = $this->getModel();
        $result = $model::where('api_client_id', $apiClientId)
            ->where('external_id', $externalId)
            ->first();

        return $result ?: null;
    }

    /**
     * @param int $apiClientId
     * @param array $filters business_unit_code, linked (bool)
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function listForClient(int $apiClientId, array $filters = [], int $limit = 100, int $offset = 0): array
    {
        return $this->scoped($apiClientId, $filters)
            ->orderBy('id')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->toArray();
    }

    /**
     * @param int $apiClientId
     * @param array $filters
     * @return int
     */
    public function countForClient(int $apiClientId, array $filters = []): int
    {
        return (int) $this->scoped($apiClientId, $filters)->count();
    }

    /**
     * @param array $mappingIds authorised api_client_business_unit_mapping ids
     * @param string $search
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public function listAvailable(array $mappingIds, string $search = '', int $limit = 25, int $offset = 0): array
    {
        return $this->available($mappingIds, $search)
            ->orderBy('project_name')
            ->orderBy('id')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->toArray();
    }

    /**
     * @param array $mappingIds
     * @param string $search
     * @return int
     */
    public function countAvailable(array $mappingIds, string $search = ''): int
    {
        return (int) $this->available($mappingIds, $search)->count();
    }

    /**
     * @param int $projectId
     * @param array $mappingIds
     * @return PartnerProjectCatalogue|null
     */
    public function findByProjectId(int $projectId, array $mappingIds): ?PartnerProjectCatalogue
    {
        $result = $this->getModel()::where('c_link_project_id', $projectId)
            ->whereIn('group_id', $mappingIds)
            ->first();

        return $result ?: null;
    }

    /**
     * @param int $id
     * @return PartnerProjectCatalogue|null
     */
    public function findById(int $id): ?PartnerProjectCatalogue
    {
        $result = $this->getModel()::where('id', $id)->first();

        return $result ?: null;
    }

    /**
     * @param int $catalogueId
     * @param int $projectId
     * @return bool true when this caller won the claim
     */
    public function linkToProject(int $catalogueId, int $projectId): bool
    {
        $affected = $this->getModel()::where('id', $catalogueId)
            ->whereNull('c_link_project_id')
            ->update([
                'c_link_project_id' => $projectId,
                'linked_at' => date('Y-m-d H:i:s'),
            ]);

        return $affected === 1;
    }

    /**
     * @param array $data
     * @return PartnerProjectCatalogue
     */
    public function createRecord(array $data): PartnerProjectCatalogue
    {
        if (!isset($data['source_payload_hash'])) {
            $data['source_payload_hash'] = $this->canonicalHash($data);
        }

        return $this->getModel()::create($data);
    }

    /**
     * @param array $mappingIds
     * @param string $search
     * @return mixed
     */
    private function available(array $mappingIds, string $search = '')
    {
        $query = $this->getModel()::whereIn('group_id', $mappingIds)
            ->whereNull('c_link_project_id');

        $search = trim($search);
        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('project_code', 'LIKE', $like)
                    ->orWhere('project_name', 'LIKE', $like)
                    ->orWhere('external_id', 'LIKE', $like);
            });
        }

        return $query;
    }

    /**
     * @param int $apiClientId
     * @param array $filters
     * @return mixed
     */
    private function scoped(int $apiClientId, array $filters = [])
    {
        $model = $this->getModel();
        $query = $model::where('api_client_id', $apiClientId);

        if (!empty($filters['business_unit_code'])) {
            $query->where('business_unit_code', (string) $filters['business_unit_code']);
        }

        if (isset($filters['linked'])) {
            if ($filters['linked']) {
                $query->whereNotNull('c_link_project_id');
            } else {
                $query->whereNull('c_link_project_id');
            }
        }

        return $query;
    }
}
