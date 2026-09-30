<?php

namespace Api\Middleware;

use Core\Service\Manager;

/**
 * Shared multilevel approval decision helpers.
 */
class ApprovalSatisfactionHelper
{
    public const SENT_FOR_APPROVAL_LOG_TYPE = 'Sent For Approval';

    /**
     * Latest approval cycle instance from Sent For Approval logs.
     * Reads meta.approver_assign.instance (order/TR/TI) or meta.instance.
     * When $fallbackToLogCount is true and no instance is present (flat TI logs),
     * returns the count of matching logs.
     */
    public static function getLatestSentForApprovalInstance(
        string $entityType,
        int $entityId,
        string $logType = self::SENT_FOR_APPROVAL_LOG_TYPE,
        bool $fallbackToLogCount = false
    ): int {
        $pageLimit = 200;
        $offset = 0;
        $lastInstance = 0;
        $totalLogs = 0;

        while (true) {
            $existingLogsRaw = Manager::getService("project")
                ->fetch("logs", [
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                    'type' => $logType,
                    'limit' => $pageLimit,
                    'offset' => $offset,
                ])
                ->getShape("data")
                ->toArray();

            if (is_array($existingLogsRaw) && isset($existingLogsRaw['id'])) {
                $existingLogs = [$existingLogsRaw];
            } elseif (is_array($existingLogsRaw)) {
                $existingLogs = array_values(array_filter($existingLogsRaw, static fn ($row) => is_array($row)));
            } else {
                $existingLogs = [];
            }

            if ($existingLogs === []) {
                break;
            }

            $totalLogs += count($existingLogs);

            foreach ($existingLogs as $existingLog) {
                $meta = $existingLog['meta'] ?? null;
                $decodedMeta = null;
                if (is_string($meta) && $meta !== '') {
                    $decodedMeta = json_decode($meta, true);
                } elseif (is_array($meta)) {
                    $decodedMeta = $meta;
                }
                if (!is_array($decodedMeta)) {
                    continue;
                }
                $instance = (int) (
                    $decodedMeta['approver_assign']['instance']
                    ?? $decodedMeta['instance']
                    ?? 0
                );
                if ($instance > $lastInstance) {
                    $lastInstance = $instance;
                }
            }

            if (count($existingLogs) < $pageLimit) {
                break;
            }
            $offset += $pageLimit;
        }

        if ($lastInstance === 0 && $fallbackToLogCount) {
            return $totalLogs;
        }

        return $lastInstance;
    }

    /**
     * Current level complete after this user's approval?
     * Rule-first (same semantics as isLevelSatisfiedByRule):
     * - any → approved >= 1
     * - custom → approved >= min_required
     * - all (default) → approved >= assigned count on the level
     *
     * @param array<int, array> $levelApprovals
     */
    public static function isLevelCompleteAfterApproval(
        array $levelApprovals,
        int $sessionUserId,
        ?array $approvalLevelConfig = null,
        bool $countCurrentUserAsApproved = true
    ): bool {
        $ruleType = strtolower((string) ($approvalLevelConfig['rule_type'] ?? 'all'));
        $approved = 0;
        $assigned = 0;
        $currentApproved = false;

        foreach ($levelApprovals as $item) {
            if (!is_array($item)) {
                continue;
            }
            $userId = (int) ($item['user_id'] ?? $item['approver_user_id'] ?? 0);
            if ($userId <= 0) {
                continue;
            }
            $assigned++;
            $status = strtolower(self::statusLabel($item));
            if ($status === 'approved') {
                $approved++;
                $currentApproved = $currentApproved || $userId === $sessionUserId;
            }
        }

        if ($countCurrentUserAsApproved && !$currentApproved && $sessionUserId > 0) {
            $approved++;
        }

        return self::isLevelSatisfiedByRule(
            $ruleType,
            $approved,
            $assigned,
            (int) ($approvalLevelConfig['min_required'] ?? 0)
        );
    }

    public static function isLevelSatisfiedByRule(
        string $ruleType,
        int $approvedCount,
        int $requiredApproverCount,
        int $minRequired = 0
    ): bool {
        return match (strtolower(trim($ruleType))) {
            'any' => $approvedCount >= 1,
            'custom' => $approvedCount >= max(1, $minRequired),
            default => $requiredApproverCount > 0 && $approvedCount >= $requiredApproverCount,
        };
    }

