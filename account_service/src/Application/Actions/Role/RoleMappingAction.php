<?php
declare(strict_types=1);

namespace App\Application\Actions\Role;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\User\RoleMappingRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class RoleMappingAction extends Action
{
    protected $defaultContentType = "application/json";

    /**
         * AccountAction constructor.
         * @param LoggerInterface $logger
         */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new RoleMappingRepository();
    }

    public function updateRole(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        $userId = (int)($args['user_id'] ?? 0);
        $roleId = (int)($data['role_id'] ?? 0);
        $requestData = [
            'user_id' => $userId,
            'role_id' => $roleId
        ];

        if (!$userId || !$roleId) {
            return $this->badRequest($response);
        }

        $roleMapping = $this->repository->getModel()->load($userId, 'user_id');

        if ($roleMapping->isLoaded()) {

            $roleMapping->save($requestData);

        } else {
            $newMapping = $this->repository->getModel();
            $newMapping->save($requestData);
        }

        return $this->respond($response, new ActionPayload(200, [
            'success' => true
        ]));
    }

}
