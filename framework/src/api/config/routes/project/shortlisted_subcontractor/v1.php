<?php

use Core\Config;
use Api\Middleware\LogsMiddleware;
use Api\Middleware\NotificationMiddleware;
use Api\Middleware\ShortlistedSubcontractorMiddleware;
use Api\Middleware\Email\SubcontractorListApprovalMiddleware;
use Core\Middleware\Procedure;
use Core\Middleware\Rest;
use Core\Middleware\Generic;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Service\UserMiddleware;
use Core\Service\Manager;
use Core\Data\Shape;
use Core\Middleware\Conditional;
use Core\Middleware\Service\AccountMiddleware;
use Prosper\Middleware\SqsMiddleware;
use Api\Middleware\ApprovalMiddleware;
use Api\Middleware\ApprovalSatisfactionHelper;
use Api\Middleware\MilestoneMiddleware;
use Core\Util\StructuredLogger;

include_once("procedures.php");

$sentForApprovalLogType = 'Sent For Approval';
$sentForApprovalLogMessage = 'Approver(s) assigned to shortlisted subcontractor';

$get_latest_sent_for_approval_instance = static function (int $shortlistedId) use ($sentForApprovalLogType): int {
    $pageLimit = 200;
    $offset = 0;
    $lastInstance = 0;

    while (true) {
        $existingLogsRaw = Manager::getService("project")
            ->fetch("logs", [
                'entity_type' => 'shortlisted_subcontractor',
                'entity_id' => $shortlistedId,
                'type' => $sentForApprovalLogType,
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
            $instance = (int) ($decodedMeta['approvalassign']['instance'] ?? 0);
            if ($instance > $lastInstance) {
                $lastInstance = $instance;
            }
        }

        if (count($existingLogs) < $pageLimit) {
            break;
        }
        $offset += $pageLimit;
    }

    return $lastInstance;
};

$convertToUKTime = static function ($dateTime) {
    if (!$dateTime) {
        return null;
    }
    $date = new DateTime($dateTime, new DateTimeZone('UTC'));
    $date->setTimezone(new DateTimeZone('Europe/London'));
    return $date->format("Y-m-d H:i:s");
};

/**
 * Validate the approver payload of a supplier_list approval request.
 *
 * Sets `user_ids` (the de-duplicated lowest-level approvers, i.e. the email
 * recipients) and `workflow_approval_level_ids` on the action, and returns the
 * normalised approver rows. Shared by the per-package and the project-level
 * bulk request-approval routes.
 */
$validate_supplier_list_approvers = static function ($a, array $approvers): array {
    if (!is_array($approvers) || empty($approvers)) {
        throw new MiddlewareException("InvalidPayload", "approvers are required");
    }

    $validApprovers = array_filter(
        $approvers,
        fn ($approver) => is_array($approver) &&
            isset($approver['user_id']) &&
            isset($approver['approval_level_id']) &&
            is_numeric($approver['user_id']) &&
            is_numeric($approver['approval_level_id']) &&
            (int) $approver['user_id'] > 0 &&
            (int) $approver['approval_level_id'] > 0
    );

    if (count($validApprovers) !== count($approvers)) {
        throw new MiddlewareException("InvalidPayload", "Levels and users are required");
    }

    $uniqueApprovers = [];
    foreach ($validApprovers as $approver) {
        $uid = (int) $approver['user_id'];
        $levelId = (int) $approver['approval_level_id'];
        $uniqueApprovers[$uid . ':' . $levelId] = array_merge(
            [
                'user_id' => $uid,
                'approval_level_id' => $levelId,
            ],
            ApprovalSatisfactionHelper::extractFlags($approver)
        );
    }
    $approverRows = array_values($uniqueApprovers);

    if (empty($approverRows)) {
        throw new MiddlewareException("InvalidPayload", "approvers are required");
    }

    $approvalLevelIds = array_unique(array_column($approverRows, 'approval_level_id'));

    $accountId = (int) $a->get('project.group_id');
    $configurations = Manager::getService("project")
        ->fetch("approval-workflow-configurations/{$accountId}/type/supplier_list")
        ->getShape("data")
        ->get();

    if (empty($configurations)) {
        throw new MiddlewareException("InvalidPayload", "No approval levels configured for this account");
    }

    $configuredLevels = $configurations['approval_levels'] ?? null;
    if (!is_array($configuredLevels)) {
        $configuredLevels = array_values(array_filter(
            $configurations,
            static fn ($conf) => is_array($conf) && isset($conf['id'])
        ));
    }

    $levelsForAccount = [];
    foreach ($configuredLevels as $conf) {
        if (!is_array($conf) || !isset($conf['id'])) {
            continue;
        }
        $levelsForAccount[] = [
            'id' => (int) $conf['id'],
            'sort_order' => (int) ($conf['sort_order'] ?? 0),
        ];
    }

    usort($levelsForAccount, static fn ($x, $y) => $x['sort_order'] <=> $y['sort_order']);
    $workflowLevelIds = array_column($levelsForAccount, 'id');

    // check all configured levels are present in request
    $invalidApprovalLevelIds = array_values(array_diff($workflowLevelIds, $approvalLevelIds));
    if (!empty($invalidApprovalLevelIds)) {
        throw new MiddlewareException('InvalidPayload', 'All configured levels are required.');
    }

    // Only the lowest level is notified now; later levels are mailed as the workflow advances.
    $minLevel = min($approvalLevelIds);
    $userIds = array_values(array_unique(array_map(
        static fn ($row) => (int) $row['user_id'],
        array_filter($approverRows, static fn ($row) => (int) $row['approval_level_id'] === $minLevel)
    )));

    $a->set('user_ids', $userIds);
    $a->set('workflow_approval_level_ids', $workflowLevelIds);
    $a->set('workflow_consolidate_notifications', !empty($configurations['consolidate_notifications']));
    $levelFlagsByLevelId = ApprovalSatisfactionHelper::levelFlagsByLevelId($approverRows);
    $a->set('workflow_satisfied_levels_by_level_id', $levelFlagsByLevelId);

    $allLevelsSatisfied = true;
    $notifyLevelId = (int) ($workflowLevelIds[0] ?? 0);
    foreach ($workflowLevelIds as $lid) {
        if (!ApprovalSatisfactionHelper::isLevelSatisfied($levelFlagsByLevelId[(int) $lid] ?? [])) {
            $allLevelsSatisfied = false;
            $notifyLevelId = (int) $lid;
            break;
        }
    }
    $a->set('all_levels_satisfied', $allLevelsSatisfied);

    $notifyUserIds = [];
    foreach ($approverRows as $row) {
        if ((int) ($row['approval_level_id'] ?? 0) !== $notifyLevelId
            || !ApprovalSatisfactionHelper::shouldNotifyApprover($row)) {
            continue;
        }
        $notifyUserIds[(int) $row['user_id']] = (int) $row['user_id'];
    }
    $a->set('notify_user_ids', array_values($notifyUserIds));

    // filter levels in request only present in configuration
    return array_values(array_filter(
        $approverRows,
        static fn ($item) => in_array($item['approval_level_id'], $workflowLevelIds)
    ));
};

/**
 * Reject the request if the supplier already has a Pending approval on its
 * in-progress workflow level. Returns the supplier's existing approvals so the
 * "Rejection Acknowledged" re-assign branch can reuse them.
 */
$assert_no_pending_approval = static function (int $scId): array {
    $approvals = Manager::getService("project")
        ->fetch("approvals", [
            'entity_type' => 'shortlisted_subcontractor',
            'entity_id'   => $scId,
        ])
        ->getShape("data")
        ->toArray();

    $workflowRowsRaw = Manager::getService("project")->fetch(
        "approval-workflow-process/shortlisted_subcontractor/{$scId}"
    )->getShape("data")->toArray();

    if (is_array($workflowRowsRaw) && isset($workflowRowsRaw['id'])) {
        $workflowRows = [$workflowRowsRaw];
    } elseif (is_array($workflowRowsRaw)) {
        $workflowRows = array_values(array_filter($workflowRowsRaw, static fn ($row) => is_array($row)));
    } else {
        $workflowRows = [];
    }

    $inProgressWorkflow = [];
    foreach ($workflowRows as $workflowRow) {
        if (strtolower((string) ($workflowRow['status'] ?? '')) === 'in_progress') {
            $inProgressWorkflow = $workflowRow;
            break;
        }
    }

    $inProgressWorkflowId = (int) ($inProgressWorkflow['id'] ?? 0);
    if ($inProgressWorkflowId > 0) {
        $pendingApproval = array_filter(
            $approvals,
            static fn ($approval) =>
                (int) ($approval['approval_level_workflow_id'] ?? 0) === $inProgressWorkflowId
                && (($approval['status']['label'] ?? '') === 'Pending')
        );

        if (!empty($pendingApproval)) {
            throw new MiddlewareException(
                "ShortlistedSubcontractorApproversAlreadyExists",
                "Approval already assigned for shortlisted subcontractor"
            );
        }
    }

    return $approvals;
};

/**
 * Create the approval_level_workflow rows for every shortlisted subcontractor
 * in `payload`, and stash the resulting {entity}:{level} => workflow id map.
 */
$create_supplier_list_level_workflows = function ($a) {
    $subcontractorIds = $a->get('workflow_entity_ids') ?? [];
    $approvalLevelIds = $a->get('workflow_approval_level_ids') ?? [];
    if (!is_array($subcontractorIds) || $subcontractorIds === []
        || !is_array($approvalLevelIds) || $approvalLevelIds === []) {
        return;
    }

    $accountId = (int) $a->get('project.group_id');
    $satisfiedLevelsByLevelId = $a->get('workflow_satisfied_levels_by_level_id') ?? [];
    if (!is_array($satisfiedLevelsByLevelId)) {
        $satisfiedLevelsByLevelId = [];
    }

    $satisfiedLevels = [];
    foreach (array_values(array_map('intval', $subcontractorIds)) as $entityId) {
        foreach ($approvalLevelIds as $levelId) {
            $levelId = (int) $levelId;
            $satisfiedLevels[] = array_merge(
                [
                    'entity_id' => $entityId,
                    'approval_level_id' => $levelId,
                ],
                $satisfiedLevelsByLevelId[$levelId]
                    ?? ApprovalSatisfactionHelper::buildLevelMetaFlags([])
            );
        }
    }

    $a->set('approval_level_workflow_payload', new Shape([
        'entity_type' => 'shortlisted_subcontractor',
        'entity_ids' => array_values(array_map('intval', $subcontractorIds)),
        'approval_level_ids' => array_values(array_map('intval', $approvalLevelIds)),
        'account_id' => $accountId,
        'approval_type' => 'supplier_list',
        'satisfied_levels' => $satisfiedLevels,
        'consolidate_notifications' => (bool) $a->get('workflow_consolidate_notifications'),
    ]));

    Rest::write(
        'project',
        'approval-workflow-configurations/level-workflows/bulk',
        dataKey: 'approval_level_workflow_payload',
        postProcessor: function ($res, $action, $data) {
            $rows = $data->get('data');
            $rows = is_array($rows) ? $rows : [];
            $map = [];
            foreach ($rows as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $entityId = (int) ($row['entity_id'] ?? 0);
                $levelId = (int) ($row['approval_level_id'] ?? 0);
                $workflowId = (int) ($row['approval_level_workflow_id'] ?? 0);
                if ($entityId <= 0 || $levelId <= 0 || $workflowId <= 0) {
                    continue;
                }
                $map[$entityId . ':' . $levelId] = $workflowId;
            }
            $action->set('approval_level_workflow_id_map', $map);
        }
    )($a);
};

/**
 * Stamp each payload approver with the approval_level_workflow_id created above.
 */
$map_workflow_ids_onto_payload = function ($a) {
    $payload = $a->get('payload');
    $payloadRows = $payload instanceof Shape ? $payload->toArray() : (is_array($payload) ? $payload : []);
    if ($payloadRows === []) {
        return;
    }

    $workflowIdMap = $a->get('approval_level_workflow_id_map') ?? [];
    if (!is_array($workflowIdMap)) {
        $workflowIdMap = [];
    }
    $mappedPayload = [];
    foreach ($payloadRows as $item) {
        if (!is_array($item)) {
            continue;
        }
        $entityId = (int) ($item['entity_id'] ?? 0);
        $approvers = isset($item['approvers']) && is_array($item['approvers']) ? $item['approvers'] : [];

        if ($entityId <= 0 || $approvers === []) {
            $mappedPayload[] = $item;
            continue;
        }

        $mappedApprovers = [];
        foreach ($approvers as $row) {
            if (!is_array($row)) {
                continue;
            }
            $levelId = (int) ($row['approval_level_id'] ?? 0);
            $row['approval_level_workflow_id'] = $levelId > 0
                ? (int) ($workflowIdMap[$entityId . ':' . $levelId] ?? 0)
                : 0;
            $mappedApprovers[] = $row;
        }

        $item['approvers'] = $mappedApprovers;
        $mappedPayload[] = $item;
    }

    $a->set('payload', new Shape($mappedPayload));
};

$emailQueue = Config::get("services.aws.sqs.queues.approval_email");

return [
    [
        "id" => "shortlisted_subcontractor_create",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/shortlisted-subcontractors$",
        "method" => "POST",
        "description" => "Create shortlist of subcontractors",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidatePackageByProject"),
            function ($a) {
                $request = $a->getRoute()->getRequest();
                $data    = $request->getData()->getShape('json')->toArray();
                $accountIds = $data['account_ids'] ?? [];

                if (empty($accountIds) || !is_array($accountIds)) {
                    throw new MiddlewareException(
                        "InvalidPayload",
                        "account_ids must be a non-empty array"
                    );
                }

                $user = $a->get("user");
                $authorId = $user["id"] ?? null;
                $payload = [];
                foreach ($accountIds as $accountId) {
                    $payload[] = [
                        'tender_id'  => (int) $a->get('uriArgs.tender_id'),
                        'account_id' => (int) $accountId,
                        'author_id' => (int) $authorId,
                        'status'     => 'Draft'
                    ];
                }

                $a->set('payload', new Shape(['data' => $payload]));
            },

            Rest::write(
                "project",
                "project/{uriArgs.project_id}/tender/{uriArgs.tender_id}/shortlisted-subcontractors",
                dataKey: 'payload',
                postProcessor: function($res, $action, $data) {
                    $sl_ids  = $data->get('data.ids');
                    foreach ($sl_ids as $sl_id) {
                        $action->set('sl_id', $sl_id);
                        $action->set('logData', [
                            'user_id'     => $action->get('user.id'),
                            'entity_id'   => $sl_id,
                            'entity_type' => 'shortlisted_subcontractor',
                            'type'        => 'Supplier Added',
                            'meta'        => json_encode([
                                'message' => 'Shortlisted subcontractor has been created successfully',
                                'user'    => $action->get('user.display_name') ?: $action->get('user.firstname') . ' ' . $action->get('user.lastname'),
                            ]),
                        ]);
                        LogsMiddleware::createLogs('logData')($action);
                    }
                    MilestoneMiddleware::milestoneInProgress('uriArgs.tender_id', 'Supplier List Approval')($action);
                }
            ),

            Generic::set("json", fn () => json_encode(['success' => true])),
        ]
    ],
    [
        "id" => "shortlisted_subcontractors_delete",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/shortlisted-subcontractors\/(?<id>[0-9]+)$",
        "method" => "DELETE",
        "description" => "Delete subcontractor from shortlist",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidatePackageByProject"),
            Rest::delete(
                "project",
                "project/{uriArgs.project_id}/tender/{uriArgs.tender_id}/shortlisted-subcontractors/{uriArgs.id}"
            ),
            function ($a) {
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.id'),
                    'entity_type' => 'shortlisted_subcontractor',
                    'type'        => 'Delete',
                    'meta'        => json_encode([
                        'message' => 'Shortlisted subcontractor has been deleted successfully',
                        'user'    => $a->get('user.display_name'),
                    ]),
                ]);
            },
            LogsMiddleware::createLogs('logData'),
            Generic::set("json", fn() => json_encode(["success" => true])),
        ],
    ],
    [
        "id" => "shortlisted_subcontractor_approvers_get",
        "key" => "^(?<project_id>[0-9]+)\/shortlisted-subcontractors\/approvers$",
        "method" => "GET",
        "description" => "Get list of users with subcontractor list approval permission",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),

            function ($a) {
                $approvers = Manager::getService("account")
                    ->fetch("approvals/slapprovers", [
                        "user_id" => $a->get("user.id")
                    ])
                    ->getShape("data")
                    ->toArray();
                $a->set("data", $approvers);
            },

            Generic::set("json", fn ($a) => json_encode($a->get("data"))),
        ],
    ],
    [
        "id" => "shortlisted_subcontractors_get_by_project",
        "key" => "^(?<project_id>[0-9]+)\/shortlisted-subcontractors$",
        "method" => "GET",
        "description" => "Get shortlisted subcontractors with approval levels by project",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            function ($a) use ($convertToUKTime) {
                $project = $a->get('project');
                $tenders = $project->get('tender') ?? [];
                $normalizeRows = static function ($raw): array {
                    if (is_array($raw) && isset($raw['id'])) {
                        return [$raw];
                    }
                    return is_array($raw)
                        ? array_values(array_filter($raw, static fn ($row) => is_array($row)))
                        : [];
                };
                $normalizeMeta = static function ($meta): array {
                    if (is_string($meta) && $meta !== '') {
                        $decoded = json_decode($meta, true);
                        return is_array($decoded) ? $decoded : [];
                    }
                    return is_array($meta) ? $meta : [];
                };
                $approvalUserCache = [];
                $buildApprovalUser = static function (int $userId) use (&$approvalUserCache): array {
                    if ($userId <= 0) {
                        return [];
                    }
                    if (isset($approvalUserCache[$userId])) {
                        return $approvalUserCache[$userId];
                    }

                    $user = Manager::getService("account")
                            ->fetch("user/search", ['field' => 'id', 'value' => $userId])
                            ->getShape('data')
                            ->get();

                    $roleRows = Manager::getService("account")
                        ->fetch("user/{$userId}/account-roles")
                        ->getShape('data')
                        ->toArray();

                    if (is_array($roleRows) && isset($roleRows['id'])) {
                        $roleRows = [$roleRows];
                    }

                    $firstRole = [];
                    if (is_array($roleRows) && $roleRows !== []) {
                        foreach ($roleRows as $roleRow) {
                            if (is_array($roleRow)) {
                                $firstRole = $roleRow;
                                break;
                            }
                        }
                    }

                    $approvalUserCache[$userId] = [
                        'id' => $userId,
                        'display_name' => ($user['display_name'] ?: ($user['firstname'] . ' ' . $user['lastname'])),
                        'email' => $user['email'],
                        'role' => [
                            'id' => isset($firstRole['id']) ? (int) ($firstRole['id']) : null,
                            'label' => ($firstRole['label'] ?? ''),
                        ],
                    ];
                    return $approvalUserCache[$userId];
                };
                $buildSubmittedBy = static function (int $authorId) use ($buildApprovalUser): ?array {
                    if ($authorId <= 0) {
                        return null;
                    }
                    $authorUser = $buildApprovalUser($authorId);
                    return [
                        'id' => $authorId,
                        'display_name' => $authorUser['display_name'] ?: $authorUser['firstname'] . ' ' . $authorUser['lastname'],
                    ];
                };
                $formatRuleLabel = static function (string $ruleType, array $level = []): string {
                    $normalizedRuleType = strtolower(trim($ruleType));
                    switch ($normalizedRuleType) {
                        case 'all':
                            return 'All must approve';
                        case 'any':
                            return 'Anyone can approve';
                        case 'custom':
                            $minRequired = $level['approval_level']['min_required'] ?? 0;
                            $roleCount = isset($level['approval_level_account_role_mapping'])
                                ? count($level['approval_level_account_role_mapping'])
                                : 0;
                            return "Any {$minRequired} from {$roleCount} must approve";
                        default:
                            return 'Unknown';
                    }
                };

                $mapApprovals = static function (array $approvalsData) use ($buildApprovalUser, $convertToUKTime): array {
                    $approvalsByWorkflowId = [];
                    $flatApprovals = [];
                    foreach ($approvalsData as $approvalRow) {
                        $workflowId = (int) ($approvalRow['approval_level_workflow_id'] ?? 0);
                        if (!isset($approvalsByWorkflowId[$workflowId])) {
                            $approvalsByWorkflowId[$workflowId] = [];
                        }

                        $approvalUserId = (int) ($approvalRow['user_id'] ?? 0);
                        $approvalItem = array_merge(
                            [
                                'id' => (int) ($approvalRow['id'] ?? 0),
                                'approver_user_id' => $approvalUserId > 0 ? $approvalUserId : null,
                                'approval_level_workflow_id' => $workflowId > 0 ? $workflowId : null,
                                'comment' => (string) ($approvalRow['comment'] ?? ''),
                            ],
                            ApprovalSatisfactionHelper::resolveResponseFlags($approvalRow['meta'] ?? null),
                            [
                                'created_at' => $convertToUKTime($approvalRow['created_at']),
                                'updated_at' => $convertToUKTime($approvalRow['updated_at']),
                                'status' => [
                                    'id' => isset($approvalRow['status']['id']) ? (int) $approvalRow['status']['id'] : null,
                                    'label' => (string) ($approvalRow['status']['label'] ?? ''),
                                ],
                                'user' => $buildApprovalUser($approvalUserId),
                            ]
                        );
                        $approvalsByWorkflowId[$workflowId][] = $approvalItem;

                        if ($workflowId <= 0) {
                            $flatApprovals[] = $approvalItem;
                        }
                    }

                    return [$approvalsByWorkflowId, $flatApprovals];
                };
                $buildWorkflowLevels = static function (array $workflowRows, array $approvalsByWorkflowId) use ($normalizeMeta, $formatRuleLabel): array {
                    $workflowLevels = [];
                    foreach ($workflowRows as $idx => $workflowRow) {
                        $workflowId = (int) ($workflowRow['id'] ?? 0);
                        $meta = $normalizeMeta($workflowRow['meta'] ?? []);
                        $metaLevel = is_array($meta['approval_level'] ?? null) ? $meta['approval_level'] : [];
                        $workflowLevels[] = [
                            'level' => isset($workflowRow['sort_order']) ? (int) $workflowRow['sort_order'] : ($idx + 1),
                            'approval_level_workflow_id' => $workflowId > 0 ? $workflowId : null,
                            'approval_level_id' => isset($metaLevel['id']) ? (int) $metaLevel['id'] : null,
                            'status' => $workflowRow['status'] === 'pending' ? 'locked' : $workflowRow['status'],
                            'rule' => isset($metaLevel['rule_type']) ? $formatRuleLabel($metaLevel['rule_type'], $meta) : null,
                            'approvers' => ApprovalSatisfactionHelper::applyLevelFlagsToApprovers(
                                $approvalsByWorkflowId[$workflowId] ?? [],
                                $meta
                            ),
                        ];
                    }

                    return $workflowLevels;
                };
                $mapApprovalsByLevel = static function (array $workflowLevels) use($formatRuleLabel): array {
                    $approvalsByLevel = [];
                    foreach ($workflowLevels as $idx => $levelRow) {
                        $levelNumber = isset($levelRow['level']) ? (int) $levelRow['level'] : ($idx + 1);
                        if ($levelNumber <= 0) {
                            $levelNumber = $idx + 1;
                        }
                        $approvalsByLevel[(string) $levelNumber] = [
                            'level' => $levelNumber,
                            'rule' => $levelRow['rule'] ?? null,
                            'status' => $levelRow['status'] ?? null,
                            'approvers' => $levelRow['approvers'] ?? [],
                        ];
                    }

                    return $approvalsByLevel;
                };

                $tenderIds = array_values(array_map(
                    static fn ($tender) => (int) ($tender['id'] ?? 0),
                    is_array($tenders) ? $tenders : []
                ));
                $tenderIds = array_values(array_filter($tenderIds, static fn ($id) => $id > 0));
                $rows = $tenderIds === []
                    ? []
                    : $normalizeRows(
                        Manager::getService("project")
                            ->fetch(
                                "project/{$a->get('uriArgs.project_id')}/tender/[" . implode(',', $tenderIds) . "]/shortlisted-subcontractors",
                                 ['is_approved' => 'true']
                            )
                            ->getShape("data")
                            ->toArray()
                    );

                $shortlisted = [];
                // The upstream query LEFT JOINs `approvals`, so a supplier comes back
                // once per approval row — i.e. once per workflow level. Collapse to one
                // entry per supplier; the joined approver columns are unused here and
                // the per-supplier lookups below are expensive to repeat.
                $seenShortlistedIds = [];
                foreach ($rows as $item) {
                    $shortlistedId = (int) ($item['id'] ?? 0);
                    if ($shortlistedId <= 0 || isset($seenShortlistedIds[$shortlistedId])) {
                        continue;
                    }
                    $seenShortlistedIds[$shortlistedId] = true;
                    $accountId = (int) ($item['account_id'] ?? 0);
                    $authorId = (int) ($item['author_id'] ?? 0);

                    $account = $accountId > 0
                            ? Manager::getService("account")->fetch("account/{$accountId}")->getShape("data")->toArray()
                            : [];

                    $submittedBy = $buildSubmittedBy($authorId);

                    $approvalsData = $normalizeRows(
                        Manager::getService("project")
                            ->fetch("approvals", [
                                'entity_type' => 'shortlisted_subcontractor',
                                'entity_id' => $shortlistedId,
                            ])
                            ->getShape("data")
                            ->toArray()
                    );

                    [$approvalsByWorkflowId, $flatApprovals] = $mapApprovals($approvalsData);

                    $workflowRows = $normalizeRows(
                        Manager::getService("project")
                            ->fetch("approval-workflow-process/shortlisted_subcontractor/{$shortlistedId}")
                            ->getShape("data")
                            ->toArray()
                    );

                    $workflowLevels = $buildWorkflowLevels($workflowRows, $approvalsByWorkflowId);

                    $approvalsByLevel = $mapApprovalsByLevel($workflowLevels);

                    $tenderId = (string) ((int) ($item['tender_id'] ?? 0));
                    if (!isset($shortlisted[$tenderId])) {
                        $shortlisted[$tenderId] = [];
                    }

                    $shortlisted[$tenderId][] = [
                        'id' => $shortlistedId,
                        'subcontractor_id' => $accountId > 0 ? $accountId : null,
                        'name' => (string) ($account['name'] ?? ''),
                        'submitted_by' => $submittedBy,
                        'status' => (string) ($item['status'] ?? ''),
                        'isLevel' => $workflowLevels !== [],
                        'approvals' => $workflowLevels !== [] ? $approvalsByLevel : $flatApprovals,
                    ];
                }

                $a->set("data", $shortlisted);
            },
            Generic::set("json", fn ($a) => json_encode($a->get("data"))),
        ],
    ],
    [
        "id" => "shortlisted_subcontractor_bulk_approvals",
        "key" => "^(?<project_id>[0-9]+)\/shortlisted-subcontractors\/approvers$",
        "method" => "POST",
        "description" => "Request approval for every draft shortlisted subcontractor across the project",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            function ($a) use ($validate_supplier_list_approvers, $assert_no_pending_approval) {
                $request = $a->getRoute()->getRequest();
                $data = $request->getData()->getShape('json')->toArray();

                $approverRows = $validate_supplier_list_approvers($a, $data['approvers'] ?? []);
                $userIds = $a->get('user_ids');

                $tenderNameById = [];
                foreach ($a->get('project.tender') ?? [] as $tender) {
                    $tenderId = (int) ($tender['id'] ?? 0);
                    if ($tenderId > 0) {
                        $tenderNameById[$tenderId] = (string) ($tender['label'] ?? '');
                    }
                }

                if ($tenderNameById === []) {
                    throw new MiddlewareException(
                        "InvalidPayload",
                        "There are no draft suppliers to submit for approval"
                    );
                }

                // One multi-tender read instead of a fetch per supplier.
                $rowsRaw = Manager::getService("project")
                    ->fetch(sprintf(
                        "project/%d/tender/[%s]/shortlisted-subcontractors",
                        (int) $a->get('project.id'),
                        implode(',', array_keys($tenderNameById))
                    ))
                    ->getShape("data")
                    ->toArray();

                if (is_array($rowsRaw) && isset($rowsRaw['id'])) {
                    $rows = [$rowsRaw];
                } elseif (is_array($rowsRaw)) {
                    $rows = array_values(array_filter($rowsRaw, static fn ($row) => is_array($row)));
                } else {
                    $rows = [];
                }
                $allLevelsSatisfied = (bool) $a->get('all_levels_satisfied');

                $submittableStatuses = ['Draft', 'Rejection Acknowledged'];
                $payload = [];
                $subcontractorIds = [];
                $tenderMap = [];
                $accountIdsByTender = [];
                $workflowEntityIds = [];
                $completedSids = [];
                $assignStatus = $allLevelsSatisfied ? 'Approved' : 'Pending';

                foreach ($rows as $row) {
                    $status = (string) ($row['status'] ?? '');
                    $scId = (int) ($row['id'] ?? 0);
                    $tenderId = (int) ($row['tender_id'] ?? 0);

                    if ($scId <= 0
                        || !isset($tenderNameById[$tenderId])
                        || !in_array($status, $submittableStatuses, true)) {
                        continue;
                    }

                    $approvals = $assert_no_pending_approval($scId);

                    $subcontractorIds[] = $scId;
                    $tenderMap[$scId] = $tenderId;
                    $accountIdsByTender[$tenderId][] = (int) ($row['account_id'] ?? 0);

                    if ($status === 'Rejection Acknowledged' && !empty($approvals)) {
                        $approval = current($approvals);
                        $a->set('approval_payload', new Shape([
                            'user_id' => (int) current($userIds),
                            'status'  => 'Pending',
                            'comment' => '',
                        ]));

                        $a->set('sc_payload', new Shape([
                            'status' => 'Pending'
                        ]));

                        Rest::update(
                            "project",
                            "approvals/{$approval['id']}",
                            "approval_payload"
                        )($a);

                        Rest::update(
                            "project",
                            sprintf(
                                "project/%d/tender/%d/shortlisted-subcontractors/%d",
                                (int) $a->get('project.id'),
                                $tenderId,
                                $scId
                            ),
                            "sc_payload"
                        )($a);

                        continue;
                    }

                    $payload[] = [
                        'entity_type' => 'shortlisted_subcontractor',
                        'entity_id'   => $scId,
                        'status'      => $assignStatus,
                        'user_ids'    => $userIds,
                        'approvers'   => $approverRows,
                    ];

                    $workflowEntityIds[] = (int) $scId;
                    if ($allLevelsSatisfied && ($sid = (int) ($row['account_id'] ?? 0)) > 0) {
                        $completedSids[$row['tender_id']][] = $sid;
                    }
                }

                if ($subcontractorIds === []) {
                    throw new MiddlewareException(
                        "InvalidPayload",
                        "There are no draft suppliers to submit for approval"
                    );
                }

                if ($allLevelsSatisfied && $workflowEntityIds !== []) {
                    $a->set('assign_approval_complete', true);
                    $a->set('subcontractor_update_response', $completedSids);
                }

                $a->set('payload', new Shape($payload));
                $a->set('shortlisted_subcontractor_ids', $subcontractorIds);
                $a->set('shortlisted_tender_map', $tenderMap);
                $a->set('bulk_account_ids_by_tender', $accountIdsByTender);
                $a->set('bulk_tender_names', $tenderNameById);
                $a->set('workflow_entity_ids', $workflowEntityIds);
            },

            $create_supplier_list_level_workflows,
            $map_workflow_ids_onto_payload,
            Rest::write(
                "project",
                "approvals/slsassign",
                fn ($payload, $a) => $a->get("payload"),
                'payload'
            ),

            ShortlistedSubcontractorMiddleware::updateShortlistedSubcontractors(),
            UserMiddleware::loadUsersByIdArray("notify_user_ids"),
            function ($a) use ($emailQueue) {
                // One email per approver plus one to the requester — never one per supplier.
                $accountIdsByTender = $a->get('bulk_account_ids_by_tender') ?? [];
                $tenderNameById     = $a->get('bulk_tender_names') ?? [];
                $users              = $a->get('users') ?? [];
                $projectName        = $a->get('project.name');

                $allAccountIds = [];
                foreach ($accountIdsByTender as $accountIds) {
                    $allAccountIds = array_merge($allAccountIds, $accountIds);
                }
                $a->set('sids', array_values(array_unique(array_filter($allAccountIds))));
                AccountMiddleware::loadAccountsByIdArray('sids', key: 'subcontractor_accounts')($a);

                $accountNameById = [];
                foreach ($a->get('subcontractor_accounts') ?? [] as $account) {
                    $accountId = (int) ($account['id'] ?? 0);
                    if ($accountId > 0) {
                        $accountNameById[$accountId] = (string) ($account['name'] ?? '');
                    }
                }

                // Repeating package -> supplier structure; the templates loop over it,
                // so this must stay nested rather than being flattened to a string.
                $packages = [];
                $supplierCount = 0;
                foreach ($accountIdsByTender as $tenderId => $accountIds) {
                    $suppliers = [];
                    foreach (array_unique($accountIds) as $accountId) {
                        $name = $accountNameById[(int) $accountId] ?? '';
                        if ($name === '') {
                            continue;
                        }
                        $suppliers[] = ['supplierName' => $name];
                    }
                    if ($suppliers === []) {
                        continue;
                    }
                    $supplierCount += count($suppliers);
                    $packages[] = [
                        'packageName' => $tenderNameById[(int) $tenderId] ?? '',
                        'suppliers'   => $suppliers,
                    ];
                }

                $requesterName = $a->get('user.display_name')
                    ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                $dateTime = SubcontractorListApprovalMiddleware::getUKDateTime();
                $redirectUrl = sprintf("project/%s/procurement_schedule", $a->get('project.slug'));

                $summary = [
                    'projectName'   => $projectName,
                    'supplierCount' => $supplierCount,
                    'packageCount'  => count($packages),
                    'packages'      => $packages,
                    'dateTime'      => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                    'url'           => $redirectUrl,
                ];

                $email_data = [];
                foreach ($users as $user) {
                    $email_data[] = [
                        'template' => 'Subcontractor List Bulk Assign Approver',
                        'app' => 'clink',
                        'email' => $user['email'],
                        'user_id' => $user['id'],
                        'body' => $summary + [
                            'approverName'     => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                            'requestedBy'      => $requesterName,
                            'requestedByEmail' => $a->get('user.email'),
                        ],
                    ];
                }

                $email_data[] = [
                    'template' => 'Subcontractor List Bulk Assign Requester',
                    'app' => 'clink',
                    'email' => $a->get('user.email'),
                    'user_id' => $a->get('user.id'),
                    'body' => $summary + [
                        'requesterName' => $requesterName,
                        'approverName'  => implode(', ', array_column($users, 'display_name')),
                    ],
                ];

                $a->set('bulk_supplier_count', $supplierCount);
                $a->set('bulk_package_count', count($packages));
                $a->set('queueData', [[
                    'type' => 'shortlisted_subcontractor',
                    'uid' => $a->get('user.id'),
                    'email_data' => $email_data,
                    'time' => time()
                ]]);
                SqsMiddleware::writeAll("queueData", $emailQueue)($a);
            },
            function ($a) use ($emailQueue) {
                if (!$a->get('assign_approval_complete')) {
                    return;
                }

                $sids = $a->get('subcontractor_update_response') ?? [];
                foreach ($sids as $tenderId => $accountIds) {
                    $a->set('milestone_tender_id', $tenderId);
                    $matched = array_filter(
                        $a->get('project.tender') ?? [],
                        static fn ($item) => isset($item['id']) && (int) $item['id'] === $tenderId
                    );

                    $packageName = current($matched)['label'] ?? '';
                    $redirectUrl = sprintf(
                        'project/%s/procurement_schedule#%s',
                        $a->get('project.slug'),
                        $packageName
                    );
                    $sessionName = $a->get('user.display_name')
                        ?: trim(($a->get('user.firstname') ?? '') . ' ' . ($a->get('user.lastname') ?? ''));

                    $a->set('sids', $accountIds);
                    AccountMiddleware::loadAccountsByIdArray('sids', key: 'subcontractor_accounts')($a);
                    $email_data = [];
                    $dateTime = SubcontractorListApprovalMiddleware::getUKDateTime();
                    foreach ($a->get('subcontractor_accounts') ?? [] as $account) {
                        $email_data[] = [
                            'template' => "Subcontractor Approved",
                            'app' => 'clink',
                            'email' => $a->get('user.email'),
                            'user_id' => $a->get('user.id'),
                            'body' => [
                                'approverName' => $sessionName,
                                'qsFullName' => $sessionName,
                                'packageName' => $packageName,
                                'projectName' => $a->get('project.name'),
                                'url' => $redirectUrl,
                                'subcontractorName' => $account['name'] ?? '',
                                'dateTime' => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                            ],
                        ];
                    }

                    $a->set('queueData', [[
                        'type' => 'shortlisted_subcontractor',
                        'uid' => $a->get('user.id'),
                        'email_data' => $email_data,
                        'time' => time()
                    ]]);
                    SqsMiddleware::writeAll("queueData", $emailQueue)($a);

                    MilestoneMiddleware::milestoneComplete('milestone_tender_id', 'Supplier List Approval')($a);
                }
            },
            ShortlistedSubcontractorMiddleware::buildSentForApprovalLogs(
                $get_latest_sent_for_approval_instance,
                $sentForApprovalLogType,
                $sentForApprovalLogMessage
            ),
            LogsMiddleware::createLogs('logData'),
            Generic::set("json", fn ($a) => json_encode(
                $a->get('assign_approval_complete')
                ?
                [
                    'sids' => $a->get('subcontractor_update_response'),
                    'success' => true,
                    "suppliers" => (int) $a->get('bulk_supplier_count'),
                    "packages" => (int) $a->get('bulk_package_count')
                ]
                :
                [
                    "success" => true,
                    "suppliers" => (int) $a->get('bulk_supplier_count'),
                    "packages" => (int) $a->get('bulk_package_count'),
                ]
            )),
        ],
    ],
    [
        "id" => "shortlisted_subcontractor_approvals",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/shortlisted-subcontractors\/approvers$",
        "method" => "POST",
        "description" => "Assign approvers to shortlisted subcontractor",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidatePackageByProject"),
            function ($a) use ($validate_supplier_list_approvers, $assert_no_pending_approval) {
                $request = $a->getRoute()->getRequest();
                $data = $request->getData()->getShape('json')->toArray();
                $subcontractorIds = $data['shortlisted_subcontractor_ids'] ?? [];
                $approvers = $data['approvers'] ?? [];

                if (!is_array($subcontractorIds) || empty($subcontractorIds)) {
                    throw new MiddlewareException(
                        "InvalidPayload",
                        "shortlisted_subcontractor_ids are required"
                    );
                }

                $validApprovers = array_filter(
                    $approvers,
                    fn ($approver) => is_array($approver) &&
                        isset($approver['user_id']) &&
                        isset($approver['approval_level_id']) &&
                        is_numeric($approver['user_id']) &&
                        is_numeric($approver['approval_level_id']) &&
                        (int) $approver['user_id'] > 0 &&
                        (int) $approver['approval_level_id'] > 0
                );

                if (count($validApprovers) !== count($approvers)) {
                    throw new MiddlewareException(
                        "InvalidPayload",
                        "Levels and users are required"
                    );
                }

                $uniqueApprovers = [];
                foreach ($validApprovers as $approver) {
                    $uid = (int) $approver['user_id'];
                    $levelId = (int) $approver['approval_level_id'];
                    $uniqueApprovers[$uid . ':' . $levelId] = array_merge(
                        [
                            'user_id' => $uid,
                            'approval_level_id' => $levelId,
                        ],
                        ApprovalSatisfactionHelper::extractFlags($approver)
                    );
                }
                $validApprovers = array_values($uniqueApprovers);

                $userIds = array_values(
                    array_unique(
                        array_map(
                            'intval',
                            array_column($validApprovers, 'user_id')
                        )
                    )
                );

                if (empty($userIds)) {
                    throw new MiddlewareException(
                        "InvalidPayload",
                        "approvers and shortlisted_subcontractor_ids are required"
                    );
                }

                $approverRows = $validApprovers;

                $approvalLevelIds = array_unique(array_column($approverRows, 'approval_level_id'));

                $accountId = (int) $a->get('project.group_id');
                $configurations = Manager::getService("project")
                    ->fetch("approval-workflow-configurations/{$accountId}/type/supplier_list")
                    ->getShape("data")
                    ->get();

                if (!is_array($configurations)) {
                    $configurations = [];
                }

                $configuredLevels = $configurations['approval_levels'] ?? null;
                if (!is_array($configuredLevels)) {
                    $configuredLevels = array_values(array_filter(
                        $configurations,
                        static fn ($conf) => is_array($conf) && isset($conf['id'])
                    ));
                }

                $levelsForAccount = [];
                foreach ($configuredLevels as $conf) {
                    if (!is_array($conf) || !isset($conf['id'])) {
                        continue;
                    }
                    $levelsForAccount[] = [
                        'id' => (int) $conf['id'],
                        'sort_order' => (int) ($conf['sort_order'] ?? 0),
                    ];
                }

                if ($levelsForAccount === []) {
                    throw new MiddlewareException(
                        "InvalidPayload",
                        "No approval levels configured for this account"
                    );
                }

                usort($levelsForAccount, static fn ($a, $b) => $a['sort_order'] <=> $b['sort_order']);
                $workflowLevelIds = array_column($levelsForAccount, 'id');

                $invalidApprovalLevelIds = array_values(array_diff($workflowLevelIds, $approvalLevelIds));
                if (!empty($invalidApprovalLevelIds)) {
                    throw new MiddlewareException('InvalidPayload', 'All configured levels are required.');
                }

                $approverRows = array_values(array_filter(
                    $approverRows,
                    static fn ($item) => in_array((int) $item['approval_level_id'], $workflowLevelIds, true)
                ));

                if ($approverRows === []) {
                    throw new MiddlewareException(
                        "InvalidPayload",
                        "No valid approvers matched configured approval levels"
                    );
                }

                $a->set('workflow_approval_level_ids', $workflowLevelIds);
                $a->set('workflow_consolidate_notifications', !empty($configurations['consolidate_notifications']));
                $levelFlagsByLevelId = ApprovalSatisfactionHelper::levelFlagsByLevelId($approverRows);
                $a->set('workflow_satisfied_levels_by_level_id', $levelFlagsByLevelId);

                $allLevelsSatisfied = true;
                $notifyLevelId = (int) ($workflowLevelIds[0] ?? 0);
                foreach ($workflowLevelIds as $lid) {
                    if (!ApprovalSatisfactionHelper::isLevelSatisfied($levelFlagsByLevelId[(int) $lid] ?? [])) {
                        $allLevelsSatisfied = false;
                        $notifyLevelId = (int) $lid;
                        break;
                    }
                }

                $notifyUserIds = [];
                foreach ($approverRows as $row) {
                    if ((int) ($row['approval_level_id'] ?? 0) !== $notifyLevelId
                        || !ApprovalSatisfactionHelper::shouldNotifyApprover($row)) {
                        continue;
                    }
                    $notifyUserIds[(int) $row['user_id']] = (int) $row['user_id'];
                }
                $a->set('user_ids', array_values($notifyUserIds));

                $payload = [];
                $workflowEntityIds = [];
                $completedSids = [];
                $assignStatus = $allLevelsSatisfied ? 'Approved' : 'Pending';
                foreach ($subcontractorIds as $scId) {

                    $sc = Manager::getService("project")
                        ->fetch(
                            "project/{$a->get('project.id')}/tender/{$a->get('uriArgs.tender_id')}/shortlisted-subcontractors/{$scId}"
                        )
                        ->getShape("data")
                        ->toArray();

                    $scStatus = $sc['status'] ?? '';

                    $approvals = $assert_no_pending_approval((int) $scId);

                    if ($scStatus === 'Rejection Acknowledged' && !empty($approvals)) {
                        $approval = current($approvals);
                        $approvalId = $approval['id'];
                        $a->set('approval_payload', new Shape([
                            'user_id' => (int) current($userIds),
                            'status'   => 'Pending',
                            'comment'  => '',
                        ]));

                        $a->set('sc_payload', new Shape([
                            'status' => 'Pending'
                        ]));

                        Rest::update(
                            "project",
                            "approvals/{$approvalId}",
                            "approval_payload"
                        )($a);

                        Rest::update(
                            "project",
                            "project/{$a->get('project.id')}/tender/{$a->get('uriArgs.tender_id')}/shortlisted-subcontractors/{$scId}",
                            "sc_payload"
                        )($a);

                        continue;
                    }
                    $payload[] = [
                        'entity_type' => 'shortlisted_subcontractor',
                        'entity_id'   => $scId,
                        'status'      => $assignStatus,
                        'user_ids'    => $userIds,
                        'approvers'   => $approverRows,
                    ];
                    $workflowEntityIds[] = (int) $scId;
                    if ($allLevelsSatisfied && ($sid = (int) ($sc['account_id'] ?? 0)) > 0) {
                        $completedSids[$sid] = $sid;
                    }
                }

                if ($allLevelsSatisfied && $workflowEntityIds !== []) {
                    $a->set('assign_approval_complete', true);
                    $a->set('subcontractor_update_response', array_values($completedSids));
                }

                $a->set('payload', new Shape($payload));
                $a->set('shortlisted_subcontractor_ids', $subcontractorIds);
                $a->set('workflow_entity_ids', $workflowEntityIds);
            },

            function ($a) {
                $subcontractorIds = $a->get('workflow_entity_ids') ?? [];
                $approvalLevelIds = $a->get('workflow_approval_level_ids') ?? [];
                if (!is_array($subcontractorIds) || $subcontractorIds === []
                    || !is_array($approvalLevelIds) || $approvalLevelIds === []) {
                    return;
                }

                $accountId = (int) $a->get('project.group_id');
                $satisfiedLevelsByLevelId = $a->get('workflow_satisfied_levels_by_level_id') ?? [];
                if (!is_array($satisfiedLevelsByLevelId)) {
                    $satisfiedLevelsByLevelId = [];
                }

                $satisfiedLevels = [];
                foreach (array_values(array_map('intval', $subcontractorIds)) as $entityId) {
                    foreach ($approvalLevelIds as $levelId) {
                        $levelId = (int) $levelId;
                        $satisfiedLevels[] = array_merge(
                            [
                                'entity_id' => $entityId,
                                'approval_level_id' => $levelId,
                            ],
                            $satisfiedLevelsByLevelId[$levelId]
                                ?? ApprovalSatisfactionHelper::buildLevelMetaFlags([])
                        );
                    }
                }

                $a->set('approval_level_workflow_payload', new Shape([
                    'entity_type' => 'shortlisted_subcontractor',
                    'entity_ids' => array_values(array_map('intval', $subcontractorIds)),
                    'approval_level_ids' => array_values(array_map('intval', $approvalLevelIds)),
                    'account_id' => $accountId,
                    'approval_type' => 'supplier_list',
                    'satisfied_levels' => $satisfiedLevels,
                    'consolidate_notifications' => (bool) $a->get('workflow_consolidate_notifications'),
                ]));

                Rest::write(
                    'project',
                    'approval-workflow-configurations/level-workflows/bulk',
                    dataKey: 'approval_level_workflow_payload',
                    postProcessor: function ($res, $action, $data) {
                        $rows = $data->get('data');
                        $rows = is_array($rows) ? $rows : [];
                        $map = [];
                        foreach ($rows as $row) {
                            if (!is_array($row)) {
                                continue;
                            }
                            $entityId = (int) ($row['entity_id'] ?? 0);
                            $levelId = (int) ($row['approval_level_id'] ?? 0);
                            $workflowId = (int) ($row['approval_level_workflow_id'] ?? 0);
                            if ($entityId <= 0 || $levelId <= 0 || $workflowId <= 0) {
                                continue;
                            }
                            $map[$entityId . ':' . $levelId] = $workflowId;
                        }
                        $action->set('approval_level_workflow_id_map', $map);
                    }
                )($a);
            },

            function ($a) {
                $payload = $a->get('payload');
                $payloadRows = $payload instanceof Shape ? $payload->toArray() : (is_array($payload) ? $payload : []);
                if ($payloadRows === []) {
                    return;
                }

                $workflowIdMap = $a->get('approval_level_workflow_id_map') ?? [];
                if (!is_array($workflowIdMap)) {
                    $workflowIdMap = [];
                }
                $mappedPayload = [];
                foreach ($payloadRows as $item) {
                    if (!is_array($item)) {
                        continue;
                    }
                    $entityId = (int) ($item['entity_id'] ?? 0);
                    $approvers = isset($item['approvers']) && is_array($item['approvers']) ? $item['approvers'] : [];

                    if ($entityId <= 0 || $approvers === []) {
                        $mappedPayload[] = $item;
                        continue;
                    }

                    $mappedApprovers = [];
                    foreach ($approvers as $row) {
                        if (!is_array($row)) {
                            continue;
                        }
                        $levelId = (int) ($row['approval_level_id'] ?? 0);
                        $row['approval_level_workflow_id'] = $levelId > 0
                            ? (int) ($workflowIdMap[$entityId . ':' . $levelId] ?? 0)
                            : 0;
                        $mappedApprovers[] = $row;
                    }

                    $item['approvers'] = $mappedApprovers;
                    $mappedPayload[] = $item;
                }

                $a->set('payload', new Shape($mappedPayload));
            },
            Rest::write(
                "project",
                "approvals/slsassign",
                fn ($payload, $a) => $a->get("payload"),
                'payload'
            ),

            ShortlistedSubcontractorMiddleware::updateShortlistedSubcontractors(),
            UserMiddleware::loadUsersByIdArray("user_ids"),
            function ($a) use ($emailQueue) { // Email notifications
                $users = $a->get('users') ?? [];
                if ($users === []) {
                    return;
                }
                $subcontractorIds = $a->get('shortlisted_subcontractor_ids') ?? [];
                $projectId   = $a->get('project.id');
                $projectName = $a->get('project.name');
                $tenderId    = $a->get('uriArgs.tender_id');
                $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                    return isset($item['id']) && $item['id'] == $tenderId;
                });

                $packageName = current($matched)['label'] ?? '';
                $projectName = $a->get('project.name');
                $redirectUrl = sprintf(
                    "project/%s/procurement_schedule#%s",
                    $a->get('project.slug'),
                    $packageName
                );

                $shortlistedSubcontractors = Manager::getService("project")->fetch(
                    sprintf(
                        "project/%d/tender/%d/shortlisted-subcontractors",
                        $projectId,
                        $tenderId
                    )
                )->getCollection("data")->filterByExistInArray('id', $subcontractorIds)->getItemsAsArray();

                $subContractorAccountIds = array_unique(array_column($shortlistedSubcontractors, 'account_id'));
                $a->set('sids', $subContractorAccountIds);
                AccountMiddleware::loadAccountsByIdArray('sids', key: 'subcontractor_accounts')($a);
                $subcontractorAccounts = $a->get('subcontractor_accounts');

                $email_data = [];

                $dateTime = SubcontractorListApprovalMiddleware::getUKDateTime();

                foreach ($users as $user) {
                    $supplierNames = [];
                    foreach($subcontractorAccounts as $account) {
                        $supplierNames[] = $account['name'];

                        $email_data[] = [
                            'template' => 'Subcontractor List Assign Approver',
                            'app' => 'clink',
                            'email' => $user['email'],
                            'user_id' => $user['id'],
                            'body' => [
                                'approverName'      => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                                'qsFullName'        => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                                'projectName'       => $projectName,
                                'packageName'       => $packageName,
                                'subcontractorName' => $account['name'],
                                'dateTime'      => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                'url'       => $redirectUrl,
                            ]
                        ];

                        $email_data[] = [
                            'template' => 'Subcontractor List Assign Requester',
                            'app' => 'clink',
                            'email' => $a->get('user.email'),
                            'user_id' => $a->get('user.id'),
                            'body' => [
                                'approverName'      => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                                'qsFullName'        => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                                'projectName'       => $projectName,
                                'packageName'       => $packageName,
                                'subcontractorName' => $account['name'],
                                'dateTime'      => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                'url'       => $redirectUrl,
                            ]
                        ];
                    }

                    // Notify approver that these shortlisted subcontractors need their approval one notification per approver.
                    $a->set('notification_payload', [
                        'account_id' => (int) ($user['account_id'] ?? $a->get('user.account_id')),
                        'receiver_user_id' => (int) $user['id'],
                        'project_id' => $projectId,
                        'type' => 'approval_required',
                        'title' => 'Shortlisted subcontractor requires your approval',
                        'message' => NotificationMiddleware::buildContextLine([
                            ['label' => 'Project', 'value' => $projectName],
                            ['label' => 'Package Name', 'value' => $packageName],
                            ['label' => 'Supplier', 'value' => implode(', ', array_filter($supplierNames))],
                            ['label' => 'By', 'value' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname')],
                        ]),
                        'target_type' => 'shortlisted_subcontractor',
                        'target_id' => (int) $tenderId,
                        'target_url' => 'main-contractor/' . $redirectUrl,
                    ]);
                    NotificationMiddleware::createSilently()($a);
                }

                if ($email_data !== []) {
                    $queueData[] = [
                        'type' => 'shortlisted_subcontractor',
                        'uid' => $a->get('user.id'),
                        'email_data' => $email_data,
                        'time' => time()
                    ];
                    $a->set('queueData', $queueData);
                    try {
                        SqsMiddleware::writeAll("queueData", $emailQueue)($a);
                    } catch (\Throwable $e) {
                        // A broken/missing email queue must not abort the rest of this request
                        StructuredLogger::log("SQS", "ERROR", "email_queue_failure", $e->getMessage(), [
                            "queueData" => $queueData,
                        ]);
                    }
                }
            },
            function ($a) {
                if (!$a->get('assign_approval_complete')) {
                    return;
                }

                $sids = $a->get('subcontractor_update_response') ?? [];
                $tenderId = (int) $a->get('uriArgs.tender_id');
                $matched = array_filter(
                    $a->get('project.tender') ?? [],
                    static fn ($item) => isset($item['id']) && (int) $item['id'] === $tenderId
                );
                $packageName = current($matched)['label'] ?? '';
                $redirectUrl = sprintf(
                    'project/%s/procurement_schedule#%s',
                    $a->get('project.slug'),
                    $packageName
                );
                $sessionName = $a->get('user.display_name')
                    ?: trim(($a->get('user.firstname') ?? '') . ' ' . ($a->get('user.lastname') ?? ''));

                if ($sids !== []) {
                    $a->set('sids', $sids);
                    AccountMiddleware::loadAccountsByIdArray('sids', key: 'subcontractor_accounts')($a);
                    foreach ($a->get('subcontractor_accounts') ?? [] as $account) {
                        $a->set('emailPayload', new Shape([
                            'status' => 'Approved',
                            'approverName' => $sessionName,
                            'qsFullName' => $sessionName,
                            'packageName' => $packageName,
                            'projectName' => $a->get('project.name'),
                            'redirectUrl' => $redirectUrl,
                            'email' => $a->get('user.email'),
                            'user_id' => $a->get('user.id'),
                            'subcontractorName' => $account['name'] ?? '',
                            'feedback' => '',
                        ]));
                        SubcontractorListApprovalMiddleware::sendSubcontractorListApprovalEmail(
                            'sl_approved',
                            'emailPayload'
                        )($a);
                    }
                }

                MilestoneMiddleware::milestoneComplete('uriArgs.tender_id', 'Supplier List Approval')($a);
            },
            function ($a) use ($get_latest_sent_for_approval_instance, $sentForApprovalLogType, $sentForApprovalLogMessage) {
                $subcontractorIds = $a->get('shortlisted_subcontractor_ids') ?? [];
                $logs = [];
                $tenderId = (int) $a->get('uriArgs.tender_id');
                $matched = array_filter(
                    $a->get('project.tender') ?? [],
                    static fn ($item) => isset($item['id']) && (int) $item['id'] === $tenderId
                );
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

                $buildLog = static function ($action, int $shortlistedId, int $instance, string $timestamp, array $levels) use ($sentForApprovalLogType, $sentForApprovalLogMessage): array {
                    return [
                        'user_id'     => $action->get('user.id'),
                        'entity_id'   => $shortlistedId,
                        'entity_type' => 'shortlisted_subcontractor',
                        'type'        => $sentForApprovalLogType,
                        'meta'        => json_encode([
                            'message' => $sentForApprovalLogMessage,
                            'user'    => $action->get('user.display_name') ?: $action->get('user.firstname') . ' ' . $action->get('user.lastname'),
                            'approvalassign' => [
                                'type' => 'approval_request',
                                'instance' => $instance,
                                'heading' => "Approval Request #{$instance}",
                                'label' => $sentForApprovalLogType,
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

                    $instance = $get_latest_sent_for_approval_instance($shortlistedId) + 1;
                    $levels = $buildLevels($workflowByLevelId, $entriesByLevelId);
                    $logs[] = $buildLog($a, $shortlistedId, $instance, $timestamp, $levels);
                }

                $a->set('logData', $logs);
            },
            LogsMiddleware::createLogs('logData'),
            Generic::set("json", fn ($a) => json_encode(
                $a->get('assign_approval_complete')
                    ? ['sids' => $a->get('subcontractor_update_response'), 'success' => true]
                    : ['success' => true]
            )),
        ],
    ],
    [
        "id" => "shortlisted_subcontractor_approval_withdraw",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/shortlisted-subcontractors\/(?<id>[0-9]+)\/withdraw$",
        "method" => "DELETE",
        "description" => "Remove approver and update shortlisted subcontractor status",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            function($a) {
                $payload = [];
                $payload[] = [
                    'entity_id' => $a->get('uriArgs.id'),
                    'status'  => 'Draft',
                ];

                $a->set('payload', new Shape($payload));
                $entity = [
                    'entity_type' => 'shortlisted_subcontractor',
                    'entity_id' => $a->get('uriArgs.id')
                ];
                $a->set('entity', $entity);
                ApprovalMiddleware::removeApprovalLevelWorkflowByEntity('entity')($a);

            },


            ShortlistedSubcontractorMiddleware::updateShortlistedSubcontractors(),
            function ($a) use ($get_latest_sent_for_approval_instance) {
                $instance = max(1, $get_latest_sent_for_approval_instance((int) $a->get('uriArgs.id')));
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.id'),
                    'entity_type' => 'shortlisted_subcontractor',
                    'type'        => 'Withdraw Approval',
                    'meta'        => json_encode([
                        'message' => 'Approver removed from shortlisted subcontractor',
                        'user'    => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        'instance' => $instance,
                    ]),
                ]);
            },
            LogsMiddleware::createLogs('logData'),
            Generic::set("json", fn($a) => json_encode(["success" => true])),
        ],
    ],
    [
        "id" => "shortlisted_subcontractor_approval_update",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/shortlisted-subcontractors\/(?<id>[0-9]+)\/approval\/(?<approver_id>[0-9]+)$",
        "method" => "PATCH",
        "description" => "Approve or reject a shortlisted subcontractor",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidatePackageByProject"),
            Procedure::get("fetchAndValidateApprovalById"),
            function ($a) {
                $scId      = (int) $a->get('uriArgs.id');
                $projectId = (int) $a->get('uriArgs.project_id');
                $tenderId  = (int) $a->get('uriArgs.tender_id');
                $scData = Manager::getService("project")->fetch(
                    sprintf(
                        "project/%d/tender/%d/shortlisted-subcontractors/%d",
                        $projectId,
                        $tenderId,
                        $scId
                    )
                )->getShape("data")->toArray();

                if (!is_array($scData) || $scData === []) {
                    throw new MiddlewareException(
                        "SubcontractorNotFound",
                        "Shortlisted subcontractor not found"
                    );
                }

                $accountId = (int) ($scData['account_id'] ?? 0);
                if ($accountId <= 0) {
                    throw new MiddlewareException(
                        "SubcontractorNotFound",
                        "Shortlisted subcontractor account is missing."
                    );
                }

                $account = Manager::getService("account")
                    ->fetch("account/{$accountId}")
                    ->getShape("data")
                    ->toArray();

                $subcontractorName = $account['name'] ?? 'Unknown';
                $a->set('subcontractor_name', $subcontractorName);
                $a->set('requester_ids', [$scData['author_id']]);
                $a->set('shortlisted_subcontractor', $scData);
            },

            function ($a) {
                $request = $a->getRoute()->getRequest();
                $json    = $request->getData()->getShape('json');
                $status = $json->get('status');

                if (!in_array($status, ['Approved', 'Rejected'], true)) {
                    throw new MiddlewareException(
                        "InvalidStatus",
                        "Status must be 'Approved' or 'Rejected'"
                    );
                }
                $a->set('status', $status);
                $a->set('payload', new Shape([
                    'status'  => $status,
                    'comment' => $json->get('comment') ?? ''
                ]));
            },

            function ($a) {
                $scId    = (int) $a->get('uriArgs.id');
                $userId  = (int) $a->get('user.id');
                $approverId = (int) $a->get('uriArgs.approver_id');
                $approvalData = Manager::getService("project")->fetch(
                    "approvals",
                    [
                        'entity_type' => 'shortlisted_subcontractor',
                        'entity_id'   => $scId,
                    ]
                )->getShape("data")->toArray();

                $requestedRows = array_values(array_filter(
                    $approvalData,
                    static function ($approval) use ($userId, $approverId) {
                        return is_array($approval)
                            && (int) ($approval['id'] ?? 0) === $approverId
                            && (int) ($approval['user_id'] ?? 0) === $userId;
                    }
                ));
                if ($requestedRows === []) {
                    throw new MiddlewareException(
                        "shortlistSubcontractorOwnershipError",
                        "You are not authorised to approve or reject this shortlisted subcontractor."
                    );
                }

                $requestedApproval = array_shift($requestedRows);
                if (strtolower((string) ($requestedApproval['status']['label'] ?? '')) !== 'pending') {
                    throw new MiddlewareException(
                        "shortlistSubcontractorOwnershipError",
                        "You have already submitted your approval decision."
                    );
                }

                $requestedApprovalWorkflowId = (int) ($requestedApproval['approval_level_workflow_id'] ?? 0);
                $workflowRowsRaw = Manager::getService("project")->fetch(
                    "approval-workflow-process/shortlisted_subcontractor/{$scId}"
                )->getShape("data")->toArray();

                if (is_array($workflowRowsRaw) && isset($workflowRowsRaw['id'])) {
                    $workflowRows = [$workflowRowsRaw];
                } elseif (is_array($workflowRowsRaw)) {
                    $workflowRows = array_values(array_filter($workflowRowsRaw, static fn ($row) => is_array($row)));
                } else {
                    $workflowRows = [];
                }

                $inProgressWorkflow = [];
                foreach ($workflowRows as $workflowRow) {
                    if (strtolower((string) ($workflowRow['status'] ?? '')) === 'in_progress') {
                        $inProgressWorkflow = $workflowRow;
                        break;
                    }
                }

                if ($requestedApprovalWorkflowId <= 0) {
                    $hasInProgressWorkflow = is_array($inProgressWorkflow) && $inProgressWorkflow !== [];
                    if (!$hasInProgressWorkflow) {
                        throw new MiddlewareException(
                            "shortlistSubcontractorOwnershipError",
                            "Approval workflow has no active in-progress level for this shortlisted subcontractor."
                        );
                    }

                    // Legacy approval rows without workflow fk: allow update, skip level progression logic.
                    $a->set('approval_id', (int) $requestedApproval['id']);
                    $a->set('approval_workflow_in_progress', []);
                    $a->set('use_new_level_logic', false);
                    return;
                }

                if (!is_array($inProgressWorkflow) || $inProgressWorkflow === []) {
                    throw new MiddlewareException(
                        "shortlistSubcontractorOwnershipError",
                        "Approval workflow has no active in-progress level for this shortlisted subcontractor."
                    );
                }
                $inProgressWorkflowId = (int) ($inProgressWorkflow['id'] ?? 0);

                if ($requestedApprovalWorkflowId !== $inProgressWorkflowId) {
                    throw new MiddlewareException(
                        "shortlistSubcontractorOwnershipError",
                        "You are not authorised to approve or reject this shortlisted subcontractor at the current approval level."
                    );
                }

                $meta = $inProgressWorkflow['meta'] ?? [];
                if (is_string($meta)) {
                    $decoded = json_decode($meta, true);
                    $meta = is_array($decoded) ? $decoded : [];
                }
                if (!is_array($meta)) {
                    $meta = [];
                }
                $mappings = is_array($meta['approval_level_account_role_mapping'] ?? null)
                    ? $meta['approval_level_account_role_mapping']
                    : [];
                $mappedRoleIds = array_values(array_unique(array_map(
                    static fn ($row) => (int) ($row['account_role_id'] ?? 0),
                    $mappings
                )));
                $mappedRoleIds = array_values(array_filter($mappedRoleIds, static fn ($rid) => $rid > 0));

                if ($mappedRoleIds !== []) {
                    $accountId = (int) $a->get('project.group_id');
                    $userHasMappedRole = false;
                    $extractRoleUserIds = static function (array $payload): array {
                        $rows = [];
                        if (isset($payload['users']) && is_array($payload['users'])) {
                            $rows = $payload['users'];
                        } else {
                            $rows = $payload;
                        }

                        $ids = [];
                        foreach ($rows as $row) {
                            if (!is_array($row)) {
                                continue;
                            }
                            if (isset($row['id']) && is_numeric($row['id'])) {
                                $ids[] = (int) $row['id'];
                                continue;
                            }
                            if (isset($row['user_id']) && is_numeric($row['user_id'])) {
                                $ids[] = (int) $row['user_id'];
                            }
                        }
                        return array_values(array_unique(array_filter($ids, static fn ($id) => $id > 0)));
                    };

                    foreach ($mappedRoleIds as $mappedRoleId) {
                        try {
                            $roleUsers = Manager::getService("account")
                                ->fetch("account/{$accountId}/account_role_users/{$mappedRoleId}")
                                ->getShape("data")
                                ->toArray();
                        } catch (\Exception $e) {
                            $roleUsers = [];
                        }

                        if (!is_array($roleUsers)) {
                            continue;
                        }

                        $candidateIds = isset($roleUsers['users']) && is_array($roleUsers['users'])
                            ? $extractRoleUserIds($roleUsers)
                            : $extractRoleUserIds(['users' => $roleUsers]);

                        if (in_array($userId, $candidateIds, true)) {
                            $userHasMappedRole = true;
                            break;
                        }
                    }

                    if (!$userHasMappedRole) {
                        throw new MiddlewareException(
                            "shortlistSubcontractorOwnershipError",
                            "You are not authorised to approve this level. Your user is not mapped to the required role."
                        );
                    }
                }

                $a->set('approval_id', (int) $requestedApproval['id']);
                $a->set('approval_workflow_rows', $workflowRows);
                $a->set('approval_workflow_in_progress', $inProgressWorkflow);
                $a->set('use_new_level_logic', true);
            },

            function ($a) {
                $approvalId = $a->get('approval_id');
                Rest::update(
                    "project",
                    "approvals/{$approvalId}",
                )($a);
            },

            function ($a) {
                $requestedStatus = (string) $a->get('status');
                $scId = (int) $a->get('uriArgs.id');
                $nextStatus = $requestedStatus;
                $shouldAdvanceWorkflow = false;
                $useNewLevelLogic = (bool) $a->get('use_new_level_logic');

                if ($requestedStatus === 'Approved' && $useNewLevelLogic) {
                    $inProgressWorkflow = $a->get('approval_workflow_in_progress');
                    if (!is_array($inProgressWorkflow)) {
                        $inProgressWorkflow = [];
                    }
                    $inProgressWorkflowId = (int) ($inProgressWorkflow['id'] ?? 0);

                    $meta = $inProgressWorkflow['meta'] ?? [];
                    if (is_string($meta)) {
                        $decoded = json_decode($meta, true);
                        $meta = is_array($decoded) ? $decoded : [];
                    }
                    if (!is_array($meta)) {
                        $meta = [];
                    }

                    $approvalLevel = is_array($meta['approval_level'] ?? null)
                        ? $meta['approval_level']
                        : [];
                    $mappings = is_array($meta['approval_level_account_role_mapping'] ?? null)
                        ? $meta['approval_level_account_role_mapping']
                        : [];

                    $ruleType = strtolower((string) ($approvalLevel['rule_type'] ?? 'all'));
                    $minRequired = (int) ($approvalLevel['min_required'] ?? 0);

                    $approvalData = Manager::getService("project")->fetch(
                        "approvals",
                        [
                            'entity_type' => 'shortlisted_subcontractor',
                            'entity_id'   => $scId,
                        ]
                    )->getShape("data")->toArray();

                    $levelApprovals = array_values(array_filter(
                        $approvalData,
                        static fn ($row) => (int) ($row['approval_level_workflow_id'] ?? 0) === $inProgressWorkflowId
                    ));

                    $approvedUserIds = array_values(array_unique(array_map(
                        static fn ($row) => (int) ($row['user_id'] ?? 0),
                        array_filter(
                            $levelApprovals,
                            static fn ($row) => strtolower((string) ($row['status']['label'] ?? '')) === 'approved'
                        )
                    )));
                    $approvedUserIds = array_values(array_filter($approvedUserIds, static fn ($uid) => $uid > 0));
                    $approvedCount = count($approvedUserIds);
                    $requiredApproverCount = count($mappings);

                    $levelSatisfied = false;
                    if ($ruleType === 'any') {
                        $levelSatisfied = $approvedCount >= 1;
                    } elseif ($ruleType === 'custom') {
                        if ($minRequired <= 0) {
                            $minRequired = 1;
                        }
                        $levelSatisfied = $approvedCount >= $minRequired;
                    } else {
                        $levelSatisfied = $requiredApproverCount > 0 && $approvedCount >= $requiredApproverCount;
                    }

                    if (!$levelSatisfied) {
                        $nextStatus = 'Pending';
                    } else {
                        $shouldAdvanceWorkflow = true;
                        $workflowRows = $a->get('approval_workflow_rows');
                        if (!is_array($workflowRows)) {
                            $workflowRows = [];
                        }

                        $hasNextPendingLevel = false;
                        foreach ($workflowRows as $workflowRow) {
                            if (!is_array($workflowRow)) {
                                continue;
                            }
                            if (($workflowRow['status'] ?? '') !== 'pending') {
                                continue;
                            }
                            if ((int) ($workflowRow['sort_order'] ?? 0) > (int) ($inProgressWorkflow['sort_order'] ?? 0)) {
                                $hasNextPendingLevel = true;
                                break;
                            }
                        }

                        if ($hasNextPendingLevel) {
                            $nextStatus = 'Pending';
                        } else {
                            $nextStatus = 'Approved';
                        }
                    }
                }

                $a->set('sc_payload', new Shape([
                    'status' => $nextStatus
                ]));
                $a->set('should_advance_workflow', $shouldAdvanceWorkflow);
            },

            function ($a) {
                if (!$a->get('should_advance_workflow')) {
                    return;
                }
                $scId = (int) $a->get('uriArgs.id');
                $a->set('advance_workflow_payload', new Shape([]));
                Rest::update(
                    "project",
                    "approval-workflow-process/shortlisted_subcontractor/{$scId}/advance",
                    "advance_workflow_payload"
                )($a);
            },

            Rest::update(
                "project",
                "project/{uriArgs.project_id}/tender/{uriArgs.tender_id}/shortlisted-subcontractors/{uriArgs.id}",
                "sc_payload",
                postProcessor: function($res, $a, $json) {
                    $subcontractorId = $json->get("data.result");
                    if ($subcontractorId !== null) {
                        $a->set(
                            'subcontractor_update_response',
                            [$subcontractorId['sid']],
                            true
                        );
                    }
                }
            ),

            UserMiddleware::loadUsersByIdArray("requester_ids"),
            function($a) {
                $users = $a->get('users');
                $user = array_shift($users);
                $tenderId  = (int) $a->get('uriArgs.tender_id');
                $subcontractorName = $a->get('subcontractor_name');

                $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                    return isset($item['id']) && $item['id'] == $tenderId;
                });
                $packageName = current($matched)['label'] ?? '';
                $projectName = $a->get('project.name');
                $projectSlug = $a->get('project.slug');
                $redirectUrl = sprintf("project/%s/procurement_schedule#%s", $projectSlug, $packageName);
                $emailPayload = [
                    'status'      => $a->get('status'),
                    'approverName' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                    'qsFullName' => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                    'packageName' => $packageName,
                    'projectName' => $projectName,
                    'redirectUrl' => $redirectUrl,
                    'email' => $user['email'],
                    'user_id' => $user['id'],
                    'subcontractorName' => $subcontractorName,
                    'feedback' => $a->get('payload.comment'),
                ];

                $a->set('payload', new Shape($emailPayload));
            },

            Conditional::switched("status", [
                SubcontractorListApprovalMiddleware::sendSubcontractorListApprovalEmail('sl_approved'),
            ], [
                SubcontractorListApprovalMiddleware::sendSubcontractorListApprovalEmail('sl_rejected'),
                function ($a) {
                    // Notify the requester their shortlisted subcontractor request was rejected — additive to the email above.
                    $a->set('notification_payload', [
                        'account_id' => (int) $a->get('user.account_id'),
                        'receiver_user_id' => (int) $a->get('payload.user_id'),
                        'project_id' => $a->get('project.id'),
                        'type' => 'shortlisted_subcontractor_rejected',
                        'title' => 'Your shortlisted subcontractor has been rejected',
                        'message' => NotificationMiddleware::buildContextLine([
                            ['label' => 'Project', 'value' => $a->get('payload.projectName')],
                            ['label' => 'Package Name', 'value' => $a->get('payload.packageName')],
                            ['label' => 'Supplier', 'value' => $a->get('payload.subcontractorName')],
                            ['label' => 'By', 'value' => $a->get('payload.approverName')],
                        ]),
                        'target_type' => 'shortlisted_subcontractor',
                        'target_id' => (int) $a->get('uriArgs.id'),
                        'target_url' => 'main-contractor/' . $a->get('payload.redirectUrl'),
                    ]);
                    NotificationMiddleware::createSilently()($a);
                },
            ], "Approved"),

            function ($a) use ($get_latest_sent_for_approval_instance) {
                $payload = $a->get('payload');
                $instance = max(1, $get_latest_sent_for_approval_instance((int) $a->get('uriArgs.id')));
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.id'),
                    'entity_type' => 'shortlisted_subcontractor',
                    'type'        => $payload->get('status') ?? 'Pending',
                    'meta'        => json_encode([
                        'message' => "Shortlisted Subcontractor {$payload->get('status')} by approver",
                        'comment' => $a->get('payload.feedback') ?? '',
                        'user'    => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        'instance' => $instance,
                    ]),
                ]);
            },
            LogsMiddleware::createLogs('logData'),

            Generic::set("json", fn ($a) => json_encode([
                "sids" => $a->get("subcontractor_update_response"),
                "success" => true
            ])),
        ],
    ],
    [
        "id" => "shortlisted_subcontractor_approval_bulk_update",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/shortlisted-subcontractors\/approval$",
        "method" => "PATCH",
        "description" => "Bulk Approve or reject shortlisted subcontractors",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidatePackageByProject"),
            function ($a) use ($emailQueue, $get_latest_sent_for_approval_instance) {
                $projectId = (int) $a->get('uriArgs.project_id');
                $tenderId  = (int) $a->get('uriArgs.tender_id');
                $request = $a->getRoute()->getRequest();
                $json    = $request->getData()->getShape('json');
                $approvalData = $json->get('approvals') ?? [];
                $status = $json->get('status');
                $comment = $json->get('comment') ?: '';

                $sessionUserId = $a->int('user.id');

                if (!in_array($status, ['Approved', 'Rejected'], true)) {
                    throw new MiddlewareException(
                        "InvalidStatus",
                        "Status must be 'Approved' or 'Rejected'"
                    );
                }

                if(!empty($approvalData)) {

                    $shortlistedSubcontractors = Manager::getService("project")->fetch(
                        sprintf(
                            "project/%d/tender/%d/shortlisted-subcontractors",
                            $projectId,
                            $tenderId
                        )
                    )->getCollection("data")->getItemsAsArray();

                    $subContractorAccountIds = array_unique(array_column($shortlistedSubcontractors, 'account_id'));
                    $a->set('sids', $subContractorAccountIds);
                    AccountMiddleware::loadAccountsByIdArray('sids', key: 'subcontractor_accounts')($a);

                    $scList = [];
                    $subContractorAccounts = $a->get('subcontractor_accounts');
                    foreach($shortlistedSubcontractors as $shortlistedItem) {
                        $matchedSc = array_filter($subContractorAccounts, function($item) use ($shortlistedItem) {
                            return $shortlistedItem['account_id'] == $item['id'];
                        });
                        $flat = array_shift($matchedSc);
                        $shortlistedItem['account_name'] = $flat['name'];
                        $scList[$shortlistedItem["id"]] = $shortlistedItem;
                    }
                    $rejectedNotifications = [];
                    $approvedNotifications = [];
                    $nextLevelNotifications = [];

                    // Constant for the whole request — this route is scoped to one tender.
                    $matchedTender = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                        return isset($item['id']) && $item['id'] == $tenderId;
                    });
                    $packageName = current($matchedTender)['label'] ?? '';
                    $projectName = $a->get('project.name');
                    $redirectUrl = sprintf(
                        "project/%s/procurement_schedule#%s",
                        $a->get('project.slug'),
                        $packageName
                    );

                    // Collected across the loop so every approver gets ONE email
                    // listing all their suppliers, instead of one email per supplier.
                    $nextLevelDigest = [];
                    // Same idea for the requester's outcome emails: one per
                    // requester per outcome, not one per supplier.
                    $requesterDigest = ['Approved' => [], 'Rejected' => []];

                    foreach($approvalData as $approval) {
                        $cascadePlan = ['actions' => [], 'remaining_pending' => []];
                        $pendingWorkflowRows = [];

                        $a->set('approval_workflow_entity', [
                            'entity_type' => 'shortlisted_subcontractor',
                            'entity_id' => $approval["shortlisted_subcontractor_id"],
                        ]);

                        ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity()($a);
                        ApprovalMiddleware::fetchApprovalsList()($a);

                        $allApprovals = $a->getCollection('approvals');

                        if(!in_array($sessionUserId, $allApprovals->values('user_id'))) {
                            throw new MiddlewareException("ShortlistSubcontractorOwnershipError", "You do not permission to approve or reject this supplier.");
                        }

                        $hasApprovalWorkflows = $a->getCollection('approval_workflows')->count() > 0;
                        if($hasApprovalWorkflows) {

                            $currentWorkflow = $a->getCollection('approval_workflows')->filterByField('status', 'in_progress')->first();
                            $currentWorkflowId = $currentWorkflow->get('id');

                            if(!$currentWorkflowId) {
                                throw new MiddlewareException("noEntityFound", "Could not find an active approval process.");
                            }

                            $approvals = $allApprovals->filterByField('approval_level_workflow_id', $currentWorkflowId);
                        } else {
                            $approvals = $allApprovals;
                        }

                        $approvalUserIds = $approvals->values('user_id');

                        if(!in_array($sessionUserId, $approvalUserIds)) {
                            throw new MiddlewareException("ShortlistSubcontractorOwnershipError", "You do not have the required role at the current in-progress approval level to approve or reject this supplier.");
                        } else {
                            $currentUserApproval = $approvals->filterByField('user_id', $sessionUserId)->first()->get();

                            if ($currentUserApproval['id'] !== $approval['approval_id']) {
                                throw new MiddlewareException("ShortlistSubcontractorOwnershipError", "You do not have the required role at the current in-progress approval level to approve or reject this supplier.");
                            }

                            if (isset($currentUserApproval['status']) && $currentUserApproval['status']['label'] !== 'Pending') {
                                throw new MiddlewareException("InvalidPayload", "You have already submitted your approval decision for this supplier.");
                            }
                        }

                        $a->set('scPayload', new Shape([
                            'status'  => $status
                        ]));


                        $scId = (int) ($approval['shortlisted_subcontractor_id'] ?? 0);
                        $scRow = $scList[$scId] ?? null;
                        if (!is_array($scRow)) {
                            $scRow = Manager::getService('project')->fetch(
                                sprintf(
                                    'project/%d/tender/%d/shortlisted-subcontractors/%d',
                                    $projectId,
                                    $tenderId,
                                    $scId
                                )
                            )->getShape('data')->toArray();
                            if (!is_array($scRow) || $scRow === []) {
                                throw new MiddlewareException(
                                    'SubcontractorNotFound',
                                    "Shortlisted subcontractor {$scId} not found."
                                );
                            }
                            $scList[$scId] = $scRow;
                        }

                        $subcontractorName = $scRow['account_name'] ?? '';
                        $requesterId = (int) ($scRow['author_id'] ?? 0);
                        if ($requesterId <= 0) {
                            throw new MiddlewareException(
                                'InvalidPayload',
                                "Shortlisted subcontractor {$scId} has no author_id (requester)."
                            );
                        }

                        $a->set('requester_ids', [$requesterId]);
                        UserMiddleware::loadUsersByIdArray('requester_ids')($a);
                        $requesterUser = $a->get('users') ? $a->get('users')[0] : [];

                        $emailPayload = [
                            'status'      => $status,
                            'approverName' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                            'qsFullName' => $requesterUser['display_name'] ?: $requesterUser['firstname'] . ' ' . $requesterUser['lastname'],
                            'packageName' => $packageName,
                            'projectName' => $projectName,
                            'redirectUrl' => $redirectUrl,
                            'email' => $requesterUser['email'] ?? '',
                            'user_id' => $requesterUser['id'] ?? '',
                            'subcontractorName' => $subcontractorName,
                            'feedback' => $comment,
                        ];
                        $a->set('emailPayload', new Shape($emailPayload));

                        if($status == 'Approved') {

                            if($hasApprovalWorkflows) {
                                $pendingWorkflows = $a->getCollection('approval_workflows')->filterByField('status', 'pending');
                                $a->set('is_approval_complete', false);

                                $currentWorkflowMeta = $currentWorkflow->get('meta')
                                    ? json_decode($currentWorkflow->get('meta'), true)
                                    : [];
                                $approvalLevelConfig = $currentWorkflowMeta['approval_level'] ?? [];
                                $a->set('current_approval_level_id', $approvalLevelConfig['id'] ?? null);

                                $levelComplete = ApprovalSatisfactionHelper::isLevelCompleteAfterUserApprove(
                                    $currentWorkflowMeta,
                                    $approvals->getItemsAsArray(),
                                    (int) $sessionUserId
                                );
                                $a->set('is_level_complete', $levelComplete);

                                $pendingWorkflowRows = $pendingWorkflows->getItemsAsArray();
                                $cascadePlan = ApprovalSatisfactionHelper::planCrossLevelCascadesIfEnabled(
                                    $currentWorkflowMeta,
                                    $pendingWorkflowRows,
                                    $allApprovals->getItemsAsArray(),
                                    (int) $sessionUserId
                                );
                                $remainingPending = ApprovalMiddleware::applyCrossLevelCascadePlan($cascadePlan);

                                if ($levelComplete) {
                                    Manager::getService("project")->update(
                                        sprintf("approval-workflow-process/workflow/%s", $currentWorkflowId),
                                        new Shape(['data' => ['status' => 'completed']])
                                    );

                                    if ($remainingPending === []) {
                                        $a->set('is_approval_complete', true);
                                    } else {
                                        usort(
                                            $remainingPending,
                                            static fn ($a, $b) => (int) ($a['sort_order'] ?? 0) <=> (int) ($b['sort_order'] ?? 0)
                                        );
                                        $nextWorkflow = $remainingPending[0];
                                        Manager::getService("project")->update(
                                            sprintf("approval-workflow-process/workflow/%s", $nextWorkflow['id']),
                                            new Shape(['data' => ['status' => 'in_progress']])
                                        );

                                        $cascadeActions = $cascadePlan['actions'] ?? [];

                                        // Record who needs telling; the email itself is built
                                        // once after the loop so each approver gets a single
                                        // message listing every supplier that reached them.
                                        $nextLevelApproverIds = $a->getCollection('approvals')->filterByField('approval_level_workflow_id', $nextWorkflow['id'])->getItemsAsArray();
                                        foreach ($nextLevelApproverIds as $approvalRow) {
                                            if (!ApprovalSatisfactionHelper::shouldNotifyApprover($approvalRow, $cascadeActions)) {
                                                continue;
                                            }
                                            $nextApproverId = (int) ($approvalRow['user_id'] ?? 0);
                                            if ($nextApproverId <= 0) {
                                                continue;
                                            }
                                            $nextLevelDigest[$nextApproverId][] = $subcontractorName;
                                        }
                                    }
                                }
                            } else {
                                $a->set('is_approval_complete', true);
                            }

                        } else {

                            Manager::getService("project")->update(
                                sprintf("approval-workflow-process/workflow/%s", $currentWorkflowId),
                                new Shape(['data' => ['status' => 'rejected']])
                            );

                            $currentWorkflowMeta = $currentWorkflow->get('meta') ? json_decode($currentWorkflow->get('meta'), true) : [];
                            $approvalLevelConfig = $currentWorkflowMeta['approval_level'];
                            $a->set('current_approval_level_id', $approvalLevelConfig['id']);

                            Rest::update(
                                "project",
                                "project/{uriArgs.project_id}/tender/{uriArgs.tender_id}/shortlisted-subcontractors/{$approval["shortlisted_subcontractor_id"]}",
                                "scPayload"
                            )($a);

                            $a->set("subcontractor_update_response", []);

                            $rejectedRequesterId = (int) ($requesterUser['id'] ?? 0);
                            if ($rejectedRequesterId > 0) {
                                $requesterDigest['Rejected'][$rejectedRequesterId]['user'] = $requesterUser;
                                $requesterDigest['Rejected'][$rejectedRequesterId]['suppliers'][] = $subcontractorName;
                                $requesterDigest['Rejected'][$rejectedRequesterId]['feedback'] = $comment;
                            }

                            // Collect this supplier's rejection for the requester's batched notification below.
                            $rejectedReceiverId = (int) ($requesterUser['id'] ?? 0);
                            $rejectedNotifications[$rejectedReceiverId]['account_id'] = (int) ($requesterUser['account_id'] ?? $a->get('user.account_id'));
                            $rejectedNotifications[$rejectedReceiverId]['names'][] = $subcontractorName;
                        }

                        $a->set('payload', new Shape([
                            'status'  => $status,
                            'comment' => $comment
                        ]));

                        Rest::update(
                            "project",
                            "approvals/{$approval["approval_id"]}",
                            "payload",
                            postProcessor: function ($res, $a, $data) {
                                if (!empty($data->get('error'))) {
                                    throw new MiddlewareException("ApprovalAssignFailed", $data->get('error.description'));
                                }
                            }
                        )($a);

                        $scId = (int) $approval['shortlisted_subcontractor_id'];
                        $instance = max(1, $get_latest_sent_for_approval_instance($scId));
                        $userDisplayName = $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                        $logEntries = [[
                            'user_id'     => $a->get('user.id'),
                            'entity_id'   => $scId,
                            'entity_type' => 'shortlisted_subcontractor',
                            'type'        => $status ?? 'Pending',
                            'meta'        => json_encode([
                                'message' => "Shortlisted Subcontractor {$status} by approver",
                                'comment' => $comment,
                                'user'    => $userDisplayName,
                                'approval_info' => [
                                    'instance' => $instance,
                                    'approval_level_id' => $a->get('current_approval_level_id'),
                                ],
                            ]),
                        ]];

                        if ($status === 'Approved' && !empty($cascadePlan['actions'])) {
                            $logEntries = array_merge(
                                $logEntries,
                                ApprovalSatisfactionHelper::buildCascadeApprovalLogEntries(
                                    $cascadePlan,
                                    $pendingWorkflowRows,
                                    $allApprovals->getItemsAsArray(),
                                    $scId,
                                    'shortlisted_subcontractor',
                                    $instance,
                                    $userDisplayName,
                                    'Shortlisted Subcontractor Approved by approver',
                                    $comment
                                )
                            );
                        }

                        $a->set('logData', count($logEntries) === 1 ? $logEntries[0] : $logEntries);
                        LogsMiddleware::createLogs('logData')($a);

                        if($a->get('is_approval_complete')) {

                            Rest::update(
                                "project",
                                "project/{uriArgs.project_id}/tender/{uriArgs.tender_id}/shortlisted-subcontractors/{$approval["shortlisted_subcontractor_id"]}",
                                "scPayload",
                                postProcessor: function($res, $a, $json) {
                                    $subcontractorId = $json->get("data.result");
                                    if ($subcontractorId !== null) {
                                        $a->set(
                                            'subcontractor_update_response',
                                            [$subcontractorId['sid']],
                                            true
                                        );
                                    }
                                }
                            )($a);

                            $completedScId = (int) $approval['shortlisted_subcontractor_id'];
                            if (isset($scList[$completedScId])) {
                                $scList[$completedScId]['status'] = 'Approved';
                            }

                            $approvedRequesterId = (int) ($requesterUser['id'] ?? 0);
                            if ($approvedRequesterId > 0) {
                                $requesterDigest['Approved'][$approvedRequesterId]['user'] = $requesterUser;
                                $requesterDigest['Approved'][$approvedRequesterId]['suppliers'][] = $subcontractorName;
                            }
                            MilestoneMiddleware::milestoneComplete('uriArgs.tender_id', 'Supplier List Approval')($a);

                            // Collect this supplier's approval for the requester's batched notification below.
                            $approvedReceiverId = (int) ($requesterUser['id'] ?? 0);
                            $approvedNotifications[$approvedReceiverId]['account_id'] = (int) ($requesterUser['account_id'] ?? $a->get('user.account_id'));
                            $approvedNotifications[$approvedReceiverId]['names'][] = $subcontractorName;
                        }
                    }

                    // One consolidated hand-off email per next-level approver.
                    // Built after the loop and written in a single SQS batch:
                    // previously this sat inside the loop over a never-reset
                    // accumulator, so N suppliers produced N(N+1)/2 messages.
                    $dateTime = SubcontractorListApprovalMiddleware::getUKDateTime();
                    $requestedBy = $a->get('user.display_name')
                        ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                    $bulkRedirectUrl = sprintf(
                        "project/%s/procurement_schedule",
                        $a->get('project.slug')
                    );
                    // Every supplier in this request belongs to the one tender,
                    // so each consolidated email carries a single package group.
                    $buildPackages = static function (array $supplierNames) use ($packageName): array {
                        return [[
                            'packageName' => $packageName,
                            'suppliers'   => array_map(
                                static fn ($name) => ['supplierName' => $name],
                                $supplierNames
                            ),
                        ]];
                    };

                    $email_data = [];

                    if ($nextLevelDigest !== []) {
                        $a->set('user_ids', array_keys($nextLevelDigest));
                        UserMiddleware::loadUsersByIdArray("user_ids", key: "approver_users")($a);

                        foreach ($a->get('approver_users') ?? [] as $user) {
                            $supplierNames = array_values(array_unique(
                                $nextLevelDigest[(int) $user['id']] ?? []
                            ));
                            if ($supplierNames === []) {
                                continue;
                            }

                            $email_data[] = [
                                'template' => 'Subcontractor List Bulk Assign Approver',
                                'app' => 'clink',
                                'email' => $user['email'],
                                'user_id' => $user['id'],
                                'body' => [
                                    'approverName'     => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                                    'requestedBy'      => $requestedBy,
                                    'requestedByEmail' => $a->get('user.email'),
                                    'projectName'      => $projectName,
                                    'supplierCount'    => count($supplierNames),
                                    'packageCount'     => 1,
                                    'packages'         => $buildPackages($supplierNames),
                                    'dateTime'         => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                    'url'              => $bulkRedirectUrl,
                                ],
                            ];

                            // Collect this next-level approver's notification for the batched send below.
                            $nextLevelReceiverId = (int) $user['id'];
                            $nextLevelNotifications[$nextLevelReceiverId]['account_id'] = (int) ($user['account_id'] ?? 0);
                            $nextLevelNotifications[$nextLevelReceiverId]['names'][] = $subcontractorName;
                        }
                    }

                    // One outcome email per requester per outcome. Queued rather than
                    // sent inline: the synchronous path cost 3 blocking calls per
                    // supplier and minted its auth token from the wrong payload key.
                    $outcomeTemplates = [
                        'Approved' => 'Subcontractor Bulk Approved',
                        'Rejected' => 'Subcontractor Bulk Rejected',
                    ];
                    foreach ($outcomeTemplates as $outcome => $outcomeTemplate) {
                        foreach ($requesterDigest[$outcome] as $requesterId => $info) {
                            $supplierNames = array_values(array_unique($info['suppliers'] ?? []));
                            if ($supplierNames === []) {
                                continue;
                            }
                            $requester = $info['user'] ?? [];

                            $email_data[] = [
                                'template' => $outcomeTemplate,
                                'app' => 'clink',
                                'email' => $requester['email'] ?? null,
                                'user_id' => $requesterId,
                                'body' => [
                                    // requesterName is what the bulk templates greet on;
                                    // qsFullName is kept for the legacy per-supplier ones.
                                    'requesterName'  => ($requester['display_name'] ?? '') ?: trim(($requester['firstname'] ?? '') . ' ' . ($requester['lastname'] ?? '')),
                                    'qsFullName'     => ($requester['display_name'] ?? '') ?: trim(($requester['firstname'] ?? '') . ' ' . ($requester['lastname'] ?? '')),
                                    'approverName'   => $requestedBy,
                                    'projectName'    => $projectName,
                                    // Flat name for the subject line, which cannot loop.
                                    'packageName'    => $packageName,
                                    'supplierCount'  => count($supplierNames),
                                    'packageCount'   => 1,
                                    'packages'       => $buildPackages($supplierNames),
                                    'feedback'       => $info['feedback'] ?? '',
                                    'dateTime'       => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                    'url'            => $bulkRedirectUrl,
                                ],
                            ];
                        }
                    }

                    if ($email_data !== []) {
                        $a->set('queueData', [[
                            'type' => 'shortlisted_subcontractor',
                            'uid' => $a->get('user.id'),
                            'email_data' => $email_data,
                            'time' => time()
                        ]]);
                        try {
                            SqsMiddleware::writeAll("queueData", $emailQueue)($a);
                        } catch (\Throwable $e) {
                            // A broken/missing email queue must not abort the rest of this request
                            StructuredLogger::log("SQS", "ERROR", "email_queue_failure", $e->getMessage(), [
                                "queueData" => $a->get('queueData'),
                            ]);
                        }
                    }
                    // Notify each requester once per outcome
                    $notifyRequesters = function (array $notifications, string $type, string $title) use (
                        $a,
                        $projectId,
                        $projectName,
                        $packageName,
                        $tenderId,
                        $redirectUrl
                    ) {
                        foreach ($notifications as $receiverId => $info) {
                            $a->set('notification_payload', [
                                'account_id' => $info['account_id'],
                                'receiver_user_id' => $receiverId,
                                'project_id' => $projectId,
                                'type' => $type,
                                'title' => $title,
                                'message' => NotificationMiddleware::buildContextLine([
                                    ['label' => 'Project', 'value' => $projectName],
                                    ['label' => 'Package Name', 'value' => $packageName],
                                    ['label' => 'Supplier', 'value' => implode(', ', array_filter($info['names']))],
                                    ['label' => 'By', 'value' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname')],
                                ]),
                                'target_type' => 'shortlisted_subcontractor',
                                'target_id' => $tenderId,
                                'target_url' => 'main-contractor/' . $redirectUrl,
                            ]);
                            NotificationMiddleware::createSilently()($a);
                        }
                    };

                    $notifyRequesters($rejectedNotifications, 'shortlisted_subcontractor_rejected', 'Your shortlisted subcontractor has been rejected');
                    $notifyRequesters($approvedNotifications, 'shortlisted_subcontractor_approved', 'Your shortlisted subcontractor has been approved');
                    $notifyRequesters($nextLevelNotifications, 'approval_required', 'Shortlisted subcontractor requires your approval');
                }
            },

            Generic::set("json", fn ($a) => json_encode([
                "sids" => $a->get("subcontractor_update_response"),
                "success" => true
            ])),
        ],
    ],
    [
        "id" => "shortlisted_subcontractor_rejection_acknowledge",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/shortlisted-subcontractors\/(?<id>[0-9]+)\/acknowledge$",
        "method" => "PATCH",
        "description" => "Acknowledge rejected shortlisted subcontractor",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidatePackageByProject"),
            function ($a) {
                $projectId = (int) $a->get('uriArgs.project_id');
                $tenderId = (int) $a->get('uriArgs.tender_id');
                $scId      = (int) $a->get('uriArgs.id');
                $scData = Manager::getService("project")->fetch(
                    "project/{$projectId}/tender/{$tenderId}/shortlisted-subcontractors/{$scId}"
                )->getShape("data")->toArray();

                if (empty($scData)) {
                    throw new MiddlewareException(
                        "SubcontractorNotFound",
                        "Shortlisted subcontractor not found"
                    );
                }

                $a->set('shortlisted_subcontractor', $scData);
            },

            function ($a) {
                $userId = (int) $a->get('user.id');
                $sc     = $a->get('shortlisted_subcontractor');

                if ((int) $sc['author_id'] !== $userId) {
                    throw new MiddlewareException(
                        "ShortlistSubcontractorOwnershipError",
                        "You are not authorised to acknowledge this rejection."
                    );
                }

                if (($sc['status'] ?? '') !== 'Rejected') {
                    throw new MiddlewareException(
                        "InvalidStatus",
                        "Only rejected subcontractors can be acknowledged."
                    );
                }
            },

            function ($a) {
                $request = $a->getRoute()->getRequest();
                $json    = $request->getData()->getShape('json');
                $status = $json->get('status');
                $a->set('payload', new Shape([
                    'status' => $status
                ]));

                $entity = [
                    'entity_type' => 'shortlisted_subcontractor',
                    'entity_id' => $a->get('uriArgs.id')
                ];
                $a->set('entity', $entity);
                ApprovalMiddleware::removeApprovalLevelWorkflowByEntity('entity')($a);
            },

            Rest::update(
                "project",
                "project/{uriArgs.project_id}/tender/{uriArgs.tender_id}/shortlisted-subcontractors/{uriArgs.id}",
                "payload"
            ),

            function ($a) use ($get_latest_sent_for_approval_instance) {
                $instance = max(1, $get_latest_sent_for_approval_instance((int) $a->get('uriArgs.id')));
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.id'),
                    'entity_type' => 'shortlisted_subcontractor',
                    'type'        => 'Rejection Acknowledged',
                    'meta'        => json_encode([
                        'message' => 'Rejection acknowledged from shortlisted subcontractor',
                        'user'    => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        'instance' => $instance,
                    ]),
                ]);
            },
            LogsMiddleware::createLogs('logData'),

            Generic::set("json", fn () => json_encode([
                "success" => true
            ])),
        ],
    ],
    [
        "id" => "subcontractor_list_approval_logs",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/shortlisted-subcontractors\/(?<id>[0-9]+)\/logs$",
        "method" => "GET",
        "description" => "Get all logs for a specific shortlisted subcontractor",
        "response_keys" => "logs",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidatePackageByProject"),
            function($a) use ($convertToUKTime) {
                $data = [
                    "entity_type" => 'shortlisted_subcontractor',
                    "entity_id"   => $a->get('uriArgs.id'),
                ];

                $logs = Manager::getService("project")
                    ->fetch("logs", $data)
                    ->getCollection("data")
                    ->sort(fn ($a, $b) => $a["created_at"] <=> $b["created_at"]);

                $userIds = $logs->values('user_id', true);
                if (!empty($userIds)) {
                    $a->set("user_ids", $userIds);
                    UserMiddleware::loadUsersByIdArray("user_ids")($a);
                    $users = $a->get("users") ?? [];

                    $userNamesById = [];
                    foreach ($users as $user) {
                        $uid = $user['id'] ?? null;

                        if (!$uid) { continue; }

                        $userNamesById[$uid] = $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'];
                    }

                    $logs->map(function($log) use ($userNamesById) {
                        $logUserId = $log->int('user_id');
                        $user_name = $userNamesById[$logUserId];
                        $log->set('user_name', $user_name ?? '');
                        return $log;
                    });
                }

                $logsArray = $logs->getItemsAsArray();

                $tenderId = (int) $a->get('uriArgs.tender_id');
                $matchedTender = array_filter($a->get('project.tender') ?? [], static function ($item) use ($tenderId) {
                    return isset($item['id']) && (int) $item['id'] === $tenderId;
                });
                $packageName = current($matchedTender)['label'] ?? '';
                $shortlistedId = (int) $a->get('uriArgs.id');

                $formatRuleLabel = static function (string $ruleType, array $level = []): string {
                    $normalizedRuleType = strtolower(trim($ruleType));
                    switch ($normalizedRuleType) {
                        case 'all':
                            return 'All must approve';
                        case 'any':
                            return 'Anyone can approve';
                        case 'custom':
                            $minRequired = (int) ($level['min_required'] ?? 1);
                            $roles = is_array($level['roles'] ?? null) ? $level['roles'] : [];
                            $entries = is_array($level['entries'] ?? null) ? $level['entries'] : [];
                            $roleCount = count($roles) > 0 ? count($roles) : count($entries);
                            return "Any {$minRequired} from {$roleCount} must approve";
                        default:
                            return 'Unknown';
                    }
                };

                $groupLogsByInstance = function(array $logs): array
                {
                    $ungrouped = [];
                    $instances = [];

                    foreach ($logs as $log) {
                        $meta = json_decode($log['meta'], true);

                        $instance = $meta['instance']
                            ?? $meta['approvalassign']['instance']
                            ?? $meta['approval_info']['instance']
                            ?? null;

                        if ($instance === null) {
                            $ungrouped[] = $log;
                            continue;
                        }

                        $instances[$instance][] = $log;
                    }

                    ksort($instances);

                    return [
                        'ungrouped' => $ungrouped,
                        'instances' => $instances,
                    ];
                };

                $buildLogs = function(array $logs) use($groupLogsByInstance, $formatRuleLabel, $convertToUKTime): array
                {
                    $grouped = $groupLogsByInstance($logs);
                    $skipTypes = ['Sent For Approval', 'Approved', 'Rejected'];
                    $output = [];

                    // Add ungrouped logs as-is
                    foreach ($grouped['ungrouped'] as $log) {
                        $meta = json_decode($log['meta'], true);
                        $output[] = [
                            'type'      => str_replace(' ', '_', strtolower($log['type'])),
                            'label'     => $log['type'],
                            'user'      => $meta['user'],
                            'timestamp' => $convertToUKTime($log['created_at']),
                            'comment'   => $meta['message'] ?? '',
                        ];
                    }

                    // Process each instance
                    foreach ($grouped['instances'] as $instance => $instanceLogs) {
                        // Find the Sent For Approval log
                        $sentLog = null;
                        foreach ($instanceLogs as $log) {
                            if ($log['type'] === 'Sent For Approval') {
                                $sentLog = $log;
                                break;
                            }
                        }

                        if (!$sentLog) { continue; }

                        $meta = json_decode($sentLog['meta'], true);
                        $approvalAssign = $meta['approvalassign'];

                        // Collect Approved/Rejected logs keyed by approval_level_id + user_id
                        $verdicts = [];
                        foreach ($instanceLogs as $log) {
                            if (in_array($log['type'], ['Approved', 'Rejected'])) {
                                $verdictMeta = json_decode($log['meta'], true);

                                $approvalInfo = $verdictMeta['approval_info'] ?? null;
                                $verdictInstance = $approvalInfo['instance'] ?? $verdictMeta['instance'] ?? null;
                                $levelId = $approvalInfo['approval_level_id'] ?? null;

                                if ($verdictInstance !== $instance) continue;

                                $verdicts[$levelId][$log['user_id']] = [
                                    'type'      => strtolower($log['type']),
                                    'label'     => ApprovalSatisfactionHelper::resolveApprovalLogLabelFromMeta(
                                        $verdictMeta,
                                        $log['type']
                                    ),
                                    'user'      => $verdictMeta['user'],
                                    'timestamp' => $convertToUKTime($log['created_at']),
                                    'comment'   => $verdictMeta['comment'] ?? '',
                                ];
                            }
                        }

                        // Build levels with verdict entries appended
                        $levels = [];
                        foreach ($approvalAssign['levels'] as $level) {
                            $levelId = $level['approval_level_id'];

                            // Convert all entry timestamps first
                            foreach ($level['entries'] as &$entry) {
                                $entry['timestamp'] = $convertToUKTime($entry['timestamp']);
                            }
                            unset($entry);

                            foreach ($level['entries'] as &$entry) {
                                $uid = $entry['user_id'] ?? null;
                                $match = $verdicts[$levelId][$uid] ?? $verdicts[null][$uid] ?? null;
                                if ($uid && $match) {
                                    $entry = array_merge($entry, $match);
                                }

                                $entry = ApprovalSatisfactionHelper::finalizeLogEntryForGet($entry);
                            }
                            unset($entry);

                            $levels[] = $level;
                        }

                        $levels = ApprovalSatisfactionHelper::applyLogLevelProgression($levels);

                        foreach ($levels as &$level) {
                            $level['rule'] = $formatRuleLabel($level['rule'], $level);
                            $level['entries'] = array_values($level['entries']);
                            $level = ApprovalSatisfactionHelper::stripSatisfactionFlagsForGet($level);
                        }
                        unset($level);

                        $output[] = [
                            'type'      => $approvalAssign['type'],
                            'heading'   => $approvalAssign['heading'],
                            'label'     => $approvalAssign['label'],
                            'user'      => $approvalAssign['user'],
                            'timestamp' => $convertToUKTime($approvalAssign['timestamp']),
                            'levels'    => $levels,
                        ];

                        foreach ($instanceLogs as $log) {
                            if (in_array($log['type'], $skipTypes)) continue;

                            $meta = json_decode($log['meta'], true);
                            $output[] = [
                                'type'      => str_replace(' ', '_', strtolower($log['type'])),
                                'label'     => $log['type'],
                                'user'      => $meta['user'],
                                'timestamp' => $convertToUKTime($log['created_at']),
                                'comment'   => $meta['message'] ?? '',
                            ];
                        }
                    }

                    return $output;
                };

                $result = $buildLogs($logsArray);

                $a->set("logs_payload", [
                    "entity_no" => "sc-" . $shortlistedId,
                    "package_name" => $packageName,
                    "logs" => $result,
                ]);
            },

            Generic::set("json", fn($a) => json_encode($a->get("logs_payload"))),
        ],
    ],
    [
        "id" => "shortlisted-subcontractors_approval_reminder",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/shortlisted-subcontractors\/(?<id>[0-9]+)\/approvals\/(?<approval_id>[0-9]+)\/reminder$",
        "method" => "POST",
        "description" => "Reminder approver to approve a shortlisted subcontractor",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            function ($a) {

                $shortlistedSubcontractor = Manager::getService("project")->fetch(
                    sprintf(
                        "project/%d/tender/%d/shortlisted-subcontractors/%d",
                        $a->get('uriArgs.project_id'),
                        $a->get('uriArgs.tender_id'),
                        $a->get('uriArgs.id')
                    )
                )->getShape("data")->get();

                $a->set('shortlisted_subcontractor', $shortlistedSubcontractor);

                if (empty($shortlistedSubcontractor)) {
                    throw new MiddlewareException("noEntityFound", "Shortlisted subcontractor not found.");
                }

                if ($shortlistedSubcontractor['status'] !== 'Pending') {
                    throw new MiddlewareException("ReminderStatusError", "You can only send a reminder when the record status is Pending.");
                }

                $a->set('approval_workflow_entity', [
                    'entity_type' => 'shortlisted_subcontractor',
                    'entity_id' => $a->get('uriArgs.id'),
                ]);
                ApprovalMiddleware::fetchApprovalsList()($a);
                $approvals = $a->getCollection('approvals')->filterByField('id', (int) $a->get('uriArgs.approval_id'))->first()->get();
                if (!$approvals) {
                    throw new MiddlewareException('ApprovalNotFound', 'No Approval Request found.');
                }

                if ($approvals['status']['label'] !== 'Pending') {
                    throw new MiddlewareException('ApprovalNotFound', 'The user has already approved/rejected this request.');
                }

                $a->set('approval', $approvals);
                $a->set('approver_user_ids', [$approvals['user_id']]);

                $res = Manager::getService('account')->fetch('email/logs-by-entity', [
                    'entity_type' => 'shortlisted_subcontractor',
                    'entity_id' => $a->get('uriArgs.id'),
                    'user_ids' => implode($a->get('approver_user_ids')),
                ])->getShape('data')->toArray();
                $a->set('email_logs', $res);
            },
            UserMiddleware::loadUsersByIdArray("approver_user_ids"),
            function ($a) {
                $approval = $a->get('approval');
                $shortlistedSubcontractor = $a->get('shortlisted_subcontractor');
                $emailLogs = $a->get('email_logs');
                $userId = $a->get("approver_user_ids")[0];
                if (count($emailLogs) > 0) {
                    $matchedLoggedUser = array_filter($emailLogs, function ($item) use ($userId) {
                        return isset($item['user_id']) && $item['user_id'] == $userId;
                    });
                    $matchedLoggedUser = $matchedLoggedUser[count($matchedLoggedUser) - 1];
                    $givenTime = new DateTime($matchedLoggedUser['sent_date']);
                    $now = new DateTime();

                    $diffInSeconds = $now->getTimestamp() - $givenTime->getTimestamp();

                    $matchTime = $diffInSeconds > 86400;
                    if (!$matchTime) {
                        throw new MiddlewareException("ReminderStatusError", "You can only send one reminder per 24-hour period.");
                    }
                }
                $tenderId = $shortlistedSubcontractor['tender_id'];
                $matchedUser = array_filter($a->get('users'), function ($item) use ($userId) {
                    return isset($item['id']) && $item['id'] == $userId;
                });
                $user = array_shift($matchedUser);
                $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                    return isset($item['id']) && $item['id'] == $tenderId;
                });
                $packageName = current($matched)['label'] ?? '';
                $projectName = $a->get('project.name');




                $subContractorAccountIds = $shortlistedSubcontractor['account_id'];

                $a->set('sids', [$subContractorAccountIds]);
                AccountMiddleware::loadAccountsByIdArray('sids', key: 'subcontractor_accounts')($a);
                $subcontractorAccounts = $a->get('subcontractor_accounts');

                $redirectUrl = sprintf(
                    "project/%s/procurement_schedule#%s",
                    $a->get('project.slug'),
                    $packageName
                );

                $dateTime = SubcontractorListApprovalMiddleware::getUKDateTime($approval['created_at']);
                $convertedDateTime = sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']);
                $emailPayload = [
                    'approverName' => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                    'qsFullName' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                    'packageName' => $packageName,
                    'projectName' => $projectName,
                    'redirectUrl' => $redirectUrl,
                    'email' => $user['email'],
                    'user_id' => $user['id'],
                    'requestDateTime' => $convertedDateTime,
                    'subcontractorName' => $subcontractorAccounts[0]['name'] ?? '',
                    'entityType' => 'shortlisted_subcontractor',
                    'entityId' => $a->get('uriArgs.id'),
                ];
                $a->set('payload', new Shape($emailPayload));

                // Send email to Approver
                SubcontractorListApprovalMiddleware::sendSubcontractorListApprovalEmail(template: "sl_reminder")($a);

                $emailPayload['email'] = $a->get('user.email');
                $emailPayload['user_id'] = $a->get('user.id');
                $a->set('payload', new Shape($emailPayload));

                // Send notification to Requester
                SubcontractorListApprovalMiddleware::sendSubcontractorListApprovalEmail(template: "sl_reminder_requester")($a);
                // Reminder Log
                $payload = $a->get('payload');
                $requesterName = $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                $approverName  = $payload->get('approverName');
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.id'),
                    'entity_type' => 'shortlisted_subcontractor',
                    'type'        => 'Reminder Sent',
                    'meta'        => json_encode([
                        'message' => sprintf(
                            "Shortlisted Subcontractor approval reminder has been sent by %s to %s.",
                            $requesterName,
                            $approverName
                        ),
                        'user'        => $requesterName,
                        'sent_to'        => $approverName,
                        'sent_to_email'  => $payload->get('email'),
                    ]),
                ]);
                LogsMiddleware::createLogs('logData')($a);
            },
            Generic::set("json", fn($a) => json_encode(["success" => true])),
        ],
    ],
];