    /**
     * @param array<int, array> $workflowRows
     */
    public static function hasNextPendingLevel(array $workflowRows, int $currentSortOrder): bool
    {
        return self::findNextPendingWorkflow($workflowRows, $currentSortOrder) !== null;
    }

    /**
     * @param array<int, array> $workflowRows
     */
    public static function findNextPendingWorkflow(array $workflowRows, int $currentSortOrder): ?array
    {
        $next = null;
        $nextSort = null;

        foreach ($workflowRows as $row) {
            $sort = (int) ($row['sort_order'] ?? 0);
            if (
                !is_array($row)
                || strtolower((string) ($row['status'] ?? '')) !== 'pending'
                || $sort <= $currentSortOrder
            ) {
                continue;
            }
            if ($nextSort === null || $sort < $nextSort) {
                $nextSort = $sort;
                $next = $row;
            }
        }

        return $next;
    }

    /**
     * @param array<int, array> $levelApprovals
     * @param array<int, array> $workflowRows
     * @return array{
     *   is_level_complete: bool,
     *   is_approval_complete: bool,
     *   has_next_level: bool,
     *   next_workflow: ?array
     * }
     */
    public static function evaluateAfterApproval(
        array $levelApprovals,
        int $sessionUserId,
        ?array $approvalLevelConfig,
        array $workflowRows,
        int $currentSortOrder,
        bool $countCurrentUserAsApproved = true
    ): array {
        $isLevelComplete = self::isLevelCompleteAfterApproval(
            $levelApprovals,
            $sessionUserId,
            $approvalLevelConfig,
            $countCurrentUserAsApproved
        );
        $nextWorkflow = $isLevelComplete
            ? self::findNextPendingWorkflow($workflowRows, $currentSortOrder)
            : null;

        return [
            'is_level_complete' => $isLevelComplete,
            'is_approval_complete' => $isLevelComplete && $nextWorkflow === null,
            'has_next_level' => $nextWorkflow !== null,
            'next_workflow' => $nextWorkflow,
        ];
    }

    private static function statusLabel(array $item): string
    {
        return (string) ($item['status']['label'] ?? (is_string($item['status'] ?? null) ? $item['status'] : ''));
    }

    /**
     * readable rule label (approval level config).
     * @param array<string, mixed> $levelConfig
     */
    public static function formatRuleLabel(array $levelConfig): string
    {
        return match (strtolower((string) ($levelConfig['rule_type'] ?? 'all'))) {
            'any' => 'Anyone can approve',
            'custom' => sprintf(
                'Any %d from %d must approve',
                (int) ($levelConfig['min_required'] ?? 0),
                is_array($levelConfig['roles'] ?? null) ? count($levelConfig['roles']) : 0
            ),
            default => 'All must approve',
        };
    }

    /**
     * Order-style assigned-approvers payload: { [entityId]: { isLevel, approvals } }.
     *
     * @param array<int, array<string, mixed>> $workflowRows
     * @param array<int, array<string, mixed>> $approvalRows
     * @param array<int, array<string, mixed>> $users
     * @return array<int, array{isLevel: bool, approvals: array}>
     */
    public static function buildAssignedApproversByEntity(
        int $entityId,
        array $workflowRows,
        array $approvalRows,
        array $users,
        ?callable $convertToUKTime = null
    ): array {
        $workflowById = [];
        foreach ($workflowRows as $row) {
            $workflowId = (int) ($row['id'] ?? 0);
            if (!$workflowId) {
                continue;
            }
            $metaRaw = $row['meta'] ?? null;
            $meta = is_string($metaRaw) ? (json_decode($metaRaw, true) ?: []) : (is_array($metaRaw) ? $metaRaw : []);
            $levelConfig = is_array($meta['approval_level'] ?? null) ? $meta['approval_level'] : $meta;
            $workflowById[$workflowId] = [
                'id' => $workflowId,
                'status' => $row['status'] ?? 'pending',
                'sort_order' => (int) ($row['sort_order'] ?? $levelConfig['sort_order'] ?? 0),
                'meta' => $levelConfig,
                'meta_raw' => is_string($metaRaw) ? $metaRaw : json_encode($meta),
            ];
        }

        $usersById = [];
        foreach ($users as $user) {
            $usersById[(int) ($user['id'] ?? 0)] = $user;
        }

        $result = [
            $entityId => [
                'isLevel' => false,
                'approvals' => [],
            ],
        ];

        foreach ($approvalRows as $item) {
            $userId = (int) ($item['user_id'] ?? 0);
            $item['user'] = $usersById[$userId] ?? null;
            $item['approver_user_id'] = $userId;
            if ($convertToUKTime) {
                $item['created_at'] = $convertToUKTime($item['created_at'] ?? null);
                $item['updated_at'] = $convertToUKTime($item['updated_at'] ?? null);
            }

            $workflow = $workflowById[(int) ($item['approval_level_workflow_id'] ?? 0)] ?? null;
            if (!$workflow || empty($workflow['meta'])) {
                $result[$entityId]['approvals'][] = $item;
                continue;
            }

            $result[$entityId]['isLevel'] = true;
            $levelConfig = $workflow['meta'];
            $sortOrder = (int) ($levelConfig['sort_order'] ?? $workflow['sort_order'] ?? 0);

            if (!isset($result[$entityId]['approvals'][$sortOrder])) {
                $result[$entityId]['approvals'][$sortOrder] = [
                    'level' => $sortOrder,
                    'rule' => self::formatRuleLabel($levelConfig),
                    'status' => $workflow['status'] === 'pending' ? 'locked' : $workflow['status'],
                    'approvers' => [],
                ];
            }

            $item['approval_level_workflow'] = [
                'id' => $workflow['id'],
                'status' => $workflow['status'],
                'meta' => $workflow['meta_raw'],
            ];
            $result[$entityId]['approvals'][$sortOrder]['approvers'][] = $item;
        }

        return $result;
    }

