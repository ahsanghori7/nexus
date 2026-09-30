<?php

declare(strict_types=1);

namespace App\Application\Actions\PartnerCatalogue;

use App\Application\Actions\Action;
use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogue;
use App\Domain\Project\PartnerCatalogue\PartnerProjectCatalogueRepository;
use App\Domain\Project\ProjectRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

/**
 * @package App\Application\Actions\PartnerCatalogue
 */
class PartnerCatalogueAction extends Action
{
    /**
     * @var string
     */
    protected $defaultContentType = "application/json";

    const DEFAULT_AVAILABLE_LIMIT = 25;
    const MAX_AVAILABLE_LIMIT = 100;

    /**
     * @var ProjectRepository
     */
    private $projectRepository;

    /**
     * @param LoggerInterface $logger
     * @param PartnerProjectCatalogueRepository|null $repository
     * @param ProjectRepository|null $projectRepository
     */
    public function __construct(
        LoggerInterface $logger,
        ?PartnerProjectCatalogueRepository $repository = null,
        ?ProjectRepository $projectRepository = null
    ) {
        parent::__construct($logger);
        $this->repository = $repository ?? new PartnerProjectCatalogueRepository();
        $this->projectRepository = $projectRepository ?? new ProjectRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listAvailable(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();

        $mappingIds = $this->mappingIds($params);
        if (!$mappingIds) {
            return $this->respond($response, new ActionPayload(200, ['records' => [], 'total' => 0]));
        }

        $search = trim((string) ($params['search'] ?? ''));
        $limit = min(max((int) ($params['limit'] ?? self::DEFAULT_AVAILABLE_LIMIT), 1), self::MAX_AVAILABLE_LIMIT);
        $offset = max((int) ($params['offset'] ?? 0), 0);

        $records = array_map(
            [$this, 'presentSelectable'],
            $this->repository->listAvailable($mappingIds, $search, $limit, $offset)
        );

        return $this->respond($response, new ActionPayload(200, [
            'records' => $records,
            'total' => $this->repository->countAvailable($mappingIds, $search),
        ]));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getByProjectId(Request $request, Response $response, array $args): Response
    {
        $projectId = (int) ($args['project_id'] ?? 0);
        $mappingIds = $this->mappingIds($request->getQueryParams());
        if ($projectId <= 0 || !$mappingIds) {
            return $this->badRequest($response);
        }

        $record = $this->repository->findByProjectId($projectId, $mappingIds);
        if (!$record) {
            return $this->notFound($response);
        }

        return $this->respond($response, new ActionPayload(200, $this->presentSelectable($record->toArray())));
    }

    /**
     * @param array $params
     * @return array
     */
    private function mappingIds(array $params): array
    {
        return array_values(array_filter(array_map(
            'intval',
            explode(',', (string) ($params['mapping_ids'] ?? ''))
        )));
    }

    /**
     * @param array $row
     * @return array
     */
    private function presentSelectable(array $row): array
    {
        return [
            'id' => (int) ($row['id'] ?? 0),
            'external_id' => $row['external_id'] ?? null,
            'project_code' => $row['project_code'] ?? null,
            'project_name' => $row['project_name'] ?? null,
            'business_unit_code' => $row['business_unit_code'] ?? null,
            'business_unit_name' => $row['business_unit_name'] ?? null,
        ];
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listCatalogue(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $apiClientId = (int) ($params['api_client_id'] ?? 0);
        if ($apiClientId <= 0) {
            return $this->badRequest($response);
        }

        $filters = $this->filters($params);
        $limit = (int) ($params['limit'] ?? 100);
        $offset = (int) ($params['offset'] ?? 0);

        return $this->respond($response, new ActionPayload(200, [
            'records' => $this->repository->listForClient($apiClientId, $filters, $limit, $offset),
            'total' => $this->repository->countForClient($apiClientId, $filters),
        ]));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getByExternalId(Request $request, Response $response, array $args): Response
    {
        $apiClientId = (int) ($request->getQueryParams()['api_client_id'] ?? 0);
        $externalId = (string) ($args['external_id'] ?? '');
        if ($apiClientId <= 0 || $externalId === '') {
            return $this->badRequest($response);
        }

        $record = $this->repository->findByExternalId($apiClientId, $externalId);
        if (!$record) {
            return $this->notFound($response);
        }

        return $this->respond($response, new ActionPayload(200, $record->toArray()));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createCatalogue(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        $apiClientId = (int) ($data['api_client_id'] ?? 0);
        $externalId = (string) ($data['external_id'] ?? '');
        if ($apiClientId <= 0 || $externalId === '') {
            return $this->badRequest($response);
        }

        $record = [
            'api_client_id' => $apiClientId,
            'group_id' => isset($data['group_id']) ? (int) $data['group_id'] : null,
            'external_id' => $externalId,
            'project_code' => (string) ($data['project_code'] ?? ''),
            'project_name' => (string) ($data['project_name'] ?? ''),
            'business_unit_code' => (string) ($data['business_unit_code'] ?? ''),
            'business_unit_name' => isset($data['business_unit_name']) ? (string) $data['business_unit_name'] : null,
        ];
        $hash = $this->repository->canonicalHash($record);
        $record['source_payload_hash'] = $hash;

        $existing = $this->repository->findByExternalId($apiClientId, $externalId);
        if ($existing) {
            return $this->respondExisting($response, $existing, $hash);
        }

        if ($this->projectNameExists($record['project_name'])) {
            return $this->respond($response, new ActionPayload(
                400,
                null,
                new ActionError(ActionError::VALIDATION_ERROR, "Project name already exists")
            ));
        }

        try {
            $created = $this->repository->createRecord($record);

            return $this->respond($response, new ActionPayload(201, $created->toArray()));
        } catch (\Throwable $e) {
            $this->logger->error('Partner catalogue create failed', [
                'api_client_id' => $apiClientId,
                'external_id' => $externalId,
                'exception' => $e->getMessage(),
            ]);

            return $this->respond($response, new ActionPayload(
                500,
                null,
                new ActionError(ActionError::SERVER_ERROR, 'Failed to store the project catalogue record')
            ));
        }
    }

    /**
     * @param string $projectName
     * @return bool
     */
    private function projectNameExists(string $projectName): bool
    {
        $projectName = trim($projectName, ' ');
        if ($projectName === '') {
            return false;
        }

        return $this->projectRepository->getModel()->load($projectName, 'name')->isLoaded();
    }

    /**
     * @param Response $response
     * @param PartnerProjectCatalogue $existing
     * @param string $hash
     * @return Response
     */
    private function respondExisting(Response $response, PartnerProjectCatalogue $existing, string $hash): Response
    {
        $status = ((string) $existing->source_payload_hash === $hash) ? 200 : 409;

        return $this->respond($response, new ActionPayload($status, $existing->toArray()));
    }

    /**
     * @param array $params
     * @return array
     */
    private function filters(array $params): array
    {
        $filters = [];

        if (isset($params['business_unit_code']) && $params['business_unit_code'] !== '') {
            $filters['business_unit_code'] = (string) $params['business_unit_code'];
        }

        if (isset($params['linked']) && $params['linked'] !== '') {
            $filters['linked'] = filter_var($params['linked'], FILTER_VALIDATE_BOOLEAN);
        }

        return $filters;
    }
}
