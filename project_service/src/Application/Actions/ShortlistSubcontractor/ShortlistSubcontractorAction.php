<?php
declare(strict_types=1);

namespace App\Application\Actions\ShortlistSubcontractor;

use App\Application\Actions\Action;
use App\Application\Actions\ActionPayload;
use App\Domain\ShortlistSubcontractor\ShortlistSubcontractorRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class ShortlistSubcontractorAction extends Action
{
    /** @var ShortlistSubcontractorRepository */
    protected $repository;

    public function __construct(LoggerInterface $logger, ShortlistSubcontractorRepository $repository) {
        parent::__construct($logger);
        $this->repository = $repository;
    }

    /**
     * GET shortlisted subcontractors
     */
    public function getShortlistSubcontractor(Request $request, Response $response, array $args): Response {
        $projectId = (int) $args['project_id'];
        $tenderId = (int) $args['tender_id'];

        if (!$projectId || !$tenderId) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getByTenderId($projectId, $tenderId);

        return $this->respond($response, new ActionPayload(200, $data));
    }

    public function getShortlistSubcontractorsByTenderIds(Request $request, Response $response, array $args): Response {
        $projectId = (int) $args['project_id'];
        $tenderIdsRaw = (string) ($args['ids'] ?? '');
        $queryParams = $request->getQueryParams();

        if (!$projectId || $tenderIdsRaw === '') {
            return $this->badRequest($response);
        }

        $trimmed = trim($tenderIdsRaw, '[]');
        $tenderIds = $trimmed === '' ? [] : array_map('intval', explode(',', $trimmed));
        $tenderIds = array_values(array_filter($tenderIds, static fn ($id) => $id > 0));

        $approvedParam = strtolower((string) ($queryParams['is_approved'] ?? 'false'));
        $isApproved = $approvedParam === 'true';
        $data = $this->repository->getByTenderIds($projectId, $tenderIds, $isApproved);

        return $this->respond($response, new ActionPayload(200, $data));
    }

    /**
     * Get shortlisted subcontractors across a project filtered by tender ids.
     *
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listByProject(Request $request, Response $response, array $args): Response
    {
        $projectId = (int) ($args['id'] ?? 0);
        if (!$projectId) {
            return $this->badRequest($response);
        }

        $rawTenderIds = (string) ($args['tender_ids'] ?? '');
        $tenderIds = $rawTenderIds !== ''
            ? explode(',', trim($rawTenderIds, '[]'))
            : [];

        if (empty($tenderIds)) {
            return $this->badRequest($response);
        }

        $data = $this->repository->getByProjectAndTenderIds($projectId, $tenderIds);

        return $this->respond($response, new ActionPayload(200, $data));
    }

    /**
     * POST shortlisted subcontractors
     */
    public function createShortlistuSbcontractors(Request $request, Response $response, array $args): Response
    {
        $payloadData = $this->getData();
        $payloadRows = is_array($payloadData['data'] ?? null) ? $payloadData['data'] : [];
        $tenderId = (int) ($args['tender_id'] ?? 0);
        $model = $this->repository->getModel();
        $createdIds = [];

        foreach ($payloadRows as $data) {
            if (!is_array($data)) {
                continue;
            }
            $rowTenderId = (int) ($data['tender_id'] ?? $tenderId);
            if (!$rowTenderId || !isset($data['account_id'], $data['status'])) {
                continue;
            }
            $authorId = array_key_exists('author_id', $data) ? (int) $data['author_id'] : null;
            $row = $model->create([
                'tender_id'  => $rowTenderId,
                'account_id' => (int) $data['account_id'],
                'author_id'  => $authorId,
                'status'     => $data['status'],
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
                'ids'     => $createdIds
            ])
        );
    }

    public function updateById(Request $request, Response $response, array $args): Response
    {
        $model = $this->repository->getModel()->load($args["id"]);

        if (!$model->isLoaded()) {
            return $this->notFound($response);
        }

        $updated = $model->store($this->getData());

        return $this->respond(
            $response,
            new ActionPayload(200, [
                'success' => (bool) $updated->getId(),
                'result'     => [
                    'id' => $updated->getId(),
                    'sid' => $updated->getData('account_id')
                ]
            ])
        );
    }
}