  public static function isApproverSatisfied(array $row): bool
  {
    return !empty($row['is_satisfied_by_self_approved'])
      || !empty($row['is_satisfied_by_higher_authority'])
      || !empty($row['is_level_satisfied_by_self_approved'])
      || !empty($row['is_level_satisfied_by_higher_authority']);
  }

  /**
   * Cascade same-user approvals across levels only when the workflow was assigned with
   * consolidation enabled. The flag is snapshotted into workflow meta at assign time.
   *
   * @param array<string, mixed>|string|null $currentWorkflowMeta
   * @param array<int, array<string, mixed>> $pendingWorkflows
   * @param array<int, array<string, mixed>> $allApprovals
   * @return array{
   *   actions: array<int, array{workflow_id: int, approval_id: int, level_complete: bool}>,
   *   remaining_pending: array<int, array<string, mixed>>
   * }
   */
  public static function planCrossLevelCascadesIfEnabled(
    $currentWorkflowMeta,
    array $pendingWorkflows,
    array $allApprovals,
    int $userId,
    string $userIdKey = 'user_id'
  ): array {
    $meta = self::decodeMeta($currentWorkflowMeta);

    if (empty($meta['consolidate_notifications'])) {
      return ['actions' => [], 'remaining_pending' => array_values($pendingWorkflows)];
    }

    return self::planCrossLevelCascades($pendingWorkflows, $allApprovals, $userId, $userIdKey);
  }

  /** Skip satisfied / Approved / cascaded approvers for email. */
  public static function shouldNotifyApprover(array $row, array $cascadeActions = []): bool
  {
    if (self::isApproverSatisfied($row)) {
      return false;
    }
    $status = $row['status'] ?? null;
    $label = is_array($status) ? ($status['label'] ?? '') : $status;
    if (strcasecmp((string) $label, 'Approved') === 0) {
      return false;
    }
    $id = (int) ($row['id'] ?? 0);
    foreach ($cascadeActions as $action) {
      if ($id && (int) ($action['approval_id'] ?? 0) === $id) {
        return false;
      }
    }

    return true;
  }

  public static function isLevelSatisfied(array $row): bool
  {
    return !empty($row['is_level_satisfied_by_self_approved'])
      || !empty($row['is_level_satisfied_by_higher_authority']);
  }

  public static function approverEntryType(array $row): string
  {
    return self::isApproverSatisfied($row) ? 'approved' : 'pending';
  }

  public static function isRuleSatisfied(string $ruleType, int $approvedCount, int $totalApprovers, ?int $minRequired = null): bool
  {
    return match ($ruleType) {
      'any' => $approvedCount >= 1,
      'custom' => $minRequired !== null && $approvedCount >= $minRequired,
      default => $approvedCount >= $totalApprovers,
    };
  }

