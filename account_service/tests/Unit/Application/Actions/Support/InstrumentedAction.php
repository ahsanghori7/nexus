<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Support;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Request;
use Slim\Psr7\Response;

/**
 * Test double for App\Application\Actions\Action exposing internal helpers.
 */
final class InstrumentedAction extends Action
{
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
    }

    /**
     * Prime request context needed by helper methods.
     */
    public function withRequest(Request $request): void
    {
        $this->request = $request;
    }

    public function withResponse(Response $response): void
    {
        $this->response = $response;
    }

    public function withArgs(array $args): void
    {
        $this->args = $args;
    }

    public function withDefaultContentType(string $contentType): void
    {
        $this->defaultContentType = $contentType;
    }

    public function withData(?array $data): void
    {
        $this->data = $data;
    }

    public function withRepository(?object $repository): void
    {
        $this->repository = $repository;
    }

    public function resolve(string $name)
    {
        return $this->resolveArg($name);
    }

    public function data(string $key = '', $default = null)
    {
        return $this->getData($key, $default);
    }

    public function formData()
    {
        return $this->getFormData();
    }

    public function respondWithPayload(ActionPayload $payload, ?Response $response = null): Response
    {
        $response ??= new Response();
        return $this->respond($response, $payload);
    }

    public function respondWithData(array $data, int $status = 200): Response
    {
        return $this->respondWithPayload(new ActionPayload($status, $data));
    }

    public function respondWithError(ActionPayload $payload, ?Response $response = null): Response
    {
        return $this->respondWithPayload($payload, $response);
    }

    public function bad(Response $response, array $error = []): Response
    {
        return $this->badRequest($response, $error);
    }

    public function invalid(Response $response): Response
    {
        return $this->invalidJson($response);
    }

    public function json(ActionPayload $payload, int $status): Response
    {
        $this->response = new Response();
        return $this->jsonResponse($payload, $status);
    }

    public function callList(Request $request, Response $response): Response
    {
        return $this->list($request, $response);
    }

    public function callAll(Request $request, Response $response): Response
    {
        return $this->all($request, $response);
    }

    public function callGetById(Request $request, Response $response, array $args): Response
    {
        return $this->getById($request, $response, $args);
    }

    public function callGetModelById(Request $request, Response $response, array $args): Response
    {
        return $this->getModelById($request, $response, $args);
    }

    public function callUpdateById(Request $request, Response $response, array $args): Response
    {
        return $this->updateById($request, $response, $args);
    }

    public function callDeleteById(Request $request, Response $response, array $args): Response
    {
        return $this->deleteById($request, $response, $args);
    }

    public function callListByModel(Response $response, string $type, array $filters = [], bool $returnAll = false): Response
    {
        return $this->listByModel($response, $type, $filters, $returnAll);
    }
}
