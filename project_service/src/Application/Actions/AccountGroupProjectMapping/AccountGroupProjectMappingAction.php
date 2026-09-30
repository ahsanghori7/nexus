<?php
declare(strict_types=1);

namespace App\Application\Actions\AccountGroupProjectMapping;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\AccountGroupProjectMapping\AccountGroupProjectMappingRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class AccountGroupProjectMappingAction extends Action
{
    protected $repository;

    public function __construct(LoggerInterface $logger, AccountGroupProjectMappingRepository $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }

    /**
     * GET all mappings by project
     */
    public function getAll(Request $request, Response $response, array $args): Response
    {
        $projectId = (int) $args['project_id'];

        if (!$projectId) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getByProjectId($projectId);

        return $this->respond($response, new ActionPayload(200, $data));
    }

    /**
     * CREATE mapping
     */
    public function createAccountGroupProjectMapping(Request $request, Response $response, array $args): Response
    {
        $projectId = (int) $args['project_id'];
        $data = $this->getData();

        if (!$projectId || empty($data['account_group_id']) || !is_array($data['account_group_id'])) {
            return $this->badRequest($response);
        }

        $model = $this->repository->getModel();
        $createdIds = [];
        foreach ($data['account_group_id'] as $groupId) {
            $row = $model->create([
                'project_id' => $projectId,
                'account_group_id' => (int) $groupId,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            if (isset($row->id)) {
                $createdIds[] = $row->id;
            }
        }

        return $this->respond(
            $response,
            new ActionPayload(201, [
                'success' => !empty($createdIds),
                'ids' => $createdIds
            ])
        );
    }

    /**
     * DEKETE BULK BY PROJECT
     */
    public function deleteAllByProject(Request $request, Response $response, array $args): Response
    {
        $projectId = (int) $args['project_id'];

        if (!$projectId) {
            return $this->badRequest($response);
        }

        $this->repository->deleteByProjectId($projectId);

        return $this->respond(
            $response,
            new ActionPayload(200, [
                'success' => true
            ])
        );
    }
}