  /**
   * @param mixed $meta
   * @return array{rule_type: string, min_required: int, required_approver_count: int}
   */
  public static function resolveWorkflowRule($meta, ?int $fallbackRequiredCount = null): array
  {
    $decoded = self::decodeMeta($meta);
    $level = is_array($decoded['approval_level'] ?? null) ? $decoded['approval_level'] : [];
    $mappings = is_array($decoded['approval_level_account_role_mapping'] ?? null)
      ? $decoded['approval_level_account_role_mapping']
      : [];

    $minRequired = (int) ($level['min_required'] ?? $decoded['min_required'] ?? 0);

    return [
      'rule_type' => strtolower((string) ($level['rule_type'] ?? $decoded['rule_type'] ?? 'all')),
      'min_required' => $minRequired > 0 ? $minRequired : 1,
      'required_approver_count' => max(0, (int) ($fallbackRequiredCount ?? count($mappings))),
    ];
  }

  /**
   * @param array<string, mixed> $row
   */
  public static function approvalStatusLabel(array $row): string
  {
    $status = $row['status'] ?? null;
    if (is_array($status)) {
      return strtolower((string) ($status['label'] ?? ''));
    }

    return strtolower((string) ($status ?? ''));
  }

  /**
   * @param array<int, array<string, mixed>> $levelApprovals
   * @return array{approved_count: int, unique_user_count: int, user_row: ?array, other_pending: int}
   */
  private static function summarizeLevelApprovals(
    array $levelApprovals,
    int $userId,
    string $userIdKey,
    bool $countCurrentUserAsApproved
  ): array {
    $approvedCount = 0;
    $uniqueUserIds = [];
    $userRow = null;
    $otherPending = 0;

    foreach ($levelApprovals as $row) {
      if (!is_array($row)) {
        continue;
      }
      $uid = (int) ($row[$userIdKey] ?? 0);
      if ($uid <= 0) {
        continue;
      }
      $uniqueUserIds[$uid] = true;
      $label = self::approvalStatusLabel($row);
      $isCurrent = $uid === $userId;
      if ($isCurrent) {
        $userRow = $row;
      }
      if ($label === 'approved' || ($countCurrentUserAsApproved && $isCurrent)) {
        $approvedCount++;
      } elseif ($label === 'pending' && !$isCurrent) {
        $otherPending++;
      }
    }

    return [
      'approved_count' => $approvedCount,
      'unique_user_count' => count($uniqueUserIds),
      'user_row' => $userRow,
      'other_pending' => $otherPending,
    ];
  }

  private static function totalApproversForRule(array $rule, int $uniqueUserCount): int
  {
    return $rule['required_approver_count'] > 0
      ? $rule['required_approver_count']
      : $uniqueUserCount;
  }

  /**
   * @param mixed $workflowMeta
   * @param array<int, array<string, mixed>> $levelApprovals
   * @return array{approval_id: int|null, level_complete: bool}
   */
  private static function evaluateUserApproveOnLevel(
    $workflowMeta,
    array $levelApprovals,
    int $userId,
    string $userIdKey,
    bool $countCurrentUserAsApproved
  ): array {
    $summary = self::summarizeLevelApprovals(
      $levelApprovals,
      $userId,
      $userIdKey,
      $countCurrentUserAsApproved
    );
    $userRow = $summary['user_row'];
    $approvalId = null;
    if ($userRow !== null && self::approvalStatusLabel($userRow) === 'pending') {
      $id = (int) ($userRow['id'] ?? 0);
      $approvalId = $id > 0 ? $id : null;
    }

    if ($summary['other_pending'] === 0 && $countCurrentUserAsApproved) {
      return ['approval_id' => $approvalId, 'level_complete' => true];
    }

    $approvedCount = $summary['approved_count'];
    if (!$countCurrentUserAsApproved && $approvalId !== null) {
      $approvedCount++;
    }

    $rule = self::resolveWorkflowRule($workflowMeta, $summary['unique_user_count']);

    return [
      'approval_id' => $approvalId,
      'level_complete' => self::isRuleSatisfied(
        $rule['rule_type'],
        $approvedCount,
        self::totalApproversForRule($rule, $summary['unique_user_count']),
        $rule['min_required']
      ),
    ];
  }

  /**
   * Same user Pending on another level → auto-approve their row.
   * Level completes only when the rule is satisfied after that (e.g. "any").
   *
   * @param mixed $workflowMeta
   * @param array<int, array<string, mixed>> $levelApprovals
   * @return array{approval_id: int, level_complete: bool}|null
   */
  public static function resolveCascadeApproval(
    $workflowMeta,
    array $levelApprovals,
    int $userId,
    string $userIdKey = 'user_id'
  ): ?array {
    if ($userId <= 0 || $levelApprovals === []) {
      return null;
    }

    $result = self::evaluateUserApproveOnLevel(
      $workflowMeta,
      $levelApprovals,
      $userId,
      $userIdKey,
      false
    );
    if ($result['approval_id'] === null) {
      return null;
    }

    return [
      'approval_id' => $result['approval_id'],
      'level_complete' => $result['level_complete'],
    ];
  }

