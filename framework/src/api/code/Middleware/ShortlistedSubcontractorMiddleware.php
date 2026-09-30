<?php

namespace Api\Middleware;

use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;
use Core\Middleware\Service\UserMiddleware;
use Core\Service\Manager;

class ShortlistedSubcontractorMiddleware
{
    /**
     * Update multiple shortlisted subcontractors by ID
     *
     * `$tenderMapKey` optionally holds a [shortlisted_subcontractor_id => tender_id]
     * map so one call can span work packages (project-level bulk approval).
     * Ids missing from the map fall back to the tender in the URI.
     */
    public static function updateShortlistedSubcontractors(string $payloadKey = 'update_payload', string $resultKey = 'shortlisted_subcontractors', string $tenderMapKey = 'shortlisted_tender_map'): \Closure {
        return function (Shape $a) use ($payloadKey, $resultKey, $tenderMapKey) {
            $payload = $a->get('payload');
            $items = $payload->toArray();
            $tenderMap = $a->get($tenderMapKey);
            $tenderMap = is_array($tenderMap) ? $tenderMap : [];
            $results = [];
            foreach ($items as $item) {
                $id = (int) $item['entity_id'];
                $tenderId = (int) ($tenderMap[$id] ?? 0);
                $tenderSegment = $tenderId > 0 ? (string) $tenderId : '{uriArgs.tender_id}';
                $a->set($payloadKey, new Shape(['status' => $item['status']]));

                try {
                    Rest::update(
                        "project",
                        sprintf(
                            "project/{uriArgs.project_id}/tender/%s/shortlisted-subcontractors/%d",
                            $tenderSegment,
                            $id
                        ),
                        payloadKey: $payloadKey,
                        responseKey: 'data'
                    )($a);

                    $results[] = $id;

                } catch (\Exception $e) {
                    throw new MiddlewareException("noEntityFound", $e->getMessage());
                }
            }

            $a->set($resultKey, $results);
        };
    }

