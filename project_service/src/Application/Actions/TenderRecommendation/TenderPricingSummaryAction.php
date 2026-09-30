<?php
declare(strict_types=1);

namespace App\Application\Actions\TenderRecommendation;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\TenderRecommendation\TenderPricingSummaryRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class TenderPricingSummaryAction extends Action
{
    protected $repository;

    public function __construct(LoggerInterface $logger, TenderPricingSummaryRepository $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }

    public function getQuotes(Request $request, Response $response, array $args): Response
    {
        $projectId = (int) ($args['project_id'] ?? 0);
        $packageId = (int) ($args['package_id'] ?? 0);

        if (!$projectId || !$packageId) {
            return $this->badRequest($response, "Missing project_id or package_id");
        }

        $data = $this->repository->getQuotesByPackage($projectId, $packageId);

        return $this->respond($response, new ActionPayload(200,  $data));
    }

    public function updateQuote(Request $request, Response $response, array $args): Response
    {
        $transactionId = (int) ($args['transaction_id'] ?? 0);
        $body = $this->getData();
        $data = $body ?? [];

        if (!$transactionId) {
            return $this->badRequest($response, "Missing transaction_id");
        }

        $allowedFields = ['forecast', 'note'];
        $updateData = array_intersect_key($data, array_flip($allowedFields));

        if (empty($updateData)) {
            return $this->badRequest($response, "No valid fields to update");
        }

        $updated = $this->repository->updateForecastAndNote($transactionId, $updateData);

        if (!$updated) {
            return $this->badRequest($response, "Failed to update quote");
        }

        return $this->respond($response, new ActionPayload(200, [
            'success' => true,
            'message' => 'Quote updated successfully'
        ]));
    }
}
