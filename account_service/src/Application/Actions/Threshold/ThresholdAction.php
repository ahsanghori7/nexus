<?php

declare(strict_types=1);

namespace App\Application\Actions\Threshold;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Threshold\ThresholdRepository;
use Psr\Log\LoggerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ThresholdAction extends Action
{
    /**
     * Default content type for feature action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * ThresholdAction constructor.
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new ThresholdRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function fetchThresholds(Request $request, Response $response, array $args): Response
    {
        $accountId = intval($args["aid"] ?? 0);
        $thresholds = $this->repository->getThresholds($accountId);
        return $this->respond(
            $response,
            new ActionPayload(200, $thresholds)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function createThreshold(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        if (!$data) {
            $this->badRequest($response);
        }

        $this->repository->getModel()->save($data);
        return $this->respond(
            $response,
            new ActionPayload(200, ['success' => true])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function deleteByAccountId(Request $request, Response $response, array $args): Response
    {
        $accountId = intval($args["aid"] ?? 0);
        $this->repository->getModel()->deleteWhere([
            'account_id' => $accountId
        ]);

        return $this->respond(
            $response,
            new ActionPayload(200, ['success' => true])
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getUsersByOrderValue(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $accountId = intval($args["aid"] ?? 0);
        $usersList = $this->repository->getModel("approval_thresholds_user_mapping")->getByOrderValue($accountId, (float)$params['order_value'], (int)$params['user_id']);
        return $this->respond(
            $response,
            new ActionPayload(200, $usersList)
        );
    }

    /**
     * Get ALL threshold user mappings.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function getAllUserMappings(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $userIds = $params['user_ids'] ?? [];

        if (empty($userIds)) {
            // No user_ids provided returning empty list
            return $this->respond($response, new ActionPayload(200, []));
        }

        $data = $this->repository
            ->getModel("approval_thresholds_user_mapping")
            ->getUsersRecordsCount($userIds);

        return $this->respond($response, new ActionPayload(200, $data));
    }

    /**
     * Get threshold user mappings for a specific user.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function getUserMappings(Request $request, Response $response, array $args): Response
    {
        $userId = intval($args["user_id"] ?? 0);

        if (!$userId) {
            return $this->badRequest($response);
        }

        $model = $this->repository->getModel("approval_thresholds_user_mapping");

        if (!method_exists($model, 'all')) {
            return $this->respond($response, new ActionPayload(500, null, 'Model method "all" not found.'));
        }

        $records = $model->all(); // Get all records
        $userMappings = array_filter($records, fn($row) => (int)$row['user_id'] === $userId);

        return $this->respond(
            $response,
            new ActionPayload(200, array_values($userMappings))
        );
    }

    /**
     * Get all user mappings for a specific threshold ID.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getUsersByThresholdId(Request $request, Response $response, array $args): Response
    {
        $thresholdId = intval($args["threshold_id"] ?? 0);
        if (!$thresholdId) {
            return $this->badRequest($response);
        }

        $model = $this->repository->getModel("approval_thresholds_user_mapping");

        if (!method_exists($model, 'all')) {
            return $this->respond($response, new ActionPayload(500, null, 'Model method "all" not found.'));
        }

        $records = $model->all();
        $users = array_filter($records, fn($row) => (int)$row['approval_threshold_id'] === $thresholdId);

        return $this->respond(
            $response,
            new ActionPayload(200, array_values($users))
        );
    }


    /**
     * Create a new user mapping for approval thresholds.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function createUserMapping(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        if (!$data || !isset($data['user_id']) || !isset($data['can_approve_all'])) {
            return $this->badRequest($response);
        }

        $this->repository->getModel("approval_thresholds_user_mapping")->save($data);

        return $this->respond($response, new ActionPayload(200, ['success' => true]));
    }

    /**
     * Delete all threshold user mappings for a specific user ID.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
    */
    public function deleteUserMappings(Request $request, Response $response, array $args): Response
    {
        $userId = intval($args["user_id"] ?? 0);

        $this->repository->getModel("approval_thresholds_user_mapping")->deleteWhere([
            'user_id' => $userId
        ]);

        return $this->respond($response, new ActionPayload(200, ['success' => true]));
    }


}
