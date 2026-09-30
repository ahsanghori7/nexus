<?php

declare(strict_types=1);

namespace App\Application\Actions\Permission;

use App\Application\Actions\Action;
use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use App\Domain\Permission\PermissionRepository;
use Psr\Log\LoggerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PermissionAction extends Action
{
    /**
     * Default content type for feature action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * Permission constructor.
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new PermissionRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function fetchPermissions(Request $request, Response $response, array $args): Response
    {
        $permissions = $this->repository->getPermissionsGroupedByUserType();

        return $this->respond(
            $response,
            new ActionPayload(200, $permissions)
        );
    }

    /**
     * Get all permission user mappings.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function getAllPermissionMappings(Request $request, Response $response, array $args = []): Response
    {
        $queryParams = $request->getQueryParams();
        $permissionId = $queryParams['permission_id'] ?? null;

        $conditions = [];
        if (!empty($permissionId)) {
            $conditions['permission_id'] = (int)$permissionId;
        }

        $model = $this->repository->getModel('user_permission_mapping');

        // Fetch all or filtered permission mappings
        $records = !empty($conditions)
            ? $model->findAll($conditions)
            : $model->all();

        return $this->respond(
            $response,
            new ActionPayload(200, $records)
        );
    }

    /**
     * Get permission user mappings for a specific user.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function getUserPermissionMappings(Request $request, Response $response, array $args): Response
    {
        $userId = intval($args["user_id"] ?? 0);

        if (!$userId) {
            return $this->badRequest($response);
        }

        $model = $this->repository->getModel("user_permission_mapping");

        if (!method_exists($model, 'all')) {
            return $this->respond($response, new ActionPayload(500, null, new ActionError(ActionError::SERVER_ERROR, 'Model method "all" not found.')));
        }

        $records = $model->all();
        $userMappings = array_filter($records, fn($row) => (int)$row['user_id'] === $userId);

        return $this->respond(
            $response,
            new ActionPayload(200, array_values($userMappings))
        );
    }

    /**
     * Create a new user mapping for permission.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function createUserPermissionMapping(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();

        if (
            !$data ||
            !isset($data['user_id']) ||
            !isset($data['permission_id'])
        ) {
            return $this->badRequest($response);
        }

        $model = $this->repository->getModel("user_permission_mapping");

        $existing = $model->findAll(['user_id' => $data['user_id'], 'permission_id' => $data['permission_id']]);
        if (!$existing) {
            $model->save($data);
        }

        return $this->respond($response, new ActionPayload(200, ['success' => true]));
    }


    /**
     * Delete all permission user mappings for a specific user ID.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function deleteUserPermissionMappings(Request $request, Response $response, array $args): Response
    {
        $userId = intval($args["user_id"] ?? 0);
        $permissionId = intval($args["permission_id"] ?? 0);

        $conditions = ['user_id' => $userId];
        if ($permissionId) {
            $conditions['permission_id'] = $permissionId;
        }

        $this->repository->getModel("user_permission_mapping")->deleteWhere($conditions);

        return $this->respond($response, new ActionPayload(200, ['success' => true]));
    }

    /**
     * Get all permission / user permission mappings for a specific Permission key.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function getPermissionByKey(Request $request, Response $response, array $args): Response
    {
        $queryParams = $request->getQueryParams();
        $permissionKey = isset($queryParams['permission_key']) ? $queryParams["permission_key"] : '';
        $userId = isset($queryParams['user_id']) ? intval($queryParams['user_id']) : null;

        $result = $this->repository->getPermissionMappingsByKey($permissionKey, $userId);

        return $this->respond($response, new ActionPayload(200, $result));
    }
}
