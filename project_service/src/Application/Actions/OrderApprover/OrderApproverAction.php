<?php

declare(strict_types=1);

namespace App\Application\Actions\OrderApprover;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Approval\ApprovalSatisfaction;
use App\Domain\OrderApprover\OrderApproverRepository;
use App\Domain\Project\ProjectRepository;
use App\Infrastructure\Persistence\S3;

/**
 * Class ProjectAction
 * @package App\Application\Actions\Project
 */
class OrderApproverAction extends Action
{

    /**
     * Default content type for account action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * @codeCoverageIgnore
     * AccountAction constructor.
     * @param LoggerInterface $logger
     */
    public function __construct(LoggerInterface $logger)
    {
        parent::__construct($logger);
        $this->repository = new OrderApproverRepository();
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listTypes(Request $request, Response $response, array $args): Response
    {
        return $this->listByModel($response, "orderApproverStatus");
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function deleteByTransaction(Request $request, Response $response, array $args): Response
    {
        $transactionId = intval($args["tid"] ?? 0);
        if (!$transactionId) {
            return $this->badRequest($response);
        }

        $this->repository->getModel()->deleteBy(['transaction_id' => $transactionId]);

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getByTransaction(Request $request, Response $response, array $args): Response
    {
        $transactionId = intval($args["tid"] ?? 0);
        if (!$transactionId) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getModel()->with("status")->where(['transaction_id' => $transactionId]);

        return $this->respond($response, (new ActionPayload(200, $data->get()->toArray())));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getByTransactionsGrouped(Request $request, Response $response, array $args): Response
    {
        $transactionIds = array_values(array_filter(array_map(
            'intval',
            explode(',', str_replace(['[', ']'], '', $args['tids'] ?? ''))
        )));

        if (!$transactionIds) {
            return $this->badRequest($response);
        }

        $data = $this->repository
            ->getModel()
            ->with('status')
            ->whereIn('transaction_id', $transactionIds)
            ->get()
            ->toArray();

        $grouped = [];
        foreach ($data as $row) {
            $grouped[$row['transaction_id']][] = $row;
        }

        return $this->respond($response, new ActionPayload(200, $grouped));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function createLog(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();

        $data = $this->repository->getModel('orderLog')->store($data);

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getLogByTransaction(Request $request, Response $response, array $args): Response
    {
        $transactionId = intval($args["tid"] ?? 0);
        if (!$transactionId) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getModel('orderLog')->where(['transaction_id' => $transactionId]);

        return $this->respond($response, (new ActionPayload(200, $data->get()->toArray())));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getRequiredActions(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $userId = intval($args["uid"] ?? 0);
        if (!$userId) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getModel()->getRequiredActionsData($userId, $params);

        return $this->respond($response, (new ActionPayload(200, $data)));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getCompletedActions(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $userId = intval($args["uid"] ?? 0);
        if (!$userId) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getModel()->getCompletedActionsData($userId, $params);

        return $this->respond($response, (new ActionPayload(200, $data)));
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function createBulkApprovers(Request $request, Response $response, array $args): Response
    {
        $data = $this->getData();
        $approvedStatusId = $this->repository->getModel('orderApproverStatus')->getLabelId('Approved');
        foreach ($data['users'] as $value) {
            if (!is_array($value)) {
                continue;
            }
            $this->repository->getModel()->store([
                'transaction_id' => $data['transaction_id'] ?? null,
                'requester_user_id' => $data['requester_user_id'] ?? null,
                'status_id' => ApprovalSatisfaction::isApproverSatisfied($value)
                    ? $approvedStatusId
                    : ($data['status_id'] ?? null),
                'approver_user_id' => $value['user_id'] ?? null,
                'approval_level_workflow_id' => $value['approval_level_workflow_id'] ?? null,
                'meta' => ApprovalSatisfaction::buildApproverMeta($value),
            ]);
        }

        return $this->noContent($response);
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     * @throws \Exception
     */
    public function getByTransactions(Request $request, Response $response, array $args): Response
    {

        $transactionIds = explode(",", str_replace(["[","]"], "", $args["tids"]));
        if (!$transactionIds) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getModel()->with("status")->with('approvalLevelWorkflow')->whereIn('transaction_id', $transactionIds);

        return $this->respond($response, (new ActionPayload(200, $data->get()->toArray())));
    }
}
