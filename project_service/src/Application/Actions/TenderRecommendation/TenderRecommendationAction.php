<?php
declare(strict_types=1);

namespace App\Application\Actions\TenderRecommendation;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\TenderRecommendation\TenderRecommendationRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class TenderRecommendationAction extends Action
{
    /** @var TenderRecommendationRepository */
    protected $repository;
    private const DEFAULT_STATUS = 'Draft';

    public function __construct(LoggerInterface $logger, TenderRecommendationRepository $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }

    /**
     * GET /v1/project/{project_id}/tender_recommendation
     */
    public function getAll(Request $request, Response $response, array $args): Response
    {
        $projectId = intval($args["project_id"] ?? 0);
        if (!$projectId) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getByProjectId($projectId);
        return $this->respond($response, new ActionPayload(200, $data));
    }

    /**
     * GET /v1/project/{project_id}/tender_recommendation/active
     */
    public function getActiveRecommendations(Request $request, Response $response, array $args): Response
    {
        $params = $request->getQueryParams();

        $data = $this->repository->getActiveRecommendationsByProject((int)$params["tender_id"]);

        return $this->respond($response, new ActionPayload(200, $data));
    }

    /**
     * GET /v1/project/{project_id}/tender_recommendation/recommendation_status
     * Returns only id, transaction_id, status for all recommendations in the project
    */
    public function getRecommendationStatusByProject(Request $request, Response $response, array $args): Response
    {
        $projectId = intval($args["project_id"] ?? 0);
        if (!$projectId) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getRecommendationStatusByProject($projectId);

        return $this->respond($response, new ActionPayload(200, $data));
    }



    /**
     * GET /v1/project/{project_id}/tender_recommendation/{id}
    */
    public function getById(Request $request, Response $response, array $args): Response
    {
        $projectId = intval($args["project_id"] ?? 0);
        $id        = intval($args["id"] ?? 0);

        if (!$projectId || !$id) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getByProjectAndId($projectId, $id);
        if (!$data) {
            return $this->notFound($response);
        }

        return $this->respond($response, new ActionPayload(200, $data));
    }

    /**
     * PATCH /v1/project/{project_id}/tender_recommendation/{id}/saveas_draft
    */
    public function saveAsDraft(Request $request, Response $response, array $args): Response
    {
        $id = intval($args['id'] ?? 0);
        if (!$id) {
            return $this->badRequest($response);
        }

        $data = (array) $this->getData();
        $model = $this->repository->getModel()->load($id);

        if (!$model->isLoaded()) {
            return $this->notFound($response, "Tender recommendation not found");
        }

        $updated = $model->store($data);

        if (!$updated) {
            return $this->badRequest($response, "Failed to update tender recommendation");
        }

        if (!empty($data['forecasts']) && is_array($data['forecasts'])) {
            foreach ($data['forecasts'] as $forecastItem) {
                if (empty($forecastItem['transaction_id']) || !isset($forecastItem['forecast'])) {
                    return $this->badRequest($response, "Each forecast must include transaction_id and forecast value");
                }

                $transactionId = (int) $forecastItem['transaction_id'];
                $forecastValue = $forecastItem['forecast'] * 100; // Convert to cents

                $updated = $this->repository->updateTransactionForecast($transactionId, $forecastValue);
                if (!$updated) {
                    return $this->badRequest($response, "Failed to update forecast for transaction ID {$transactionId}");
                }
            }
        }

        return $this->respond($response, new ActionPayload(200, [
            'success' => true,
            'message' => 'Tender recommendation has been successfully saved as a draft'
        ]));
    }
}