  /**
   * @param mixed $workflowMeta
   * @param array<int, array<string, mixed>> $levelApprovals
   */
  public static function isLevelCompleteAfterUserApprove(
    $workflowMeta,
    array $levelApprovals,
    int $userId,
    string $userIdKey = 'user_id'
  ): bool {
    return self::evaluateUserApproveOnLevel(
      $workflowMeta,
      $levelApprovals,
      $userId,
      $userIdKey,
      true
    )['level_complete'];
  }

  /**
   * Index approval rows by approval_level_workflow_id (one pass).
   *
   * @param array<int, array<string, mixed>> $approvals
   * @return array<int, array<int, array<string, mixed>>>
   */
  public static function groupApprovalsByWorkflowId(array $approvals): array
  {
    $grouped = [];
    foreach ($approvals as $row) {
      if (!is_array($row)) {
        continue;
      }
      $workflowId = (int) ($row['approval_level_workflow_id'] ?? 0);
      if ($workflowId <= 0) {
        continue;
      }
      $grouped[$workflowId][] = $row;
    }

    return $grouped;
  }

  /**
   * Plan cross-level cascade updates for pending workflows (no HTTP).
   *
   * @param array<int, array<string, mixed>> $pendingWorkflows
   * @param array<int, array<string, mixed>> $allApprovals
   * @return array{
   *   actions: array<int, array{workflow_id: int, approval_id: int, level_complete: bool}>,
   *   remaining_pending: array<int, array<string, mixed>>
   * }
   */
  public static function planCrossLevelCascades(
    array $pendingWorkflows,
    array $allApprovals,
    int $userId,
    string $userIdKey = 'user_id'
  ): array {
    $byWorkflow = self::groupApprovalsByWorkflowId($allApprovals);
    $actions = [];
    $completedIds = [];

    foreach ($pendingWorkflows as $workflow) {
      if (!is_array($workflow)) {
        continue;
      }
      $workflowId = (int) ($workflow['id'] ?? 0);
      if ($workflowId <= 0) {
        continue;
      }
      $cascade = self::resolveCascadeApproval(
        $workflow['meta'] ?? [],
        $byWorkflow[$workflowId] ?? [],
        $userId,
        $userIdKey
      );
      if ($cascade === null) {
        continue;
      }
      $actions[] = [
        'workflow_id' => $workflowId,
        'approval_id' => $cascade['approval_id'],
        'level_complete' => $cascade['level_complete'],
      ];
      if ($cascade['level_complete']) {
        $completedIds[$workflowId] = true;
      }
    }

    $remaining = $completedIds === []
      ? array_values(array_filter($pendingWorkflows, static fn ($row) => is_array($row)))
      : array_values(array_filter(
        $pendingWorkflows,
        static fn ($row) => is_array($row) && !isset($completedIds[(int) ($row['id'] ?? 0)])
      ));

    return [
      'actions' => $actions,
      'remaining_pending' => $remaining,
    ];
  }

  /**
   * @param bool $inProgressAssigned set true after the first non-satisfied level is marked in_progress
   */
  public static function resolveWorkflowStatus(bool $isLevelSatisfied, bool &$inProgressAssigned): string
  {
    if ($isLevelSatisfied) {
      return 'completed';
    }

    if (!$inProgressAssigned) {
      $inProgressAssigned = true;

      return 'in_progress';
    }

    return 'pending';
  }

