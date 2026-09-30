<?php

declare(strict_types=1);

namespace App\Application\Actions\Account;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Account\AccountGroupRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class AccountGroupAction extends Action
{
    protected $defaultContentType = "application/json";

    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new AccountGroupRepository();
    }

    /**
     * Create Account User Group
     */
    public function createGroup(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();

        $data['account_id'] = (int)$args['account_id'];

        $this->repository->getModel("group")->save($data);

        return $this->respond(
            $response,
            new ActionPayload(200, ["success" => true])
        );
    }

    /**
     * Update Account User Group
     */
    public function updateGroup(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        $group = $this->repository
            ->getModel("group")
            ->load((int) $args['group_id']);

        if (!$group->isLoaded()) {
            return $this->notFound($response);
        }

        if (empty($data)) {
            return $this->respond(
                $response,
                new ActionPayload(400, ["error" => "No data provided"])
            );
        }

        $group->save($data);

        return $this->respond(
            $response,
            new ActionPayload(200, ["success" => true])
        );
    }

    /**
     * Fetch Account Groups
     */
    public function listGroup(Request $request, Response $response, array $args): Response
    {
        $groups = $this->repository->getByAccountId((int)$args['account_id']);

        return $this->respond(
            $response,
            new ActionPayload(200, $groups)
        );
    }

    /**
     * Assign a group to a user
     */
    public function assignUserGroup(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();

        if (empty($data['user_group_ids']) || !is_array($data['user_group_ids'])) {
            return $this->respond(
                $response,
                new ActionPayload(400, ["error" => "user_group_ids must be a non-empty array"])
            );
        }

        $userId = (int)$args['user_id'];
        $groupIds = array_map('intval', $data['user_group_ids']);

        $this->repository->assignUserToGroupMapping($userId, $groupIds);

        return $this->respond(
            $response,
            new ActionPayload(200, ["success" => true])
        );
    }

    /**
     * Update a user's group assignment
     */
    public function updateUserGroup(Request $request, Response $response, array $args): Response
    {
        try {
            $data = $this->getData();

            if (empty($data['user_group_ids']) || !is_array($data['user_group_ids'])) {
                return $this->respond(
                    $response,
                    new ActionPayload(400, ["error" => "user_group_ids must be a non-empty array"])
                );
            }

            $userId = (int)$args['user_id'];
            $groupIds = array_map('intval', $data['user_group_ids']);

            $result = $this->repository->updateUserGroupMapping($userId, $groupIds);

            if($result) {
                return $this->respond(
                    $response,
                    new ActionPayload(200, ["success" => true])
                );
            }

            throw new \Exception("Could not update user group.");

        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }

    }

    public function getUserGroup(Request $request, Response $response, array $args): Response
    {
        $userId = (int)$args['user_id'];

        $groups = $this->repository->getGroupsByUserId($userId);

        return $this->respond(
            $response,
            new ActionPayload(200, $groups)
        );
    }

    public function deleteUserGroup(Request $request, Response $response, array $args): Response
    {
        $userId = (int)$args['user_id'];
        $groupId = (int)$args['group_id'];

        try {
            $res = $this->repository->deleteUserGroupMapping($userId, $groupId);

            if ($res) {
                return $this->respond(
                    $response,
                    new ActionPayload(200, [])
                );
            }

            throw new \Exception("Could not delete user group.");

        } catch (\Exception $e) {
            return $this->respond($response, new ActionPayload(400, [
                "error" => $e->getMessage()
            ]));
        }
    }
}
