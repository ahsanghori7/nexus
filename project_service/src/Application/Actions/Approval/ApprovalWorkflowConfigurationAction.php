<?php

namespace App\Application\Actions\Approval;

use App\Application\Actions\Action;
use App\Application\Actions\ActionError;
use App\Application\Actions\ActionPayload;
use App\Domain\Approval\ApprovalSatisfaction;
use App\Domain\Approval\ApprovalWorkflowConfigurationRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpBadRequestException;

class ApprovalWorkflowConfigurationAction extends Action
{
  /** @var ApprovalWorkflowConfigurationRepository */
  protected $repository;

  public function __construct(LoggerInterface $logger, ApprovalWorkflowConfigurationRepository $repository)
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
  public function fetchApprovalType(Request $request, Response $response, array $args): Response
  {
    $res = $this->repository->getModel('approvalType')->where('type', $args['approval_type']);
    return $this->respond($response, new ActionPayload(200, $res->get()->toArray()));
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function listApprovalTypes(Request $request, Response $response, array $args): Response
  {
    $res = $this->repository->getModel('approvalType');
    return $this->respond($response, new ActionPayload(200, $res->get()->toArray()));
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function createApprovalWorkflow(Request $request, Response $response, array $args): Response
  {
    try {
      $payload = $this->getData();
      $approvalType = $this->repository->getModel('approvalType')
        ->where(['type' => $args['type']])
        ->first();

      if (!$approvalType) {
        throw new HttpBadRequestException($request, 'invalid approval type');
      }

      $approvalConfigId = $this->upsertApprovalConfiguration(
        (int) $args['aid'],
        (int) $approvalType->getAttributes()['id'],
        $payload
      );

      foreach ($payload['levels'] ?? [] as $item) {
        $this->upsertApprovalLevel($request, $approvalConfigId, $item);
      }

      return $this->noContent($response);
    } catch (\Exception $e) {
      return $this->respond(
        $response,
        new ActionPayload(400, null, new ActionError(ActionError::BAD_REQUEST, $e->getMessage()))
      );
    }
  }

  /**
   * @param array<string, mixed> $payload
   */
  private function upsertApprovalConfiguration(int $accountId, int $approvalTypeId, array $payload): int
  {
    $configuration = $this->repository->getModel('approvalConfiguration')->where([
      'account_id' => $accountId,
      'approval_type_id' => $approvalTypeId,
    ])->first();

    $data = [
      'allow_requester_self_approval' => $payload['allow_requester_self_approval'] ?? false,
      'consolidate_duplicate_approver_notifications' => $payload['consolidate_notifications'] ?? false,
      'auto_complete_lower_approvals' => $payload['auto_complete_lower_approvals'] ?? false,
    ];

    if ($configuration) {
      $configuration->store($data);
      return (int) $configuration->id;
    }

    $data['account_id'] = $accountId;
    $data['approval_type_id'] = $approvalTypeId;
    return (int) $this->repository->getModel('approvalConfiguration')->create($data)->id;
  }

  /**
   * @param array<string, mixed> $item
   */
  private function upsertApprovalLevel(Request $request, int $approvalConfigId, array $item): void
  {
    $approvalLevelId = isset($item['id']) ? (int) $item['id'] : 0;
    $isDeleted = !empty($item['is_deleted']);
    $isThreshold = (int) ($item['is_threshold'] ?? 0) === 1;
    $conditions = $item['conditions'] ?? [];

    if ($isDeleted) {
      if ($approvalLevelId > 0) {
        $this->repository->getModel()->deleteById($approvalLevelId);
      }
      return;
    }

    $levelData = [
      'approval_config_id' => $approvalConfigId,
      'is_threshold' => $item['is_threshold'] ?? 0,
      'sort_order' => $item['sort_order'] ?? null,
      'rule_type' => $item['rule_type'] ?? null,
      'min_required' => $item['min_required'] ?? null,
    ];

    if ($approvalLevelId <= 0) {
      $approvalLevelId = (int) $this->repository->getModel()->create($levelData)->id;
      if ($isThreshold) {
        foreach ($conditions as $condition) {
          if (empty($condition['is_deleted'])) {
            $this->createLevelConditionWithRoles($approvalLevelId, $condition);
          }
        }
      }
    } else {
      $model = $this->repository->getModel()->load($approvalLevelId);
      if (!$model->isLoaded()) {
        throw new HttpBadRequestException($request, 'no record found for the given id');
      }
      $model->store($levelData);
      $this->syncLevelConditions($request, $approvalLevelId, $isThreshold, $conditions);
      $this->repository->getModel('approvalLevelAccountRoleMapping')
        ->where('approval_level_id', $approvalLevelId)
        ->delete();
    }

    if (!$isThreshold) {
      $this->syncLevelRoles($approvalLevelId, $item['roles'] ?? []);
    }
  }

  /**
   * @param array<int, array<string, mixed>> $conditions
   */
  private function syncLevelConditions(
    Request $request,
    int $approvalLevelId,
    bool $isThreshold,
    array $conditions
  ): void {
    foreach ($conditions as $condition) {
      $conditionId = isset($condition['id']) ? (int) $condition['id'] : 0;

      if (!empty($condition['is_deleted'])) {
        if ($conditionId > 0) {
          $this->repository->getModel('approvalLevelCondition')->deleteById($conditionId);
        }
        continue;
      }

      if ($conditionId > 0) {
        $model = $this->repository->getModel('approvalLevelCondition')->load($conditionId);
        if (!$model->isLoaded()) {
          throw new HttpBadRequestException($request, 'no approval level condition record found for the given id');
        }
        $model->store([
          'threshold_type' => $condition['threshold_type'],
          'from_value' => $condition['from_value'] ?? null,
          'to_value' => $condition['to_value'] ?? null,
          'sort_order' => $condition['sort_order'],
          'allow_higher_level_approval' => $condition['allow_higher_level_approval'] ?? 0,
        ]);
        $this->syncConditionRoles($conditionId, $condition['roles'] ?? []);
        continue;
      }

      if ($isThreshold) {
        $this->createLevelConditionWithRoles($approvalLevelId, $condition);
      }
    }
  }

  /**
   * @param array<int, int|string> $roles
   */
  private function syncLevelRoles(int $approvalLevelId, array $roles): void
  {
    foreach ($roles as $roleId) {
      $this->repository->getModel('approvalLevelAccountRoleMapping')->create([
        'approval_level_id' => $approvalLevelId,
        'account_role_id' => $roleId,
      ]);
    }
  }

  /**
   * @param array<int, int|string> $roles
   */
  private function syncConditionRoles(int $conditionId, array $roles): void
  {
    $this->repository->getModel('approvalConditionAccountRoleMapping')
      ->where('approval_level_condition_id', $conditionId)
      ->delete();

    foreach ($roles as $roleId) {
      $this->repository->getModel('approvalConditionAccountRoleMapping')->create([
        'approval_level_condition_id' => $conditionId,
        'account_role_id' => $roleId,
      ]);
    }
  }

  /**
   * @param array<string, mixed> $condition
   */
  private function createLevelConditionWithRoles(int $approvalLevelId, array $condition): void
  {
    $created = $this->repository->getModel('approvalLevelCondition')->create([
      'approval_level_id' => $approvalLevelId,
      'threshold_type' => $condition['threshold_type'],
      'from_value' => $condition['from_value'] ?? null,
      'to_value' => $condition['to_value'] ?? null,
      'sort_order' => $condition['sort_order'],
      'allow_higher_level_approval' => $condition['allow_higher_level_approval'] ?? 0,
    ]);

    $this->syncConditionRoles((int) $created->id, $condition['roles'] ?? []);
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function fetchApprovalLevelRoles(Request $request, Response $response, array $args): Response
  {
    try
    {
      $approvalType = $this->repository->getModel('approvalType')
        ->where('type', $args['approval_type'])
        ->first();
      if (!$approvalType) {
        throw new HttpBadRequestException($request, 'invalid approval type');
      }
      $approvalTypeId = (int) $approvalType->id;

      $configuration = $this->repository->getModel('approvalConfiguration')->where([
        'account_id' => $args['aid'],
        'approval_type_id' => $approvalTypeId,
      ])->first()->toArray();

      if(!$configuration) {
        throw new HttpBadRequestException($request, 'no approval configuration found for the given account and approval type');
      }

      $approvalLevels = $this->repository->getModel('approvalLevel')->where([
        'approval_config_id' => $configuration['id'],
      ])->get()->toArray();

      $rules = [];
      $appendRule = static function (
        array &$rules,
        array $baseRule,
        int $id,
        $thresholdType,
        $fromValue,
        $toValue,
        $sortOrder,
        bool $allowHigherLevelApproval,
        array $roleMappings
      ): void {
        $rules[] = [
          ...$baseRule,
          'id' => $id,
          'threshold_type' => $thresholdType,
          'from_value' => $fromValue,
          'to_value' => $toValue,
          'sort_order' => $sortOrder,
          'allow_higher_level_approval' => $allowHigherLevelApproval,
          'roles' => array_map(static fn(array $mapping): int => (int) $mapping['account_role_id'], $roleMappings),
        ];
      };

      foreach ($approvalLevels as $approvalLevel) {
        $approvalLevelId = (int) $approvalLevel['id'];
        $baseRule = [
          'approval_level_id' => $approvalLevelId,
          'label' => $approvalLevel['label'] ?? null,
          'level_sort_order' => $approvalLevel['sort_order'],
          'approval_type_id' => $configuration['approval_type_id'],
          'is_threshold' => $approvalLevel['is_threshold'],
          'rule_type' => $approvalLevel['rule_type'],
          'min_required' => $approvalLevel['min_required'] ?? null,
        ];

        if ((int) $approvalLevel['is_threshold'] === 0) {
          $levelRoleMappings = $this->repository->getModel('approvalLevelAccountRoleMapping')
            ->where('approval_level_id', $approvalLevelId)
            ->get()
            ->toArray();

          $appendRule(
            $rules,
            $baseRule,
            $approvalLevelId,
            $approvalLevel['threshold_type'] ?? null,
            $approvalLevel['from_value'] ?? null,
            $approvalLevel['to_value'] ?? null,
            $approvalLevel['sort_order'],
            false,
            $levelRoleMappings
          );
          continue;
        }

        $levelConditions = $this->repository->getModel('approvalLevelCondition')
          ->where('approval_level_id', $approvalLevelId)
          ->orderBy('sort_order', 'asc')
          ->get()
          ->toArray();

        if (empty($levelConditions)) {
          throw new HttpBadRequestException(
            $request,
            "threshold approval level {$approvalLevelId} requires at least one condition"
          );
        }

        foreach ($levelConditions as $condition) {
          $conditionId = (int) $condition['id'];
          $conditionRoleMappings = $this->repository->getModel('approvalConditionAccountRoleMapping')
            ->where('approval_level_condition_id', $conditionId)
            ->get()
            ->toArray();

          $appendRule(
            $rules,
            $baseRule,
            $conditionId,
            $condition['threshold_type'] ?? null,
            $condition['from_value'] ?? null,
            $condition['to_value'] ?? null,
            $condition['sort_order'],
            (bool) ($condition['allow_higher_level_approval'] ?? false),
            $conditionRoleMappings
          );
        }
      }

      return $this->respond($response, new ActionPayload(200, [
        'config' => [
          'allow_requester_self_approval' => (bool) $configuration['allow_requester_self_approval'],
          'consolidate_notifications' => (bool) $configuration['consolidate_duplicate_approver_notifications'],
          'auto_complete_lower_approvals' => (bool) $configuration['auto_complete_lower_approvals'],
        ],
        'rules' => $rules,
      ]));
    } catch (\Exception $e) {
      return $this->badRequest($response, $e->getMessage());
    }
  }

    /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function fetchWorkflowConfigurations(Request $request, Response $response, array $args): Response
  {
    $approvalType = $this->repository->getModel('approvalType')
      ->where('type', $args['approval_type'])
      ->first();

    if (!$approvalType) {
      throw new HttpBadRequestException($request, 'invalid approval type');
    }

    $accountId = (int) $args['aid'];
    $approvalTypeId = (int) $approvalType->id;

    $rows = $this->repository->getModel('approvalConfiguration')
      ->leftJoin('approval_level', 'approval_level.approval_config_id', 'approval_configuration.id')
      ->leftJoin('approval_level_condition', 'approval_level_condition.approval_level_id', 'approval_level.id')
      ->leftJoin('approval_level_account_role_mapping', 'approval_level_account_role_mapping.approval_level_id', 'approval_level.id')
      ->leftJoin(
        'approval_condition_account_role_mapping',
        'approval_condition_account_role_mapping.approval_level_condition_id',
        'approval_level_condition.id'
      )
      ->where('approval_configuration.account_id', $accountId)
      ->where('approval_configuration.approval_type_id', $approvalTypeId)
      ->select(
        'approval_configuration.allow_requester_self_approval',
        'approval_configuration.consolidate_duplicate_approver_notifications',
        'approval_configuration.auto_complete_lower_approvals',
        'approval_level.id as level_id',
        'approval_level.is_threshold',
        'approval_level.sort_order as level_sort_order',
        'approval_level.rule_type',
        'approval_level.min_required',
        'approval_level_account_role_mapping.account_role_id as level_account_role_id',
        'approval_level_condition.id as condition_id',
        'approval_level_condition.threshold_type',
        'approval_level_condition.from_value',
        'approval_level_condition.to_value',
        'approval_level_condition.sort_order as condition_sort_order',
        'approval_level_condition.allow_higher_level_approval',
        'approval_condition_account_role_mapping.account_role_id as condition_account_role_id'
      )
      ->orderBy('approval_level.sort_order', 'asc')
      ->orderBy('approval_level_condition.sort_order', 'asc')
      ->get()
      ->toArray();

    $data = $this->nestWorkflowConfigurationRows($rows, $approvalType->display_label, $approvalTypeId);

    return $this->respond($response, new ActionPayload(200, $data));
  }

   /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function fetchWorkflowConfigurationsByOrder(Request $request, Response $response, array $args): Response
  {
    $rows = $this->repository->getModel('approvalConfiguration')
      ->join('approval_type', 'approval_type.id', 'approval_configuration.approval_type_id')
      ->leftJoin('approval_level', 'approval_level.approval_config_id', 'approval_configuration.id')
      ->leftJoin('approval_level_condition', 'approval_level_condition.approval_level_id', 'approval_level.id')
      ->leftJoin('approval_level_account_role_mapping', 'approval_level_account_role_mapping.approval_level_id', 'approval_level.id')
      ->leftJoin(
        'approval_condition_account_role_mapping',
        'approval_condition_account_role_mapping.approval_level_condition_id',
        'approval_level_condition.id'
      )
      ->where('approval_type.type', $args['approval_type'])
      ->where('approval_configuration.account_id', $args['aid'])
      ->select(
        'approval_level.id',
        'approval_configuration.approval_type_id',
        'approval_level.is_threshold',
        'approval_level.sort_order',
        'approval_level.rule_type',
        'approval_level.min_required',
        'approval_level_account_role_mapping.account_role_id as level_account_role_id',
        'approval_level_condition.id as condition_id',
        'approval_level_condition.threshold_type',
        'approval_level_condition.from_value',
        'approval_level_condition.to_value',
        'approval_level_condition.sort_order as condition_sort_order',
        'approval_level_condition.allow_higher_level_approval',
        'approval_condition_account_role_mapping.account_role_id as condition_account_role_id'
      )
      ->orderBy('approval_level.sort_order', 'asc')
      ->orderBy('approval_level_condition.sort_order', 'asc')
      ->get()
      ->toArray();

    return $this->respond($response, new ActionPayload(200, $rows));
  }

  /**
   * One approval_level_workflow row per (entity_id × approval_level_id) using payload ids as stored.
   * First level per entity is in_progress, rest pending.
   *
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function createApprovalWorkflowProcess(Request $request, Response $response, array $args): Response
  {
    try {
      $data = $this->getData();
      $resData = [];

      foreach ($data as $item) {
        $res = $this->repository->getModel('approvalLevelWorkflow')->create($item);
        $resData[] = [
          'approval_level_workflow_id' => $res->id,
          'approval_level_id' => $item['approval_level_id'],
        ];

      }
      return $this->respond($response, new ActionPayload(200, $resData));
    } catch (\Exception $e) {
      return $this->badRequest($response, $e->getMessage());
    }
  }

  public function bulkCreateApprovalLevelWorkflows(Request $request, Response $response, array $args): Response
  {
    try {
      $data = $this->getData();
      $entityType = $data['entity_type'] ?? '';
      $entityIds = $data['entity_ids'] ?? [];
      $rawLevelIds = $data['approval_level_ids'] ?? null;
      if (!is_array($rawLevelIds) || $rawLevelIds === []) {
        $single = isset($data['approval_level_id']) ? (int) $data['approval_level_id'] : 0;
        $rawLevelIds = $single > 0 ? [$single] : [];
      }

      if (!is_string($entityType) || $entityType === '') {
        throw new HttpBadRequestException(
            $request,
            'entity_type is required'
        );
      }

      if (!is_array($entityIds) || $entityIds === []) {
        throw new HttpBadRequestException(
            $request,
            'entity_ids must be a non-empty array'
        );
      }

      $approvalLevelIds = [];
      $seen = [];
      foreach ($rawLevelIds as $v) {
        if (!is_numeric($v) || (int) $v <= 0) {
          continue;
        }
        $lid = (int) $v;
        if (isset($seen[$lid])) {
          continue;
        }
        $seen[$lid] = true;
        $approvalLevelIds[] = $lid;
      }

      if ($approvalLevelIds === []) {
        throw new HttpBadRequestException(
            $request,
            'approval_level_ids or approval_level_id is required'
        );
      }

      $accountId = isset($data['account_id']) ? (int) $data['account_id'] : 0;
      $approvalTypeKey = $data['approval_type'] ?? '';
      if (!is_string($approvalTypeKey)) {
          $approvalTypeKey = '';
      }

      $satisfiedLevels = [];
      foreach ($data['satisfied_levels'] ?? [] as $satisfiedLevel) {
          if (!is_array($satisfiedLevel)) {
              continue;
          }
          $satisfiedEntityId = (int) ($satisfiedLevel['entity_id'] ?? 0);
          $satisfiedLevelId = (int) ($satisfiedLevel['approval_level_id'] ?? 0);
          if ($satisfiedEntityId <= 0 || $satisfiedLevelId <= 0) {
              continue;
          }
          $satisfiedLevels[$satisfiedEntityId . ':' . $satisfiedLevelId] = ApprovalSatisfaction::buildLevelMetaFlags($satisfiedLevel);
      }

      $metaSnapshotByLevel = [];
      foreach ($approvalLevelIds as $lid) {
          $metaSnapshotByLevel[$lid] = $this->snapshotWorkflowLevelMeta(
              $lid,
              $accountId,
              $approvalTypeKey
          );
      }

      $createdMappings = [];

      foreach ($entityIds as $entityId) {
        if (!is_numeric($entityId) || (int) $entityId <= 0) {
          throw new HttpBadRequestException(
              $request,
              'entity_ids must be positive integers'
          );
        }
        $eid = (int) $entityId;

        $inProgressAssigned = false;
        foreach ($approvalLevelIds as $idx => $approvalLevelId) {
          $baseMeta = $metaSnapshotByLevel[$approvalLevelId] ?? [
              'approval_level' => null,
              'approval_level_account_role_mapping' => [],
          ];

          $metaPayload = array_intersect_key(
              $baseMeta,
              array_flip(['approval_level', 'approval_level_account_role_mapping'])
          );

          $levelFlags = $satisfiedLevels[$eid . ':' . $approvalLevelId]
              ?? ApprovalSatisfaction::buildLevelMetaFlags([]);
          $metaPayload = array_merge($metaPayload, $levelFlags, [
              'consolidate_notifications' => !empty($data['consolidate_notifications']),
          ]);

          $status = ApprovalSatisfaction::resolveWorkflowStatus(
              ApprovalSatisfaction::isLevelSatisfied($levelFlags),
              $inProgressAssigned
          );
          $created = $this->repository->getModel('approvalLevelWorkflow')->create([
              'entity_type' => $entityType,
              'entity_id' => $eid,
              'status' => $status,
              'sort_order' => $idx + 1,
              'meta' => json_encode($metaPayload, JSON_THROW_ON_ERROR),
          ]);

          $createdId = (is_object($created) && isset($created->id) && is_numeric($created->id))
              ? (int) $created->id
              : 0;
          $createdMappings[] = [
              'entity_id' => $eid,
              'approval_level_id' => (int) $approvalLevelId,
              'approval_level_workflow_id' => $createdId > 0 ? $createdId : null,
          ];
        }
      }

      return $this->respond($response, new ActionPayload(200, $createdMappings));
    } catch (HttpBadRequestException $e) {
      throw $e;
    } catch (\Exception $e) {
      return $this->badRequest($response, $e->getMessage());
    }
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function fetchApprovalWorkflowProcessByEntity(Request $request, Response $response, array $args): Response
  {
    try {
      $entityType = isset($args['entity_type']) ? (string) $args['entity_type'] : '';
      $entityId = isset($args['entity_id']) ? (int) $args['entity_id'] : 0;
      $queryParams = $request->getQueryParams();
      $status = isset($queryParams['status']) ? (string) $queryParams['status'] : '';

      if ($entityType === '' || $entityId <= 0) {
        throw new HttpBadRequestException(
          $request,
          'entity_type and entity_id are required'
        );
      }

      $query = $this->repository->getModel('approvalLevelWorkflow')
        ->where('entity_type', $entityType)
        ->where('entity_id', $entityId)
        ->orderBy('sort_order', 'asc');

      if ($status === '') {
        return $this->respond($response, new ActionPayload(200, $query->get()->toArray()));
      }

      $row = $query
        ->where('status', $status)
        ->first();

      return $this->respond($response, new ActionPayload(200, $row ? $row->toArray() : null));
    } catch (HttpBadRequestException $e) {
      throw $e;
    } catch (\Exception $e) {
      return $this->badRequest($response, $e->getMessage());
    }
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function completeCurrentAndStartNextWorkflowLevelByEntity(Request $request, Response $response, array $args): Response
  {
    try {
      $entityType = isset($args['entity_type']) ? (string) $args['entity_type'] : '';
      $entityId = isset($args['entity_id']) ? (int) $args['entity_id'] : 0;

      if ($entityType === '' || $entityId <= 0) {
        throw new HttpBadRequestException(
          $request,
          'entity_type and entity_id are required'
        );
      }

      $current = $this->repository->getModel('approvalLevelWorkflow')
        ->where('entity_type', $entityType)
        ->where('entity_id', $entityId)
        ->where('status', 'in_progress')
        ->orderBy('sort_order', 'asc')
        ->first();

      if (!$current) {
        return $this->noContent($response);
      }

      $this->repository->getModel('approvalLevelWorkflow')
        ->where('id', (int) $current->id)
        ->update(['status' => 'completed']);

      $next = $this->repository->getModel('approvalLevelWorkflow')
        ->where('entity_type', $entityType)
        ->where('entity_id', $entityId)
        ->where('status', 'pending')
        ->orderBy('sort_order', 'asc')
        ->first();

      if ($next) {
        $this->repository->getModel('approvalLevelWorkflow')
          ->where('id', (int) $next->id)
          ->update(['status' => 'in_progress']);
      }

      return $this->noContent($response);
    } catch (HttpBadRequestException $e) {
      throw $e;
    } catch (\Exception $e) {
      return $this->badRequest($response, $e->getMessage());
    }
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function deleteApprovalWorkflowProcessByEntity(Request $request, Response $response, array $args): Response
  {
    try {

      $this->repository->getModel('approvalLevelWorkflow')->deleteBy([
        'entity_type' => $args['entity_type'],
        'entity_id' => $args['entity_id']
      ]);
      return $this->noContent($response);

    } catch (\Exception $e) {
      return $this->badRequest($response, $e->getMessage());
    }
  }

  /**
   * Nest flat joined configuration rows into the public GET payload shape.
   *
   * @param array<int, array<string, mixed>> $rows
   * @return array<string, mixed>
   */
  private function nestWorkflowConfigurationRows(array $rows, ?string $displayLabel, int $approvalTypeId): array
  {
    $data = [
      'label' => $displayLabel,
      'allow_requester_self_approval' => false,
      'consolidate_notifications' => false,
      'auto_complete_lower_approvals' => false,
      'approval_levels' => [],
    ];

    if ($rows === []) {
      return $data;
    }

    $first = $rows[0];
    $data['allow_requester_self_approval'] = (bool) ($first['allow_requester_self_approval'] ?? false);
    $data['consolidate_notifications'] = (bool) ($first['consolidate_duplicate_approver_notifications'] ?? false);
    $data['auto_complete_lower_approvals'] = (bool) ($first['auto_complete_lower_approvals'] ?? false);

    $levelsById = [];
    foreach ($rows as $row) {
      $levelId = (int) ($row['level_id'] ?? 0);
      if ($levelId <= 0) {
        continue;
      }

      $isThreshold = (int) ($row['is_threshold'] ?? 0) === 1;

      if (!isset($levelsById[$levelId])) {
        $levelsById[$levelId] = [
          'id' => $levelId,
          'approval_type_id' => $approvalTypeId,
          'is_threshold' => $isThreshold ? 1 : 0,
          'sort_order' => (int) ($row['level_sort_order'] ?? 0),
          'rule_type' => $row['rule_type'] ?? null,
          'min_required' => isset($row['min_required']) && $row['min_required'] !== null
            ? (int) $row['min_required']
            : null,
          'roles' => [],
          'conditions' => [],
        ];
      }

      if (!$isThreshold) {
        $roleId = (int) ($row['level_account_role_id'] ?? 0);
        if ($roleId > 0) {
          $levelsById[$levelId]['roles'][$roleId] = ['id' => (string) $roleId];
        }
        continue;
      }

      $conditionId = (int) ($row['condition_id'] ?? 0);
      if ($conditionId <= 0) {
        continue;
      }

      if (!isset($levelsById[$levelId]['conditions'][$conditionId])) {
        $levelsById[$levelId]['conditions'][$conditionId] = [
          'id' => $conditionId,
          'approval_level_id' => $levelId,
          'threshold_type' => $row['threshold_type'] ?? null,
          'from_value' => $row['from_value'] ?? null,
          'to_value' => $row['to_value'] ?? null,
          'sort_order' => (int) ($row['condition_sort_order'] ?? 0),
          'allow_higher_level_approval' => (bool) ($row['allow_higher_level_approval'] ?? false),
          'roles' => [],
        ];
      }

      $conditionRoleId = (int) ($row['condition_account_role_id'] ?? 0);
      if ($conditionRoleId > 0) {
        $levelsById[$levelId]['conditions'][$conditionId]['roles'][$conditionRoleId] = [
          'id' => (string) $conditionRoleId,
        ];
      }
    }

    $approvalLevels = array_values($levelsById);
    usort($approvalLevels, static fn(array $a, array $b): int => $a['sort_order'] <=> $b['sort_order']);

    foreach ($approvalLevels as &$level) {
      $level['roles'] = array_values($level['roles']);
      $conditions = array_values($level['conditions']);
      usort($conditions, static fn(array $a, array $b): int => $a['sort_order'] <=> $b['sort_order']);
      foreach ($conditions as &$condition) {
        $condition['roles'] = array_values($condition['roles']);
      }
      unset($condition);
      $level['conditions'] = $conditions;
    }
    unset($level);

    $data['approval_levels'] = $approvalLevels;

    return $data;
  }

  /**
   * Build meta fragment: approval_level row + role mappings only.
   *
   * @return array<string, mixed>
   */
  private function snapshotWorkflowLevelMeta(int $payloadLevelRef, int $accountId, string $approvalTypeKey): array
  {
      $level = $this->repository->getModel('approvalLevel')
          ->where('id', $payloadLevelRef)
          ->first();

      if (!$level && $accountId > 0 && $approvalTypeKey !== '') {
          $typeRow = $this->repository->getModel('approvalType')
              ->where('type', $approvalTypeKey)
              ->first();

          if ($typeRow && isset($typeRow->id)) {
              $typeId = (int) $typeRow->id;
              $level = $this->repository->getModel('approvalLevel')
                  ->where('account_id', $accountId)
                  ->where('approval_type_id', $typeId)
                  ->where(function ($q) use ($payloadLevelRef) {
                      $q->where('id', $payloadLevelRef)
                          ->orWhere('sort_order', $payloadLevelRef);
                  })
                  ->orderBy('sort_order')
                  ->first();
          }
      }

      $levelAttrs = null;
      $mappingRows = [];

      if ($level) {
          $levelAttrs = $level->getAttributes();
          $dbLevelId = (int) $level->id;
          $mappingRows = $this->repository->getModel('approvalLevelAccountRoleMapping')
              ->where('approval_level_id', $dbLevelId)
              ->get()
              ->map(function ($row) {
                  return $row->only(['id', 'approval_level_id', 'account_role_id']);
              })
              ->values()
              ->all();
      }

      return [
          'approval_level' => $levelAttrs,
          'approval_level_account_role_mapping' => $mappingRows,
      ];
  }

  /**
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function updateApprovalLevelWorkflow(Request $request, Response $response, array $args): Response
  {
    try {

      $this->repository->getModel('approvalLevelWorkflow')->load($args['id'])->store($this->getData());
      return $this->noContent($response);

    } catch (\Exception $e) {
      return $this->badRequest($response, $e->getMessage());
    }
  }


  /**
   *
   * @param Request $request
   * @param Response $response
   * @param array $args
   * @return Response
   */
  public function fetchApprovalWorkflowProcess(Request $request, Response $response, array $args): Response
  {
    $workflows = $this->repository->getModel('approvalLevelWorkflow')->where('entity_type', $args['entity_type'])
      ->where('entity_id', $args['entity_id'])
      ->orderBy('sort_order', 'asc')->get()->toArray();

    return $this->respond($response, new ActionPayload(200, $workflows));
  }
}