  /**
   * Recompute level.status for GET log snapshots from merged entries.
   *
   * @param array<int, array<string, mixed>> $levels
   * @return array<int, array<string, mixed>>
   */
  public static function applyLogLevelProgression(
    array $levels,
    string $completedStatus = 'completed',
    string $activeStatus = 'in_progress'
  ): array {
    $priorLevelsComplete = true;

    foreach ($levels as &$level) {
      if (self::isLevelSatisfied($level)) {
        $level['status'] = $completedStatus;
        continue;
      }

      $approvedCount = 0;
      foreach ($level['entries'] ?? [] as $entry) {
        $type = strtolower((string) ($entry['type'] ?? 'pending'));
        if ($type === 'rejected') {
          $level['status'] = 'rejected';
          $priorLevelsComplete = false;
          continue 2;
        }
        if ($type === 'approved') {
          $approvedCount++;
        }
      }

      $total = count($level['entries'] ?? []);
      $ruleType = strtolower((string) ($level['rule'] ?? 'all'));
      $minRequired = (int) ($level['min_required'] ?? 0);
      if ($ruleType === 'custom' && $minRequired <= 0) {
        $minRequired = 1;
      }

      if ($total > 0 && self::isRuleSatisfied(
        $ruleType,
        $approvedCount,
        $total,
        $ruleType === 'custom' ? $minRequired : null
      )) {
        $level['status'] = $completedStatus;
        continue;
      }

      $level['status'] = $priorLevelsComplete ? $activeStatus : 'pending';
      $priorLevelsComplete = false;
    }
    unset($level);

    return $levels;
  }

  /**
   * @param array<string, mixed> $entry
   * @return array<string, mixed>
   */
  public static function finalizeLogEntryForGet(array $entry, ?string $logType = null): array
  {
    $entry['label'] = null;
    if (self::isApproverSatisfied($entry)) {
      $resolved = self::resolveApprovalLogLabel($entry);
      if ($resolved !== 'Approved') {
        $entry['label'] = $resolved;
      }
    }

    return self::stripSatisfactionFlagsForGet($entry);
  }

  /**
   * @param array<int, array<string, mixed>> $levels
   * @return array<int, array<string, mixed>>
   */
  public static function finalizeLogLevelsForGet(
    array $levels,
    string $completedStatus = 'completed',
    string $activeStatus = 'in_progress'
  ): array {
    $levels = self::applyLogLevelProgression($levels, $completedStatus, $activeStatus);
    foreach ($levels as &$level) {
      $level = self::stripSatisfactionFlagsForGet($level);
    }
    unset($level);

    return $levels;
  }

  /**
   * @param array<int, array<string, mixed>> $rows
   */
  public static function isLevelSatisfiedFromRows(array $rows): bool
  {
    return self::isLevelSatisfied(self::buildLevelMetaFlagsFromRows($rows));
  }

  /**
   * @param array<string, mixed> $row
   * @return array{
   *   is_satisfied_by_self_approved: bool,
   *   is_satisfied_by_higher_authority: bool,
   *   is_level_satisfied_by_self_approved: bool,
   *   is_level_satisfied_by_higher_authority: bool
   * }
   */
  public static function extractFlags(array $row): array
  {
    $levelSelfApproved = !empty($row['is_level_satisfied_by_self_approved']);
    $levelHigherAuthority = !empty($row['is_level_satisfied_by_higher_authority']);

    return [
      'is_satisfied_by_self_approved' => $levelSelfApproved || !empty($row['is_satisfied_by_self_approved']),
      'is_satisfied_by_higher_authority' => $levelHigherAuthority || !empty($row['is_satisfied_by_higher_authority']),
      'is_level_satisfied_by_self_approved' => $levelSelfApproved,
      'is_level_satisfied_by_higher_authority' => $levelHigherAuthority,
    ];
  }

  /**
   * GET response flags from approval.meta, optionally OR'd with workflow/level meta.
   *
   * @param mixed $approvalMeta
   * @param mixed $levelMeta
   * @return array{
   *   is_satisfied_by_self_approved: bool,
   *   is_satisfied_by_higher_authority: bool,
   *   is_level_satisfied_by_self_approved: bool,
   *   is_level_satisfied_by_higher_authority: bool
   * }
   */
  public static function resolveResponseFlags($approvalMeta = null, $levelMeta = null): array
  {
    $flags = self::extractFlags(self::decodeMeta($approvalMeta));
    $levelFlags = self::levelLogFlags(self::decodeMeta($levelMeta));

    return [
      'is_satisfied_by_self_approved' => $flags['is_satisfied_by_self_approved'],
      'is_satisfied_by_higher_authority' => $flags['is_satisfied_by_higher_authority'],
      'is_level_satisfied_by_self_approved' => $levelFlags['is_level_satisfied_by_self_approved']
        || $flags['is_level_satisfied_by_self_approved'],
      'is_level_satisfied_by_higher_authority' => $levelFlags['is_level_satisfied_by_higher_authority']
        || $flags['is_level_satisfied_by_higher_authority'],
    ];
  }

