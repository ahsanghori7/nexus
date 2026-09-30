<?php

declare(strict_types=1);

namespace App\Application\Actions\ApiClient;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\ApiClient\ApiClient;
use App\Domain\ApiClient\ApiClientRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class ApiClientAction extends Action
{
    /**
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new ApiClientRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function authenticate(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        $clientId = (string) ($data['client_id'] ?? '');
        $clientSecret = (string) ($data['client_secret'] ?? '');

        if ($clientId === '' || $clientSecret === '') {
            return $this->respond($response, new ActionPayload(401, []));
        }

        $client = $this->repository->authenticate($clientId, $clientSecret);
        if (!$client) {
            return $this->respond($response, new ActionPayload(401, []));
        }

        $this->repository->touchLastUsed($client->getId());

        return $this->respond($response, new ActionPayload(200, $this->context($client)));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function loadById(Request $request, Response $response, array $args): Response
    {
        $id = (int) ($args['id'] ?? 0);
        $client = $this->repository->loadById($id);
        if (!$client) {
            return $this->notFound($response);
        }

        return $this->respond($response, new ActionPayload(200, $this->context($client)));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function writeAudit(Request $request, Response $response, array $args): Response
    {
        $id = (int) ($args['id'] ?? 0);
        if ($id <= 0) {
            return $this->badRequest($response);
        }

        $data = $this->getData();
        $auditId = $this->repository->writeAudit([
            'api_client_id' => $id,
            'jti' => $data['jti'] ?? null,
            'method' => $data['method'] ?? null,
            'endpoint' => $data['endpoint'] ?? null,
            'entity_type' => $data['entity_type'] ?? null,
            'entity_id' => $data['entity_id'] ?? null,
            'external_id' => $data['external_id'] ?? null,
            'request_snapshot' => $data['request_snapshot'] ?? [],
            'response_code' => $data['response_code'] ?? null,
            'ip' => $data['ip'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->respond($response, new ActionPayload(200, ['id' => $auditId]));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listBusinessUnitsByAccount(Request $request, Response $response, array $args): Response
    {
        $accountId = (int) ($args['account_id'] ?? 0);
        if ($accountId <= 0) {
            return $this->badRequest($response);
        }

        return $this->respond(
            $response,
            new ActionPayload(200, $this->repository->listBusinessUnitsByAccount($accountId))
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listBusinessUnits(Request $request, Response $response, array $args): Response
    {
        $id = (int) ($args['id'] ?? 0);
        if ($id <= 0) {
            return $this->badRequest($response);
        }

        return $this->respond($response, new ActionPayload(200, $this->repository->listBusinessUnits($id)));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function resolveBusinessUnit(Request $request, Response $response, array $args): Response
    {
        $id = (int) ($args['id'] ?? 0);
        $code = (string) ($args['code'] ?? '');
        if ($id <= 0 || $code === '') {
            return $this->badRequest($response);
        }

        $mapping = $this->repository->resolveBusinessUnit($id, $code);
        if (!$mapping) {
            return $this->notFound($response);
        }

        return $this->respond($response, new ActionPayload(200, [
            'id' => $mapping->getId(),
            'api_client_id' => (int) $mapping->getData('api_client_id'),
            'account_id' => (int) $mapping->getData('account_id'),
            'external_code' => $mapping->getData('external_code'),
            'external_name' => $mapping->getData('external_name'),
            'active' => $mapping->isActive(),
        ]));
    }

    /**
     * @param ApiClient $client
     * @return array
     */
    private function context(ApiClient $client): array
    {
        return [
            'id' => $client->getId(),
            'name' => $client->getData('name'),
            'provider_id' => $client->getData('provider_id'),
            'account_id' => (int) $client->getData('account_id'),
            'scopes' => $client->getScopes(),
            'token_ttl_seconds' => $client->getTokenTtlSeconds(),
            'active' => $client->isActive(),
        ];
    }
}