    /**
     * Build one "Sent For Approval" log entry per shortlisted subcontractor.
     *
     * Shared by the per-package and the project-level bulk request-approval
     * routes — nothing in here is scoped to a single work package.
     *
     * @param \Closure $latestInstance fn(int $shortlistedId): int — the last approval-request instance number
     */
    public static function buildSentForApprovalLogs(
        \Closure $latestInstance,
        string $logType,
        string $logMessage,
        string $idsKey = 'shortlisted_subcontractor_ids',
        string $resultKey = 'logData'
    ): \Closure {
        return function ($a) use ($latestInstance, $logType, $logMessage, $idsKey, $resultKey) {
            $subcontractorIds = $a->get($idsKey) ?? [];
            $logs = [];
            $timestamp = date('Y-m-d H:i:s');

            $buildUserMap = static function (array $users): array {
                $userNameById = [];
                foreach ($users as $user) {
                    if (!is_array($user)) {
                        continue;
                    }
                    $userId = isset($user['id']) ? (int) $user['id'] : 0;
                    if ($userId <= 0) {
                        continue;
                    }
                    $userNameById[$userId] = $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'];
                }
                return $userNameById;
            };

            $fetchWorkflowRows = static function (int $shortlistedId): array {
                $rowsRaw = Manager::getService("project")
                    ->fetch("approval-workflow-process/shortlisted_subcontractor/{$shortlistedId}")
                    ->getShape("data")
                    ->toArray();

                if (is_array($rowsRaw) && isset($rowsRaw['id'])) {
                    return [$rowsRaw];
                }
                if (is_array($rowsRaw)) {
                    return array_values(array_filter($rowsRaw, static fn ($row) => is_array($row)));
                }
                return [];
            };

            $mapWorkflow = static function (array $workflowRows): array {
                $workflowByLevelId = [];
                $workflowIdToLevelId = [];
                foreach ($workflowRows as $workflowRow) {
                    if (!is_array($workflowRow)) {
                        continue;
                    }
                    $meta = $workflowRow['meta'] ?? [];
                    if (is_string($meta)) {
                        $decoded = json_decode($meta, true);
                        $meta = is_array($decoded) ? $decoded : [];
                    }
                    $approvalLevelMeta = is_array($meta['approval_level'] ?? null) ? $meta['approval_level'] : [];
                    $approvalLevelId = (int) ($approvalLevelMeta['id'] ?? 0);
                    if ($approvalLevelId <= 0) {
                        continue;
                    }
                    $workflowByLevelId[$approvalLevelId] = [
                        'sort_order' => (int) ($workflowRow['sort_order'] ?? 0),
                        'rule' => strtolower((string) ($approvalLevelMeta['rule_type'] ?? 'all')),
                        'min_required' => $approvalLevelMeta['min_required'] ?? 0,
                        'status' => strtolower((string) ($workflowRow['status'] ?? 'pending')),
                        'is_level_satisfied_by_self_approved' => !empty($meta['is_level_satisfied_by_self_approved']),
                        'is_level_satisfied_by_higher_authority' => !empty($meta['is_level_satisfied_by_higher_authority']),
                    ];
                    $workflowId = (int) ($workflowRow['id'] ?? 0);
                    if ($workflowId > 0) {
                        $workflowIdToLevelId[$workflowId] = $approvalLevelId;
                    }
                }

                return [
                    'workflow_by_level_id' => $workflowByLevelId,
                    'workflow_id_to_level_id' => $workflowIdToLevelId,
                ];
            };

            $fetchApprovals = static function (int $shortlistedId): array {
                $rows = Manager::getService("project")
                    ->fetch("approvals", [
                        'entity_type' => 'shortlisted_subcontractor',
                        'entity_id' => $shortlistedId,
                    ])
                    ->getShape("data")
                    ->toArray();

                return is_array($rows)
                    ? array_values(array_filter($rows, static fn ($row) => is_array($row)))
                    : [];
            };

            $enrichMissingUsers = static function ($action, array $approvalsRows, array $userNameById): array {
                $missingUserIds = [];
                foreach ($approvalsRows as $approvalRow) {
                    $approverUserId = (int) ($approvalRow['user_id'] ?? 0);
                    if ($approverUserId > 0 && !isset($userNameById[$approverUserId])) {
                        $missingUserIds[] = $approverUserId;
                    }
                }
                $missingUserIds = array_values(array_unique($missingUserIds));
                if ($missingUserIds === []) {
                    return $userNameById;
                }

                $action->set('approvalassign_user_ids', $missingUserIds);
                UserMiddleware::loadUsersByIdArray('approvalassign_user_ids')($action);
                $loadedApproverUsers = $action->get('users') ?? [];
                foreach ($loadedApproverUsers as $loadedApproverUser) {
                    if (!is_array($loadedApproverUser)) {
                        continue;
                    }
                    $loadedUserId = (int) ($loadedApproverUser['id'] ?? 0);
                    if ($loadedUserId <= 0) {
                        continue;
                    }
                    $userNameById[$loadedUserId] = $loadedApproverUser['display_name'] ?: $loadedApproverUser['firstname'] . ' ' . $loadedApproverUser['lastname'];
                }

                return $userNameById;
            };

            $mapApprovalEntries = static function (array $approvalsRows, array $workflowIdToLevelId, array $userNameById): array {
                $entriesByLevelId = [];
                foreach ($approvalsRows as $approvalRow) {
                    $statusLabel = strtolower((string) ($approvalRow['status']['label'] ?? 'pending'));
                    // if ($statusLabel !== 'pending') {
                    //     continue;
                    // }
                    $workflowId = (int) ($approvalRow['approval_level_workflow_id'] ?? 0);
                    $approvalLevelId = (int) ($workflowIdToLevelId[$workflowId] ?? 0);
                    if ($approvalLevelId <= 0) {
                        continue;
                    }
                    if (!isset($entriesByLevelId[$approvalLevelId])) {
                        $entriesByLevelId[$approvalLevelId] = [];
                    }
                    $approverUserId = (int) ($approvalRow['user_id'] ?? 0);
                    $approvalMeta = ApprovalSatisfactionHelper::decodeMeta($approvalRow['meta'] ?? null);
                    $entriesByLevelId[$approvalLevelId][] = array_merge(
                        [
                            'type' => $statusLabel === 'approved' ? 'approved' : 'pending',
                            'user_id' => $approverUserId,
                            'user' => $userNameById[$approverUserId] ?? '',
                            'timestamp' => (string) ($approvalRow['updated_at'] ?? ''),
                            'comment' => (string) ($approvalRow['comment'] ?? ''),
                        ],
                        ApprovalSatisfactionHelper::approverLogFlags($approvalMeta)
                    );
                }
                return $entriesByLevelId;
            };

            $buildLevels = static function (array $workflowByLevelId, array $entriesByLevelId): array {
                $levelIds = array_values(array_unique(array_merge(
                    array_keys($workflowByLevelId),
                    array_keys($entriesByLevelId)
                )));
                usort($levelIds, static function ($a1, $b1) use ($workflowByLevelId) {
                    $aSort = (int) ($workflowByLevelId[$a1]['sort_order'] ?? PHP_INT_MAX);
                    $bSort = (int) ($workflowByLevelId[$b1]['sort_order'] ?? PHP_INT_MAX);
                    if ($aSort === $bSort) {
                        return ((int) $a1) <=> ((int) $b1);
                    }
                    return $aSort <=> $bSort;
                });

                $levels = [];
                $fallbackLevel = 1;
                foreach ($levelIds as $levelId) {
                    $levelId = (int) $levelId;
                    if ($levelId <= 0) {
                        continue;
                    }
                    $workflowMeta = $workflowByLevelId[$levelId] ?? [];
                    $levels[] = array_merge(
                        [
                            'level' => $workflowMeta['sort_order'] ?? $fallbackLevel,
                            'approval_level_id' => $levelId,
                            'rule' => $workflowMeta['rule'] ?? 'all',
                            'min_required' => $workflowMeta['min_required'] ?? 0,
                            'status' => $workflowMeta['status'] ?? 'pending',
                            'entries' => array_values($entriesByLevelId[$levelId] ?? []),
                        ],
                        ApprovalSatisfactionHelper::levelLogFlags($workflowMeta)
                    );
                    $fallbackLevel++;
                }

                return $levels;
            };

            $buildLog = static function ($action, int $shortlistedId, int $instance, string $timestamp, array $levels) use ($logType, $logMessage): array {
                return [
                    'user_id'     => $action->get('user.id'),
                    'entity_id'   => $shortlistedId,
                    'entity_type' => 'shortlisted_subcontractor',
                    'type'        => $logType,
                    'meta'        => json_encode([
                        'message' => $logMessage,
                        'user'    => $action->get('user.display_name') ?: $action->get('user.firstname') . ' ' . $action->get('user.lastname'),
                        'approvalassign' => [
                            'type' => 'approval_request',
                            'instance' => $instance,
                            'heading' => "Approval Request #{$instance}",
                            'label' => $logType,
                            'status' => 'pending',
                            'user_id' => (string) $action->get('user.id'),
                            'user' => $action->get('user.display_name') ?: $action->get('user.firstname') . ' ' . $action->get('user.lastname'),
                            'timestamp' => $timestamp,
                            'shortlisted_subcontractor_id' => $shortlistedId,
                            'levels' => $levels,
                        ],
                    ]),
                ];
            };

            $userNameById = $buildUserMap($a->get('users') ?? []);

            foreach ($subcontractorIds as $scId) {
                $shortlistedId = (int) $scId;
                if ($shortlistedId <= 0) {
                    continue;
                }

                $workflowRows = $fetchWorkflowRows($shortlistedId);
                $workflowMap = $mapWorkflow($workflowRows);
                $workflowByLevelId = $workflowMap['workflow_by_level_id'] ?? [];
                $workflowIdToLevelId = $workflowMap['workflow_id_to_level_id'] ?? [];

                $approvalsRows = $fetchApprovals($shortlistedId);
                $userNameById = $enrichMissingUsers($a, $approvalsRows, $userNameById);
                $entriesByLevelId = $mapApprovalEntries($approvalsRows, $workflowIdToLevelId, $userNameById);

                $instance = $latestInstance($shortlistedId) + 1;
                $levels = $buildLevels($workflowByLevelId, $entriesByLevelId);
                $logs[] = $buildLog($a, $shortlistedId, $instance, $timestamp, $levels);
            }

            $a->set($resultKey, $logs);
        };
    }
}
