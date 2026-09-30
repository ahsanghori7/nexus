<?php

namespace App\Application\Actions\Approval;

use App\Application\Actions\Action;
use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use App\Domain\Approval\ApprovalRepository;
use App\Domain\Approval\ApprovalSatisfaction;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class ApprovalAction extends Action
{
  /** @var ApprovalRepository */
  protected $repository;

  public function __construct(LoggerInterface $logger, ApprovalRepository $repository)
  {
      parent::__construct($logger);
      $this->repository = $repository;
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function fetchApprovers(Request $request, Response $response, array $args): Response
  {
    $data = $request->getQueryParams();
    $query = $this->repository->getModel()->where([
        'entity_type' => $data['entity_type'],
        'entity_id' => $data['entity_id']
    ]);

    // Add optional user_id filter
    if (isset($data['user_id'])) {
        $query->where('user_id', $data['user_id']);
    }

    $res = $query->with('status');

    return $this->respond($response, new ActionPayload(200, $res->get()->toArray()));
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function fetchEntitiesByIds(Request $request, Response $response, array $args): Response
  {
    $data = $request->getQueryParams();
    $res = $this->repository->getModel()->whereIn('entity_id', $data['entity_ids'])->where([
      'entity_type' => $data['entity_type']
    ])->with('status');
    return $this->respond($response, new ActionPayload(200, $res->get()->toArray()));
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function assignApprovers(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();
    $defaultStatusId = $this->repository->getModel('approvalStatus')->getLabelId($data['status'] ?? 'Pending');
    $approvedStatusId = $this->repository->getModel('approvalStatus')->getLabelId('Approved');
    foreach ($data['approvers'] as $value) {
      if (!is_array($value)) {
        continue;
      }
      $this->repository->getModel()->create([
          'user_id' => $value['user_id'] ?? 0,
          'requester_user_id' => $data['requester_user_id'] ?? null,
          'entity_type' => $data['entity_type'],
          'entity_id' => $data['entity_id'],
          'status_id' => ApprovalSatisfaction::isApproverSatisfied($value) ? $approvedStatusId : $defaultStatusId,
          'approval_level_workflow_id' => $value['approval_level_workflow_id'] ?? 0,
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
   */
  public function assignSLApprovers(Request $request, Response $response, array $args): Response
  {
    $payload = $this->getData();

    if (isset($payload['entity_id'])) {
        $payload = [$payload];
    }

    foreach ($payload as $data) {
        $defaultStatusId = $this->repository->getModel('approvalStatus')->getLabelId($data['status'] ?? 'Pending');
        $approvedStatusId = $this->repository->getModel('approvalStatus')->getLabelId('Approved');

        if (!empty($data['approvers']) && is_array($data['approvers'])) {
            foreach ($data['approvers'] as $row) {
                if (!is_array($row) || !isset($row['user_id'])) {
                    continue;
                }
                $insert = [
                    'user_id'     => (int) $row['user_id'],
                    'entity_type' => $data['entity_type'],
                    'entity_id'   => $data['entity_id'],
                    'status_id'   => ApprovalSatisfaction::isApproverSatisfied($row) ? $approvedStatusId : $defaultStatusId,
                    'approval_level_workflow_id' => (int) ($row['approval_level_workflow_id'] ?? 0),
                    'meta' => ApprovalSatisfaction::buildApproverMeta($row),
                ];
                $this->repository->getModel()->create($insert);
            }
            continue;
        }
    }
    return $this->noContent($response);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function updateById(Request $request, Response $response, array $args): Response
  {
    $data = $this->getData();
    $status = $this->repository->getModel('approvalStatus')->getLabelId($data['status']);
    unset($data['status']);

    $data['status_id'] = $status;
    $model = $this->repository->getModel()->load($args['id']);

    if (!$model->isLoaded()) {
      throw new HttpBadRequestException(
        $request,
        'no record found for the given id'
      );
    }

    $model->store($data);
    return $this->noContent($response);
  }

  /**
   * Remove approvals row; when none remain for a shortlisted subcontractor, drop workflow rows too.
   *
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function deleteById(Request $request, Response $response, array $args): Response
  {
      $approvalId = (int) $args['id'];
      $model = $this->repository->getModel()->load($approvalId);

      if (!$model->isLoaded()) {
          throw new HttpBadRequestException(
              $request,
              'no record found for the given id'
          );
      }

      $row = $model->getData(null);
      $entityTypeId = isset($row['entity_id']) ? (int) $row['entity_id'] : 0;
      $entityType = isset($row['entity_type']) ? (string) $row['entity_type'] : '';

      if ($entityTypeId > 0) {
              $this->repository->getModel('approvalLevelWorkflow')
                  ->where('entity_type', $entityType)
                  ->where('entity_id', $entityTypeId)
                  ->delete();
      }

      $model->deleteById($approvalId);

      return $this->noContent($response);
  }

  function deleteBulkByEntity(Request $request, Response $response, array $args): Response
  {
    $entityTypeId = (int) $args['entity_id'];
    $entityType = (string) $args['entity_type'];

    $approvals = $this->repository->getModel()->where([
      'entity_type' => $entityType,
      'entity_id' => $entityTypeId
    ]);

    if ($approvals->exists()) {
      $approvals->delete();
    }

    return $this->noContent($response);
  }

      /**
     * @param Request $request
     * @param Response $response
     * @param array $args
     * @return Response
     */
    public function listTypes(Request $request, Response $response, array $args): Response
    {
        return $this->listByModel($response, "approvalStatus");
    }
}
