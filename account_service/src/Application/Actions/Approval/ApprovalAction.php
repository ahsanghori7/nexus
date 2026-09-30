<?php

declare(strict_types=1);

namespace App\Application\Actions\Approval;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\Approval\ApprovalRepository;
use App\Domain\Threshold\ThresholdRepository;
use Psr\Log\LoggerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;


class ApprovalAction extends Action
{
    /**
     * Default content type for feature action data is json
     * @var string
     */
    protected $defaultContentType = "application/json";

    /**
     * ApprovalAction constructor.
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
    public function getTRApprovers(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $userId = $params['user_id'] ?? 0;
        $result = $this->repository->fetchTRApprovers((int)$userId, (int)$args['aid']);
        return $this->respond(
            $response,
            new ActionPayload(200, $result)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getTIApprovers(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $userId = $params['user_id'] ?? 0;
        $accountId = $args['account_id'] ?? 0;
        $result = $this->repository->fetchTIApprovers((int)$userId, (int)$accountId);
        return $this->respond(
            $response,
            new ActionPayload(200, $result)
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function getSLApprovers(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();
        $userId = $params['user_id'] ?? 0;
        $result = $this->repository->fetchSLApprovers((int)$userId);
        return $this->respond(
            $response,
            new ActionPayload(200, $result)
        );
    }

}