  /**
   * @param array<int, array<string, mixed>> $approvers
   * @param mixed $levelMeta
   * @return array<int, array<string, mixed>>
   */
  public static function applyLevelFlagsToApprovers(array $approvers, $levelMeta): array
  {
    $levelFlags = self::levelLogFlags(self::decodeMeta($levelMeta));
    foreach ($approvers as &$approver) {
      if (!is_array($approver)) {
        continue;
      }
      $approver['is_level_satisfied_by_self_approved'] = $levelFlags['is_level_satisfied_by_self_approved']
        || !empty($approver['is_level_satisfied_by_self_approved']);
      $approver['is_level_satisfied_by_higher_authority'] = $levelFlags['is_level_satisfied_by_higher_authority']
        || !empty($approver['is_level_satisfied_by_higher_authority']);
    }
    unset($approver);

    return $approvers;
  }

  /**
   * @param array<string, mixed> $row
   * @return array{is_level_satisfied_by_self_approved: bool, is_level_satisfied_by_higher_authority: bool}
   */
  public static function buildLevelMetaFlags(array $row): array
  {
    return [
      'is_level_satisfied_by_self_approved' => !empty($row['is_level_satisfied_by_self_approved']),
      'is_level_satisfied_by_higher_authority' => !empty($row['is_level_satisfied_by_higher_authority']),
    ];
  }

  /**
   * @param array<int, array<string, mixed>> $rows
   * @return array{is_level_satisfied_by_self_approved: bool, is_level_satisfied_by_higher_authority: bool}
   */
  public static function buildLevelMetaFlagsFromRows(array $rows): array
  {
    $flags = self::buildLevelMetaFlags([]);
    foreach ($rows as $row) {
      if (!is_array($row)) {
        continue;
      }
      $flags['is_level_satisfied_by_self_approved'] = $flags['is_level_satisfied_by_self_approved']
        || !empty($row['is_level_satisfied_by_self_approved']);
      $flags['is_level_satisfied_by_higher_authority'] = $flags['is_level_satisfied_by_higher_authority']
        || !empty($row['is_level_satisfied_by_higher_authority']);
    }

    return $flags;
  }

  /**
   * @param array<string, mixed> $row
   * @return array{is_satisfied_by_self_approved: bool, is_satisfied_by_higher_authority: bool}
   */
  public static function approverLogFlags(array $row): array
  {
    return [
      'is_satisfied_by_self_approved' => !empty($row['is_level_satisfied_by_self_approved'])
        || !empty($row['is_satisfied_by_self_approved']),
      'is_satisfied_by_higher_authority' => !empty($row['is_level_satisfied_by_higher_authority'])
        || !empty($row['is_satisfied_by_higher_authority']),
    ];
  }

  /**
   * @param array<string, mixed> $row
   * @return array{is_level_satisfied_by_self_approved: bool, is_level_satisfied_by_higher_authority: bool}
   */
  public static function levelLogFlags(array $row): array
  {
    return self::buildLevelMetaFlags($row);
  }

  /**
   * @param mixed $meta
   * @return array<string, mixed>
   */
  public static function decodeMeta($meta): array
  {
    if (is_array($meta)) {
      return $meta;
    }
    if (is_string($meta) && $meta !== '') {
      $decoded = json_decode($meta, true);

      return is_array($decoded) ? $decoded : [];
    }

    return [];
  }

  /**
   * @param array<int, array<string, mixed>> $approverRows
   * @return array<int, array{is_level_satisfied_by_self_approved: bool, is_level_satisfied_by_higher_authority: bool}>
   */
  public static function levelFlagsByLevelId(array $approverRows): array
  {
    $rowsByLevel = [];
    foreach ($approverRows as $row) {
      if (!is_array($row)) {
        continue;
      }
      $levelId = (int) ($row['approval_level_id'] ?? 0);
      if ($levelId <= 0) {
        continue;
      }
      $rowsByLevel[$levelId][] = $row;
    }

    $flagsByLevel = [];
    foreach ($rowsByLevel as $levelId => $rows) {
      $flagsByLevel[$levelId] = self::buildLevelMetaFlagsFromRows($rows);
    }

    return $flagsByLevel;
  }

  /**
   * Resolve display reason from satisfaction flags stored on log/entry meta.
   *
   * @param array<string, mixed> $flags
   */
  public static function resolveApprovalLogLabel(array $flags): string
  {
    if (!empty($flags['is_satisfied_by_self_approved'])
      || !empty($flags['is_level_satisfied_by_self_approved'])) {
      return 'Self-approved by requester';
    }

    if (!empty($flags['is_satisfied_by_higher_authority'])
      || !empty($flags['is_level_satisfied_by_higher_authority'])) {
      return 'Satisfied by Higher Authority';
    }

    return 'Approved';
  }

  /**
   * @param array<string, mixed> $workflowRow
   */
  public static function workflowApprovalLevelId(array $workflowRow): ?int
  {
    $meta = $workflowRow['meta'] ?? [];
    if (is_string($meta)) {
      $decoded = json_decode($meta, true);
      $meta = is_array($decoded) ? $decoded : [];
    }
    if (!is_array($meta)) {
      return null;
    }

    $approvalLevel = $meta['approval_level'] ?? null;
    if (!is_array($approvalLevel) || !isset($approvalLevel['id'])) {
      return null;
    }

    return (int) $approvalLevel['id'];
  }

  /**
   * Build Approved audit log rows for cross-level cascade actions.
   *
   * @param array{
   *   actions: array<int, array{workflow_id: int, approval_id: int, level_complete: bool}>,
   *   remaining_pending: array<int, array<string, mixed>>
   * } $cascadePlan
   * @param array<int, array<string, mixed>> $workflowRows
   * @param array<int, array<string, mixed>> $allApprovals
   * @return array<int, array<string, mixed>>
   */
  public static function buildCascadeApprovalLogEntries(
    array $cascadePlan,
    array $workflowRows,
    array $allApprovals,
    int $entityId,
    string $entityType,
    int $instance,
    string $userDisplayName,
    string $message,
    string $comment = '',
    string $approvalUserIdKey = 'user_id'
  ): array {
    if (($cascadePlan['actions'] ?? []) === []) {
      return [];
    }

    $workflowsById = [];
    foreach ($workflowRows as $row) {
      if (!is_array($row)) {
        continue;
      }
      $workflowId = (int) ($row['id'] ?? 0);
      if ($workflowId > 0) {
        $workflowsById[$workflowId] = $row;
      }
    }

    $approvalsById = [];
    foreach ($allApprovals as $row) {
      if (!is_array($row)) {
        continue;
      }
      $approvalId = (int) ($row['id'] ?? 0);
      if ($approvalId > 0) {
        $approvalsById[$approvalId] = $row;
      }
    }

    $entries = [];
    foreach ($cascadePlan['actions'] as $action) {
      if (!is_array($action)) {
        continue;
      }

      $approvalId = (int) ($action['approval_id'] ?? 0);
      $workflowId = (int) ($action['workflow_id'] ?? 0);
      if ($approvalId <= 0 || $workflowId <= 0) {
        continue;
      }

      $workflow = $workflowsById[$workflowId] ?? null;
      $approval = $approvalsById[$approvalId] ?? null;
      if (!is_array($workflow) || !is_array($approval)) {
        continue;
      }

      $levelId = self::workflowApprovalLevelId($workflow);
      if ($levelId === null || $levelId <= 0) {
        continue;
      }

      $approverUserId = (int) ($approval[$approvalUserIdKey] ?? 0);
      if ($approverUserId <= 0) {
        continue;
      }

      $entries[] = [
        'user_id' => $approverUserId,
        'entity_id' => $entityId,
        'entity_type' => $entityType,
        'type' => 'Approved',
        'meta' => json_encode([
          'message' => $message,
          'comment' => $comment,
          'user' => $userDisplayName,
          'approval_info' => [
            'instance' => $instance,
            'approval_level_id' => $levelId,
          ],
        ], JSON_THROW_ON_ERROR),
      ];
    }

    return $entries;
  }

  /**
   * @param array<string, mixed> $meta
   */
  public static function resolveApprovalLogLabelFromMeta(array $meta, ?string $logType = null): string
  {
    if (($logType === 'Rejected') || (($meta['status'] ?? '') === 'Rejected') || (($meta['type'] ?? '') === 'rejected')) {
      return 'Rejected';
    }

    return self::resolveApprovalLogLabel($meta);
  }

  /**
   * Omit unused satisfaction flags from GET response (still stored on assign snapshot).
   *
   * @param array<string, mixed> $row
   * @return array<string, mixed>
   */
  public static function stripSatisfactionFlagsForGet(array $row): array
  {
    unset(
      $row['is_satisfied_by_self_approved'],
      $row['is_satisfied_by_higher_authority'],
      $row['is_level_satisfied_by_self_approved'],
      $row['is_level_satisfied_by_higher_authority']
    );

    return $row;
  }
}
