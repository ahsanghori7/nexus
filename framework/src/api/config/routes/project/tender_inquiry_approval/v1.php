<?php

use Api\Middleware\LogsMiddleware;
use Api\Middleware\NotificationMiddleware;
use Api\Middleware\Email\TenderInquiryMiddleware;
use Core\Config;
use Core\Middleware\Procedure;
use Core\Middleware\Service\UserMiddleware;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;
use Core\Middleware\Generic;
use Core\Data\Shape;
use Api\Middleware\TenderMiddleware;
use Core\Middleware\Conditional;
use Api\Middleware\ApprovalMiddleware;
use Api\Middleware\ApprovalSatisfactionHelper;
use Api\Middleware\DocumentMiddleware;
use Core\Service\Manager;
use Prosper\Middleware\SqsMiddleware;

$emailQueue = Config::get("services.aws.sqs.queues.approval_email");

$convertToUKTime = function ($dateTime) {
    if (!$dateTime) {
        return $dateTime;
    }
    $date = new DateTime($dateTime, new DateTimeZone('UTC'));
    $date->setTimezone(new DateTimeZone('Europe/London'));
    return $date->format('Y-m-d H:i:s');
};

$sentForApprovalLogType = 'Sent For Approval';
$sentForApprovalLogMessage = 'Approver(s) assigned to tender inquiry approval';

include_once(__DIR__ . "/../tender_recommendation/procedures.php");

return [
    [
        "id" => "tender_inquiry_approvals",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<t_id>[0-9]+)\/tender_inquiry\/(?<ti_id>[0-9]+)\/approvals$",
        "method" => "POST",
        "description" => "Assign approver/s to a tender inquiry",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            TenderMiddleware::fetchPackage("uriArgs.t_id"),
            function($a){
                $request = $a->getRoute()->getRequest();
                $requestData = $request->getData()->getShape('json')->toArray();
                $a->set('requestData', $requestData);

                $data = [];
                $data['approvers'] = $requestData;
                $data['entity_type'] = 'document';
                $data['entity_id'] = $a->get('uriArgs.ti_id');
                $data['status'] = 'Pending';
                $data['requester_user_id'] = $a->get('user.id');
                $a->set('payload', new Shape($data));

                $checkApprovalAsignee = Manager::getService("project")->fetch("approvals", $data)->getShape("data")->count();
                if ($checkApprovalAsignee > 0) {
                    throw new MiddlewareException("TenderInquiryApproversAlreadyExists", 'Approval already assigned to one or more users');
                }

                $instance = ApprovalSatisfactionHelper::getLatestSentForApprovalInstance(
                    'document',
                    (int) $a->get('uriArgs.ti_id'),
                    ApprovalSatisfactionHelper::SENT_FOR_APPROVAL_LOG_TYPE,
                    true
                ) + 1;
                $a->set('instance', $instance);

                // Dedup levels, keeping the order each approval_level_id first appears in
                // the request, so a level referenced by multiple approvers only gets one
                // approval_level_workflow row.
                $approvalLevelIds = array_unique(array_column($requestData, 'approval_level_id'));

                $configurations = Manager::getService("project")
                    ->fetch(sprintf(
                        "approval-workflow-configurations/%d/type/tender_enquiry",
                        $a->get('user.account_id')
                    ))
                    ->getShape('data')
                    ->get();
                $approvalLevels = ApprovalMiddleware::mapApprovalLevelsById(
                    is_array($configurations) ? $configurations : [],
                    array_map('intval', $approvalLevelIds)
                );
                $approvalLevels = ApprovalMiddleware::mergeThresholdRoles(
                    $approvalLevels,
                    'tender_enquiry',
                    (int) $a->get('user.account_id'),
                    null
                );
                $a->set("approval_levels", $approvalLevels);

                $sortedApprovalLevelIds = array_values($approvalLevelIds);
                usort(
                    $sortedApprovalLevelIds,
                    static fn ($a, $b) => ($approvalLevels[$a]['sort_order'] ?? 0) <=> ($approvalLevels[$b]['sort_order'] ?? 0)
                );

                $approvalWorkflowPayload = [];
                $inProgressAssigned = false;
                foreach ($sortedApprovalLevelIds as $id) {
                    $levelRows = array_filter(
                        $requestData,
                        static fn ($row) => (int) ($row['approval_level_id'] ?? 0) === (int) $id
                    );
                    $isLevelSatisfied = ApprovalSatisfactionHelper::isLevelSatisfiedFromRows($levelRows);
                    $workflowStatus = ApprovalSatisfactionHelper::resolveWorkflowStatus($isLevelSatisfied, $inProgressAssigned);
                    $levelMeta = is_array($approvalLevels[$id] ?? null) ? $approvalLevels[$id] : [];
                    $approvalWorkflowPayload[] = [
                        'approval_level_id' => $id,
                        'entity_type' => 'document',
                        'entity_id' => $a->get('uriArgs.ti_id'),
                        'status' => $workflowStatus,
                        'sort_order' => $levelMeta['sort_order'] ?? 0,
                        'meta' => json_encode(array_merge(
                            $levelMeta,
                            ApprovalSatisfactionHelper::buildLevelMetaFlagsFromRows($levelRows),
                            [
                                'instance' => $instance,
                                'consolidate_notifications' => !empty($configurations['consolidate_notifications']),
                            ]
                        )),
                    ];
                }
                $a->set("approval_workflow_payload", $approvalWorkflowPayload);
                $a->set('assign_approval_complete', $sortedApprovalLevelIds !== [] && !$inProgressAssigned);
            },
            ApprovalMiddleware::saveApprovalLevelWorkflow('approval_workflow_payload'),
            function($a){
                $approverData = $a->get('payload.approvers');
                $approvalLevelWorkflowIds = $a->get('save_approval_level_workflow_response')['data'];
                $workflowIdByLevelId = [];
                foreach ($approvalLevelWorkflowIds as $item) {
                    $workflowIdByLevelId[(int) $item['approval_level_id']] = $item['approval_level_workflow_id'];
                }
                $userData = [];
                foreach ($approverData as $value) {
                    $userData[] = array_merge(
                        [
                            'user_id' => $value['user_id'],
                            'approval_level_workflow_id' => $workflowIdByLevelId[(int) $value['approval_level_id']],
                        ],
                        ApprovalSatisfactionHelper::extractFlags($value)
                    );
                }
                $a->updateShape('payload', [
                    'approvers' => $userData
                ]);
            },
            Rest::write(
                "project",
                "approvals/assign",
                function ($payload, $a) {
                    return $a->get("payload");
                },
                'payload'
            ),
            function ($a) {
                $notifyLevelId = null;
                foreach ($a->get('approval_workflow_payload') as $workflowRow) {
                    if (($workflowRow['status'] ?? '') === 'in_progress') {
                        $notifyLevelId = (int) ($workflowRow['approval_level_id'] ?? 0);
                        break;
                    }
                }

                $notifyUserIds = [];
                foreach ($a->get('requestData') as $approver) {
                    if ((int) ($approver['approval_level_id'] ?? 0) !== $notifyLevelId
                        || !ApprovalSatisfactionHelper::shouldNotifyApprover($approver)) {
                        continue;
                    }
                    $notifyUserIds[(int) $approver['user_id']] = (int) $approver['user_id'];
                }
                $a->set('user_ids', array_values($notifyUserIds));
            },
            UserMiddleware::loadUsersByIdArray("user_ids"),
            function($a){ // Email notifications — queued, same async pattern as assign-order-approvers
                $users = $a->get('users') ?? [];
                if ($users === []) {
                    return;
                }
                $redirectUrl = sprintf("document-creator/template/%s/tender/%s", $a->get('uriArgs.ti_id'), $a->get('uriArgs.t_id'));
                $packageName = $a->get('package.label');
                $projectName = $a->get('project.name');
                $requesterName = $a->get('user.display_name');
                $dateTime = sprintf("%s at %s UK Time", date("d/m/Y"), date("H:i"));

                $emailData = [];
                foreach ($users as $user) {
                    $emailData[] = [
                        'sender'   => ['id' => $a->get('user.id')],
                        'email'    => $user['email'],
                        'template' => 'Tender Inquiry Assign Approver',
                        'user_id'  => $user['id'],
                        'body' => [
                            'approverName'   => $user['display_name'],
                            'requesterName'  => $requesterName,
                            'packageName'    => $packageName,
                            'projectName'    => $projectName,
                            'dateTime'       => $dateTime,
                            'url'            => $redirectUrl,
                            'plain_redirect' => true,
                        ],
                    ];

                    // Notify this approver a tender inquiry needs their approval — additive to the queued email above.
                    $a->set('notification_payload', [
                        'account_id' => (int) ($user['account_id'] ?? $a->get('user.account_id')),
                        'receiver_user_id' => (int) $user['id'],
                        'project_id' => $a->get('project.id'),
                        'type' => 'approval_required',
                        'title' => 'Tender enquiry requires your approval',
                        'message' => NotificationMiddleware::buildContextLine([
                            ['label' => 'Project', 'value' => $projectName],
                            ['label' => 'Package Name', 'value' => $packageName],
                            ['label' => 'By', 'value' => $requesterName],
                        ]),
                        'target_type' => 'tender_inquiry',
                        'target_id' => (int) $a->get('uriArgs.ti_id'),
                        'target_url' => $redirectUrl,
                    ]);
                    NotificationMiddleware::createSilently()($a);

                    // Notification to Requester
                    $emailData[] = [
                        'sender'   => ['id' => $a->get('user.id')],
                        'email'    => $a->get('user.email'),
                        'template' => 'Tender Inquiry Assign Approver Requester',
                        'user_id'  => $a->get('user.id'),
                        'body' => [
                            'approverName'  => $user['display_name'],
                            'requesterName' => $requesterName,
                            'packageName'   => $packageName,
                            'projectName'   => $projectName,
                            'dateTime'      => $dateTime,
                            'url'           => $redirectUrl,
                        ],
                    ];
                }

                $queueData = [[
                    'type'       => 'tender_inquiry',
                    'uid'        => $a->get('user.id'),
                    'email_data' => $emailData,
                    'time'       => time(),
                ]];
                $a->set('queueData', $queueData);
            },
            SqsMiddleware::writeAll("queueData", $emailQueue),
            function ($a) use ($sentForApprovalLogType, $sentForApprovalLogMessage) {
                $tiId = (int) $a->get('uriArgs.ti_id');
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

                $fetchWorkflowRows = static function (int $entityId): array {
                    $rowsRaw = Manager::getService("project")
                        ->fetch("approval-workflow-process/document/{$entityId}")
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
                        $approvalLevelId = (int) ($meta['id'] ?? 0);
                        if ($approvalLevelId <= 0) {
                            continue;
                        }
                        $workflowByLevelId[$approvalLevelId] = [
                            'sort_order' => (int) ($workflowRow['sort_order'] ?? 0),
                            'rule' => strtolower((string) ($meta['rule_type'] ?? 'all')),
                            'min_required' => $meta['min_required'] ?? 0,
                            'status' => strtolower((string) ($workflowRow['status'] ?? 'pending')),
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

                $fetchApprovals = static function (int $entityId): array {
                    $rows = Manager::getService("project")
                        ->fetch("approvals", [
                            'entity_type' => 'document',
                            'entity_id' => $entityId,
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
                        $rowForType = array_merge($approvalRow, $approvalMeta);
                        $entriesByLevelId[$approvalLevelId][] = array_merge(
                            [
                                'type' => ApprovalSatisfactionHelper::approverEntryType($rowForType),
                                'user_id' => $approverUserId,
                                'user' => $userNameById[$approverUserId] ?? '',
                                'timestamp' => (string) ($approvalRow['updated_at'] ?? ''),
                                'comment' => (string) ($approvalRow['comment'] ?? ''),
                            ],
                            ApprovalSatisfactionHelper::approverLogFlags($rowForType)
                        );
                    }
                    return $entriesByLevelId;
                };

                $buildLevels = static function (array $workflowByLevelId, array $entriesByLevelId): array {
                    $levelIds = array_values(array_unique(array_merge(
                        array_keys($workflowByLevelId),
                        array_keys($entriesByLevelId)
                    )));
                    usort($levelIds, static function ($x, $y) use ($workflowByLevelId) {
                        $xSort = (int) ($workflowByLevelId[$x]['sort_order'] ?? PHP_INT_MAX);
                        $ySort = (int) ($workflowByLevelId[$y]['sort_order'] ?? PHP_INT_MAX);
                        if ($xSort === $ySort) {
                            return ((int) $x) <=> ((int) $y);
                        }
                        return $xSort <=> $ySort;
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

                $buildLog = static function ($action, int $tiId, int $instance, string $timestamp, array $levels) use ($sentForApprovalLogType, $sentForApprovalLogMessage): array {
                    return [
                        'user_id'     => $action->get('user.id'),
                        'entity_id'   => $tiId,
                        'entity_type' => 'document',
                        'type'        => $sentForApprovalLogType,
                        'meta'        => json_encode([
                            'message' => $sentForApprovalLogMessage,
                            'user'    => $action->get('user.display_name') ?: $action->get('user.firstname') . ' ' . $action->get('user.lastname'),
                            'approver_assign' => [
                                'type' => 'approval_request',
                                'instance' => $instance,
                                'heading' => "Approval Request #{$instance}",
                                'label' => $sentForApprovalLogType,
                                'status' => 'pending',
                                'user_id' => (string) $action->get('user.id'),
                                'user' => $action->get('user.display_name') ?: $action->get('user.firstname') . ' ' . $action->get('user.lastname'),
                                'timestamp' => $timestamp,
                                'ti_id' => $tiId,
                                'levels' => $levels,
                            ],
                        ]),
                    ];
                };

                $workflowRows = $fetchWorkflowRows($tiId);
                $workflowMap = $mapWorkflow($workflowRows);
                $workflowByLevelId = $workflowMap['workflow_by_level_id'] ?? [];
                $workflowIdToLevelId = $workflowMap['workflow_id_to_level_id'] ?? [];

                $approvalsRows = $fetchApprovals($tiId);
                $userNameById = $buildUserMap($a->get('users') ?? []);
                $userNameById = $enrichMissingUsers($a, $approvalsRows, $userNameById);
                $entriesByLevelId = $mapApprovalEntries($approvalsRows, $workflowIdToLevelId, $userNameById);

                $instance = (int) $a->get('instance');
                $levels = $buildLevels($workflowByLevelId, $entriesByLevelId);

                $a->set('logData', $buildLog($a, $tiId, $instance, $timestamp, $levels));
            },
            LogsMiddleware::createLogs('logData'),
            function ($a) {
                if (!$a->get('assign_approval_complete')) {
                    return;
                }

                $userName = $a->get('user.display_name')
                    ?: trim(($a->get('user.firstname') ?? '') . ' ' . ($a->get('user.lastname') ?? ''));
                $redirectUrl = sprintf(
                    "main-contractor/project/%s/issue_enquiry%s",
                    $a->get('project.slug'),
                    urlencode('#document-' . $a->get('uriArgs.ti_id'))
                );
                $a->set('payload', new Shape([
                    'status' => 'Approved',
                    'approverName' => $userName,
                    'requesterName' => $userName,
                    'packageName' => $a->get('package.label'),
                    'projectName' => $a->get('project.name'),
                    'redirectUrl' => $redirectUrl,
                    'email' => $a->get('user.email'),
                    'user_id' => $a->get('user.id'),
                    'comment' => '',
                ]));
                TenderInquiryMiddleware::sendTenderInquiryEmail(template: "ti_approved")($a);
            },
            Generic::set("json", fn($a) => json_encode(["success" => true])),
        ],
    ],
    [
        "id" => "tender_inquiry_approval_update",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<t_id>[0-9]+)\/tender_inquiry\/(?<id>[0-9]+)\/approval\/(?<approver_id>[0-9]+)$",
        "method" => "PUT",
        "description" => "Approver action to a tender enquiry",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateApprovalById"),
            TenderMiddleware::fetchPackage("uriArgs.t_id"),
            function ($a) {
                $json = $a->getRoute()->getRequest()->getData()->getShape('json');
                $status = $json->get('status');
                if (!in_array($status, ['Approved', 'Rejected'], true)) {
                    throw new MiddlewareException(
                        "InvalidStatus",
                        "Status must be 'Approved' or 'Rejected'"
                    );
                }

                $sessionUserId = $a->int('user.id');
                $entityId = (int) $a->get('uriArgs.id');
                $approvalId = (int) $a->get('uriArgs.approver_id');

                $approvalRows = Manager::getService("project")->fetch("approvals", [
                    'entity_type' => 'document',
                    'entity_id' => $entityId,
                    'user_id' => $sessionUserId,
                ])->getShape("data")->toArray();

                $approval = null;
                foreach ($approvalRows as $row) {
                    if (
                        is_array($row)
                        && (int) ($row['id'] ?? 0) === $approvalId
                        && (int) ($row['user_id'] ?? 0) === $sessionUserId
                    ) {
                        $approval = $row;
                        break;
                    }
                }
                if ($approval === null) {
                    throw new MiddlewareException(
                        "tenderInquryOwnershipError",
                        "You don't have access to approve/reject this Tender Inquiry."
                    );
                }

                if (($approval['status']['label'] ?? '') !== 'Pending') {
                    throw new MiddlewareException(
                        "TenderInquiryApprovalAssignFailed",
                        "You have already submitted your approval decision for this Tender Inquiry."
                    );
                }

                $a->set('requester_user_ids', [(int) ($approval['requester_user_id'] ?? 0)]);
                $a->set('payload', $json);
                $a->set('status', $status);
                $a->set('decision_comment', $json->get('comment') ?? '');
                $a->set(
                    'current_approval_level_workflow_id',
                    (int) ($approval['approval_level_workflow_id'] ?? 0)
                );
                $a->set('cascade_plan', ['actions' => [], 'remaining_pending' => []]);
                $a->set('next_level_user_ids', []);
                $a->set('all_approval_rows', []);
                $a->set('pending_workflow_rows', []);
            },
            function ($a) {
                $entityId = (int) $a->get('uriArgs.id');
                $a->set('approval_workflow_entity', ['entity_type' => 'document', 'entity_id' => $entityId]);
                ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity('approval_workflow_entity')($a);
                $workflowRows = $a->getCollection('approval_workflows')->getItemsAsArray();
                $currentWorkflowId = (int) $a->get('current_approval_level_workflow_id');
                $useNewLevelLogic = $currentWorkflowId > 0 && $workflowRows !== [];
                $a->set('use_new_level_logic', $useNewLevelLogic);
                $a->set('approval_workflow_rows', $workflowRows);
                $a->set('is_approval_complete', !$useNewLevelLogic);
                $a->set('is_level_complete', !$useNewLevelLogic);

                if (!$useNewLevelLogic) {
                    return;
                }

                $inProgressWorkflow = null;
                foreach ($workflowRows as $row) {
                    if (($row['status'] ?? '') === 'in_progress') {
                        $inProgressWorkflow = $row;
                        break;
                    }
                }

                if (!$inProgressWorkflow || (int) $inProgressWorkflow['id'] !== $currentWorkflowId) {
                    throw new MiddlewareException(
                        "tenderInquryOwnershipError",
                        "You are not authorised to approve or reject this Tender Inquiry at the current approval level."
                    );
                }

                $meta = ApprovalSatisfactionHelper::decodeMeta($inProgressWorkflow['meta'] ?? null);
                $approvalLevel = is_array($meta['approval_level'] ?? null)
                    ? $meta['approval_level']
                    : $meta;
                $a->set('current_approval_level_id', (int) ($approvalLevel['id'] ?? $meta['id'] ?? 0) ?: null);
                $a->set('approval_workflow_in_progress', $inProgressWorkflow);
                $a->set('current_workflow_meta', $meta);
            },
            Rest::update(
                "project",
                "approvals/{uriArgs.approver_id}",
                "payload",
                postProcessor: function ($res, $a, $data) {
                    if (!empty($data->get('error'))) {
                        throw new MiddlewareException("TenderInquiryApprovalAssignFailed", $data->get('error.description'));
                    }
                }
            ),
            function ($a) {
                $status = $a->get('status');
                $useNewLevelLogic = (bool) $a->get('use_new_level_logic');
                if (!$useNewLevelLogic) {
                    return;
                }

                $entityId = (int) $a->get('uriArgs.id');
                $inProgressWorkflow = $a->get('approval_workflow_in_progress');
                $inProgressWorkflowId = (int) ($inProgressWorkflow['id'] ?? 0);
                $sessionUserId = (int) $a->get('user.id');
                $currWorkflowMeta = $a->get('current_workflow_meta') ?? [];

                if ($status === 'Rejected') {
                    Manager::getService("project")->update(
                        sprintf("approval-workflow-process/workflow/%s", $inProgressWorkflowId),
                        new Shape(['data' => ['status' => 'rejected']])
                    );
                    $a->set('is_approval_complete', true);
                    return;
                }

                if ($status !== 'Approved') {
                    return;
                }

                $approvalData = Manager::getService("project")->fetch("approvals", [
                    'entity_type' => 'document',
                    'entity_id'   => $entityId,
                ])->getShape("data")->toArray();
                $a->set('all_approval_rows', $approvalData);

                $levelApprovals = array_values(array_filter(
                    $approvalData,
                    static fn ($row) => is_array($row)
                        && (int) ($row['approval_level_workflow_id'] ?? 0) === $inProgressWorkflowId
                ));

                $levelComplete = ApprovalSatisfactionHelper::isLevelCompleteAfterUserApprove(
                    $currWorkflowMeta,
                    $levelApprovals,
                    $sessionUserId
                );
                $a->set('is_level_complete', $levelComplete);

                $pendingWorkflowRows = array_values(array_filter(
                    $a->get('approval_workflow_rows') ?? [],
                    static fn ($row) => is_array($row) && ($row['status'] ?? '') === 'pending'
                ));
                $a->set('pending_workflow_rows', $pendingWorkflowRows);

                $cascadePlan = ApprovalSatisfactionHelper::planCrossLevelCascadesIfEnabled(
                    $currWorkflowMeta,
                    $pendingWorkflowRows,
                    $approvalData,
                    $sessionUserId
                );
                $remainingPending = ApprovalMiddleware::applyCrossLevelCascadePlan($cascadePlan);
                $a->set('cascade_plan', $cascadePlan);

                if ($levelComplete) {
                    Manager::getService("project")->update(
                        sprintf("approval-workflow-process/workflow/%s", $inProgressWorkflowId),
                        new Shape(['data' => ['status' => 'completed']])
                    );

                    if ($remainingPending === []) {
                        $a->set('is_approval_complete', true);
                        return;
                    }

                    usort(
                        $remainingPending,
                        static fn ($left, $right) => (int) ($left['sort_order'] ?? 0) <=> (int) ($right['sort_order'] ?? 0)
                    );
                    $nextWorkflow = $remainingPending[0];
                    Manager::getService("project")->update(
                        sprintf("approval-workflow-process/workflow/%s", (int) $nextWorkflow['id']),
                        new Shape(['data' => ['status' => 'in_progress']])
                    );

                    $cascadeActions = $cascadePlan['actions'] ?? [];
                    $nextUserIds = [];
                    foreach ($approvalData as $row) {
                        if (
                            !is_array($row)
                            || (int) ($row['approval_level_workflow_id'] ?? 0) !== (int) ($nextWorkflow['id'] ?? 0)
                        ) {
                            continue;
                        }
                        if (!ApprovalSatisfactionHelper::shouldNotifyApprover($row, $cascadeActions)) {
                            continue;
                        }
                        $uid = (int) ($row['user_id'] ?? 0);
                        if ($uid > 0) {
                            $nextUserIds[] = $uid;
                        }
                    }
                    $a->set('next_level_user_ids', array_values(array_unique($nextUserIds)));
                }
            },
            UserMiddleware::loadUsersByIdArray("requester_user_ids"),
            function ($a) use ($emailQueue) {
                $users = $a->get('users') ?? [];
                $requester = array_shift($users);
                $a->set('requester_account_id', $requester['account_id'] ?? $a->get('user.account_id'));
                $nextUserIds = $a->get('next_level_user_ids') ?? [];

                if ($requester && $nextUserIds) {
                    UserMiddleware::loadUsersByIdArray('next_level_user_ids', key: 'next_level_users')($a);
                    $redirectUrl = sprintf(
                        "document-creator/template/%s/tender/%s",
                        $a->get('uriArgs.id'),
                        $a->get('uriArgs.t_id')
                    );
                    $dateTime = sprintf("%s at %s UK Time", date("d/m/Y"), date("H:i"));
                    $requesterName = $requester['display_name']
                        ?? trim(($requester['firstname'] ?? '') . ' ' . ($requester['lastname'] ?? ''));

                    $emailData = [];
                    foreach ($a->get('next_level_users') ?? [] as $user) {
                        if (!is_array($user) || empty($user['email'])) {
                            continue;
                        }
                        $emailData[] = [
                            'sender'   => ['id' => $requester['id']],
                            'email'    => $user['email'],
                            'template' => 'Tender Inquiry Assign Approver',
                            'user_id'  => $user['id'],
                            'body' => [
                                'approverName'   => $user['display_name']
                                    ?: trim(($user['firstname'] ?? '') . ' ' . ($user['lastname'] ?? '')),
                                'requesterName'  => $requesterName,
                                'packageName'    => $a->get('package.label'),
                                'projectName'    => $a->get('project.name'),
                                'dateTime'       => $dateTime,
                                'url'            => $redirectUrl,
                                'plain_redirect' => true,
                            ],
                        ];

                        // Notify this next-level approver a tender inquiry needs their approval — additive to the queued email above.
                        $a->set('notification_payload', [
                            'account_id' => (int) ($user['account_id'] ?? $a->get('requester_account_id')),
                            'receiver_user_id' => (int) $user['id'],
                            'project_id' => $a->get('project.id'),
                            'type' => 'approval_required',
                            'title' => 'Tender enquiry requires your approval',
                            'message' => NotificationMiddleware::buildContextLine([
                                ['label' => 'Project', 'value' => $a->get('project.name')],
                                ['label' => 'Package Name', 'value' => $a->get('package.label')],
                                ['label' => 'By', 'value' => $requesterName],
                            ]),
                            'target_type' => 'tender_inquiry',
                            'target_id' => (int) $a->get('uriArgs.id'),
                            'target_url' => $redirectUrl,
                        ]);
                        NotificationMiddleware::createSilently()($a);
                    }

                    if ($emailData !== []) {
                        $a->set('queueData', [[
                            'type'       => 'tender_inquiry',
                            'uid'        => $a->get('user.id'),
                            'email_data' => $emailData,
                            'time'       => time(),
                        ]]);
                        SqsMiddleware::writeAll("queueData", $emailQueue)($a);
                    }
                }

                $status = $a->get('status');
                $documentUrl = sprintf(
                    "document-creator/template/%s/tender/%s",
                    $a->get('uriArgs.id'),
                    $a->get('uriArgs.t_id')
                );

                $redirectUrl = $status === 'Approved'
                    ? sprintf(
                        "main-contractor/project/%s/issue_enquiry%s",
                        $a->get('project.slug'),
                        urlencode('#document-' . $a->get('uriArgs.id'))
                    )
                    : $documentUrl;

                $a->set('payload', new Shape([
                    'status' => $status,
                    'approverName' => $a->get('user.display_name')
                        ?: trim(($a->get('user.firstname') ?? '') . ' ' . ($a->get('user.lastname') ?? '')),
                    'requesterName' => $requester['display_name']
                        ?? trim(($requester['firstname'] ?? '') . ' ' . ($requester['lastname'] ?? '')),
                    'packageName' => $a->get('package.label'),
                    'projectName' => $a->get('project.name'),
                    'redirectUrl' => $redirectUrl,
                    'documentUrl' => $documentUrl,
                    'email' => $requester['email'] ?? null,
                    'user_id' => $requester['id'] ?? null,
                    'comment' => $a->get('decision_comment') ?? '',
                ]));
            },
            Conditional::switched("status", [
                Conditional::isTrue('is_approval_complete', [
                    TenderInquiryMiddleware::sendTenderInquiryEmail(template: "ti_approved"),
                    function ($a) {
                        // Notify the requester their tender inquiry was approved — additive to the email above.
                        $a->set('notification_payload', [
                            'account_id' => (int) ($a->get('requester_account_id') ?? $a->get('user.account_id')),
                            'receiver_user_id' => (int) $a->get('payload.user_id'),
                            'project_id' => $a->get('project.id'),
                            'type' => 'tender_inquiry_approved',
                            'title' => 'Your tender enquiry has been approved',
                            'message' => NotificationMiddleware::buildContextLine([
                                ['label' => 'Project', 'value' => $a->get('project.name')],
                                ['label' => 'Package Name', 'value' => $a->get('package.label')],
                                ['label' => 'By', 'value' => $a->get('user.display_name')
                                    ?: trim(($a->get('user.firstname') ?? '') . ' ' . ($a->get('user.lastname') ?? ''))],
                            ]),
                            'target_type' => 'tender_inquiry',
                            'target_id' => (int) $a->get('uriArgs.id'),
                            'target_url' => $a->get('payload.documentUrl'),
                        ]);
                        NotificationMiddleware::createSilently()($a);
                    },
                ], true),
            ], [
                TenderInquiryMiddleware::sendTenderInquiryEmail(template: "ti_rejected"),
                function ($a) {
                    // Notify the requester their tender inquiry was rejected — additive to the email above.
                    $a->set('notification_payload', [
                        'account_id' => (int) ($a->get('requester_account_id') ?? $a->get('user.account_id')),
                        'receiver_user_id' => (int) $a->get('payload.user_id'),
                        'project_id' => $a->get('project.id'),
                        'type' => 'tender_inquiry_rejected',
                        'title' => 'Your tender enquiry has been rejected',
                        'message' => NotificationMiddleware::buildContextLine([
                            ['label' => 'Project', 'value' => $a->get('project.name')],
                            ['label' => 'Package Name', 'value' => $a->get('package.label')],
                            ['label' => 'By', 'value' => $a->get('user.display_name')
                                ?: trim(($a->get('user.firstname') ?? '') . ' ' . ($a->get('user.lastname') ?? ''))],
                            ['label' => 'Comment', 'value' => $a->get('decision_comment')],
                        ]),
                        'target_type' => 'tender_inquiry',
                        'target_id' => (int) $a->get('uriArgs.id'),
                        'target_url' => $a->get('payload.documentUrl'),
                    ]);
                    NotificationMiddleware::createSilently()($a);
                },
            ], "Approved"),
            function ($a) {
                $status = $a->get('status') ?? 'Pending';
                $userName = $a->get('user.display_name')
                    ?: trim(($a->get('user.firstname') ?? '') . ' ' . ($a->get('user.lastname') ?? ''));
                $instance = max(
                    1,
                    ApprovalSatisfactionHelper::getLatestSentForApprovalInstance(
                        'document',
                        (int) $a->get('uriArgs.id'),
                        ApprovalSatisfactionHelper::SENT_FOR_APPROVAL_LOG_TYPE,
                        true
                    )
                );
                $approvalLevelId = $a->get('current_approval_level_id');
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.id'),
                    'entity_type' => 'document',
                    'type'        => $status,
                    'meta'        => json_encode([
                        'instance' => $instance,
                        'approval_level_id' => $approvalLevelId,
                        'approval_level_workflow_id' => (int) ($a->get('current_approval_level_workflow_id') ?? 0) ?: null,
                        'status' => $status,
                        'user_name' => $userName,
                        'user' => $userName,
                        'comment' => $a->get('decision_comment') ?? '',
                        'description' => sprintf(
                            "%s %s Level %s (Instance %s) for Tender Inquiry",
                            $userName,
                            strtolower((string) $status) === 'rejected' ? 'rejected' : 'approved',
                            $approvalLevelId ?? 'N/A',
                            $instance
                        ),
                    ]),
                ]);
            },
            LogsMiddleware::createLogs('logData'),
            Generic::set("json", fn($a) => json_encode(["success" => true])),
        ],
    ],
    [
        "id" => "tender_inquiry_approvers",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<t_id>[0-9]+)\/tender_inquiry\/(?<ti_id>[0-9]+)\/approvers$",
        "method" => "POST",
        "description" => "Reminder for tender inquiry approval",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            TenderMiddleware::fetchPackage("uriArgs.t_id"),
            function($a){
                $data['entity_type'] = 'document';
                $data['entity_id'] = $a->get('uriArgs.ti_id');
                $assignedApprovers = Manager::getService("project")->fetch("approvals", $data)->getShape("data")->toArray();

                $requestData = $a->getRoute()->getRequest()->getData()->getShape('json')->get('data');
                $a->set('request_data', $requestData);

                // Resolve only the approver targeted by the payload's approver_id
                $selectedApprover = array_values(array_filter($assignedApprovers, function ($item) use ($a) {
                    return isset($item['id']) && (int) $item['id'] === (int) $a->get('request_data.approver_id');
                }));

                if (!$selectedApprover) {
                    throw new MiddlewareException("ApprovalNotFound", "No assigned approver found for the given approver_id");
                }

                $a->set("data", $assignedApprovers);
                $a->set("user_ids", [(int) $selectedApprover[0]['user_id']]);
            },
            UserMiddleware::loadUsersByIdArray('user_ids'),
            function($a){ // Email notifications
                $userId = implode($a->get('user_ids'));
                $emailLogs = Manager::getService('account')->fetch('email/logs-by-entity', [
                    'entity_type' => 'document',
                    'entity_id' => $a->get('uriArgs.ti_id'),
                    'user_ids' => $userId,
                ])->getShape('data')->toArray();
                if (count($emailLogs) > 0) {
                    $matchedLoggedUser = array_filter($emailLogs, function ($item) use ($userId) {
                        return isset($item['user_id']) && $item['user_id'] == $userId;
                    });
                    $matchedLoggedUser = $matchedLoggedUser[count($matchedLoggedUser) - 1];
                    $givenTime = new DateTime($matchedLoggedUser['sent_date']);
                    $now = new DateTime();

                    $diffInSeconds = $now->getTimestamp() - $givenTime->getTimestamp();

                    $matchTime = $diffInSeconds > 60;
                    if (!$matchTime) {
                        throw new MiddlewareException("TenderInquiryReminderStatusError", "You can only send one reminder per minute.");
                    }
                }
                $redirectUrl = sprintf("document-creator/template/%s/tender/%s", $a->get('uriArgs.ti_id'), $a->get('uriArgs.t_id'));
                $users = $a->get('users');
                $packageName = $a->get('package.label');
                $projectName = $a->get('project.name');
                foreach ($users as $user) {
                    $approval = array_values(array_filter($a->get('data'), function ($item) use ($user) {
                        return isset($item['user_id']) && $item['user_id'] == $user['id'];
                    }));
                    $firstDateTime = DocumentMiddleware::getUKDateTime($approval[0]['created_at'] ?? null);
                    $emailPayload = [
                        'approverName' => $user['display_name'],
                        'requesterName' => $a->get('user.display_name'),
                        'packageName' => $packageName,
                        'projectName' => $projectName,
                        'redirectUrl' => $redirectUrl,
                        'entityType' => 'document',
                        'entityId' => $a->get('uriArgs.ti_id'),
                        'email' => $user['email'],
                        'user_id' => $user['id'],
                        'firstDateTime' => sprintf("%s at %s UK Time", $firstDateTime['date'], $firstDateTime['time']),
                    ];
                    $a->set('payload', new Shape($emailPayload));

                    TenderInquiryMiddleware::sendTenderInquiryEmail(template: "ti_approval_reminder")($a);

                    $requesterEmailPayload = $emailPayload;
                    $requesterEmailPayload['email'] = $a->get('user.email');
                    $requesterEmailPayload['user_id'] = $a->get('user.id');
                    $a->set('requesterPayload', new Shape($requesterEmailPayload));

                    TenderInquiryMiddleware::sendTenderInquiryEmail(template: "ti_approval_reminder_requester", payloadKey: "requesterPayload")($a);
                }
            },
            function ($a) {
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.ti_id'),
                    'entity_type' => 'document',
                    'type'        => 'Reminder For Approval',
                    'meta'        => json_encode([
                        'message' => 'Approver(s) reminded to approve the tender inquiry',
                        'user'    => $a->get('user.display_name'),
                    ]),
                ]);
            },
            LogsMiddleware::createLogs('logData'),
            Generic::set("json", fn($a) => json_encode($a->get("data")))
        ]
    ],
    [
        "id" => "tender_inquiry_update",
        "key" => "^(?<project_id>[0-9]+)\/tender_inquiry\/(?<entity_id>[0-9]+)$",
        "method" => "PATCH",
        "description" => "Acknowledge rejected tender inquiry",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            function ($a) {
                $entityId = (int) $a->get('uriArgs.entity_id');
                $sessionUserId = (int) $a->get('user.id');
                $a->set('approval_workflow_entity', [
                    'entity_type' => 'document',
                    'entity_id' => $entityId,
                ]);

                ApprovalMiddleware::fetchInquiryApprovalsList('uriArgs.entity_id')($a);
                $approvals = $a->getCollection('approvals');
                $requesterId = (int) ($approvals->first()->get('requester_user_id') ?? 0);

                $isRejected = false;
                foreach ($approvals->getItemsAsArray() as $row) {
                    if (strtolower((string) ($row['status']['label'] ?? '')) === 'rejected') {
                        $isRejected = true;
                        break;
                    }
                }

                if (!$isRejected) {
                    ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity('approval_workflow_entity')($a);
                    $isRejected = $a->getCollection('approval_workflows')
                        ->filterByField('status', 'rejected')
                        ->count() > 0;
                }

               if (!$isRejected) {
                    throw new MiddlewareException(
                        "InvalidStatus",
                        "Only rejected tender inquiries can be acknowledged."
                    );
                }

                if ($requesterId <= 0 || $requesterId !== $sessionUserId) {
                    throw new MiddlewareException(
                        "tenderInquryOwnershipError",
                        "You are not authorised to acknowledge this rejection."
                    );
                }

                $docUpdate = Manager::getService('document')->update(
                    sprintf('document/%d', $entityId),
                    new Shape(['data' => ['status' => 1]])
                );
                if ((int) ($docUpdate->getShape('info')->get('http_code') ?? 0) >= 400) {
                    throw new MiddlewareException(
                        "badRequest",
                        "Failed to set tender inquiry status to Published."
                    );
                }

                ApprovalMiddleware::removeApprovalLevelWorkflowByEntity('approval_workflow_entity')($a);
                ApprovalMiddleware::removeApprovalsByEntity('approval_workflow_entity')($a);

                $instance = max(
                    1,
                    ApprovalSatisfactionHelper::getLatestSentForApprovalInstance(
                        'document',
                        $entityId,
                        ApprovalSatisfactionHelper::SENT_FOR_APPROVAL_LOG_TYPE,
                        true
                    )
                );

                $userName = $a->get('user.display_name')
                    ?: trim(($a->get('user.firstname') ?? '') . ' ' . ($a->get('user.lastname') ?? ''));
                $projectName = (string) ($a->get('project.name') ?? '');
                $a->set('logData', [
                    'user_id'     => $sessionUserId,
                    'entity_id'   => $entityId,
                    'entity_type' => 'document',
                    'type'        => 'Rejection Acknowledged',
                    'meta'        => json_encode([
                        'instance' => $instance,
                        'status' => 'Rejection Acknowledged',
                        'user_name' => $userName,
                        'description' => sprintf(
                            '%s acknowledged rejection for Tender Inquiry%s',
                            $userName,
                            $projectName !== '' ? ', ' . $projectName : ''
                        ),
                    ]),
                ]);
            },
            LogsMiddleware::createLogs('logData'),
            Generic::set("json", fn() => json_encode(["success" => true])),
        ]
    ],
    [
        "id" => "tender_inquiry_logs",
        "key" => "^(?<project_id>[0-9]+)\/tender_inquiry\/(?<id>[0-9]+)\/logs$",
        "method" => "GET",
        "description" => "Get all logs for a specific tender recommendation",
        "response_keys" => "logs",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            function($a) use ($convertToUKTime) {
                $data = [
                    "entity_type" => 'document',
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

                    $logs->map(function ($log) use ($userNamesById) {
                        $logUserId = $log->int('user_id');
                        $user_name = $userNamesById[$logUserId];
                        $log->set('user_name', $user_name ?? '');
                        return $log;
                    });
                }

                $logsArray = $logs->getItemsAsArray();

                $formatRuleLabel = static function (string $ruleType, array $level = []): string {
                    $roles = is_array($level['roles'] ?? null) ? $level['roles'] : [];
                    $entries = is_array($level['entries'] ?? null) ? $level['entries'] : [];

                    return ApprovalSatisfactionHelper::formatRuleLabel([
                        'rule_type'    => $ruleType,
                        'min_required' => (int) ($level['min_required'] ?? 1),
                        'roles'        => count($roles) > 0 ? $roles : $entries,
                    ]);
                };

                $formatFlatLog = static function (array $log) use ($convertToUKTime): array {
                    $meta = $log['meta_decoded'] ?? [];

                    return [
                        'type'      => str_replace(' ', '_', strtolower($log['type'])),
                        'label'     => $log['type'],
                        'user'      => $meta['user'] ?? $meta['user_name'] ?? '',
                        'timestamp' => $convertToUKTime($log['created_at']),
                        'comment'   => $meta['message'] ?? $meta['description'] ?? '',
                    ];
                };

                $buildLogs = function (array $logs) use (
                    $formatRuleLabel,
                    $formatFlatLog,
                    $convertToUKTime
                ): array {
                    $output = [];
                    $instances = [];

                    foreach ($logs as $log) {
                        $decodedMeta = json_decode($log['meta'], true);
                        $log['meta_decoded'] = is_array($decodedMeta) ? $decodedMeta : [];

                        $instance = $log['meta_decoded']['instance']
                            ?? $log['meta_decoded']['approver_assign']['instance']
                            ?? $log['meta_decoded']['approvalassign']['instance']
                            ?? $log['meta_decoded']['approval_info']['instance']
                            ?? null;

                        if ($instance === null) {
                            $output[] = $formatFlatLog($log);
                            continue;
                        }

                        $instances[$instance][] = $log;
                    }

                    ksort($instances);

                    foreach ($instances as $instance => $instanceLogs) {
                        $sentLog = null;
                        $verdicts = [];
                        $otherLogEntries = [];

                        foreach ($instanceLogs as $log) {
                            $type = $log['type'] ?? '';

                            if ($type === 'Sent For Approval') {
                                $sentLog = $log;
                                continue;
                            }

                            if ($type === 'Approved' || $type === 'Rejected') {
                                $verdictMeta = $log['meta_decoded'];
                                if (($verdictMeta['instance'] ?? null) === $instance) {
                                    $levelId = $verdictMeta['approval_level_id'] ?? null;
                                    $verdicts[$levelId][$log['user_id']] = [
                                        'type'      => strtolower($log['type']),
                                        'label'     => ApprovalSatisfactionHelper::resolveApprovalLogLabelFromMeta(
                                            $verdictMeta,
                                            $log['type']
                                        ),
                                        'user'      => $verdictMeta['user'] ?? $verdictMeta['user_name'] ?? '',
                                        'timestamp' => $convertToUKTime($log['created_at']),
                                        'comment'   => $verdictMeta['comment'] ?? '',
                                    ];
                                }
                                continue;
                            }

                            $otherLogEntries[] = $formatFlatLog($log);
                        }

                        if (!$sentLog) {
                            continue;
                        }

                        $approvalAssign = $sentLog['meta_decoded']['approver_assign']
                            ?? $sentLog['meta_decoded']['approvalassign']
                            ?? null;
                        if (!$approvalAssign) {
                            continue;
                        }
                        $levels = [];

                        foreach ($approvalAssign['levels'] as $level) {
                            $levelId = $level['approval_level_id'];

                            foreach ($level['entries'] as &$entry) {
                                $entry['timestamp'] = $convertToUKTime($entry['timestamp']);
                                $uid = $entry['user_id'] ?? null;
                                $match = $verdicts[$levelId][$uid] ?? $verdicts[null][$uid] ?? null;
                                if ($uid && $match) {
                                    $entry = $match;
                                }
                                $entry = ApprovalSatisfactionHelper::finalizeLogEntryForGet($entry);
                            }
                            unset($entry);

                            $level['rule'] = $formatRuleLabel($level['rule'], $level);
                            $level['entries'] = array_values($level['entries']);
                            $levels[] = $level;
                        }

                        $levels = ApprovalSatisfactionHelper::finalizeLogLevelsForGet($levels);

                        $output[] = [
                            'type'      => $approvalAssign['type'],
                            'heading'   => $approvalAssign['heading'],
                            'label'     => $approvalAssign['label'],
                            'user'      => $approvalAssign['user'],
                            'timestamp' => $convertToUKTime($approvalAssign['timestamp']),
                            'levels'    => $levels,
                        ];

                        foreach ($otherLogEntries as $otherEntry) {
                            $output[] = $otherEntry;
                        }
                    }

                    return $output;
                };

                $a->set("logs_payload", [
                    "entity_no"    => "ti-" . (int) $a->get('uriArgs.id'),
                    "project_name" => $a->get('project.name'),
                    "logs"         => $buildLogs($logsArray),
                ]);
            },

            Generic::set("json", fn($a) => json_encode($a->get("logs_payload"))),
        ],
    ],
    [
        "id" => "tender_inquiry_assigned_approvers",
        "key" => "^(?<project_id>[0-9]+)\/tender_inquiry\/assigned-approvers$",
        "method" => "GET",
        "description" => "Get assigned approvers for tender inquiries on a project (optional ?ti_id=)",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            function ($a) use ($convertToUKTime) {
                $tiId = (int) ($a->get('request_args.ti_id', false) ?: 0);

                if ($tiId > 0) {
                    $entityIds = [$tiId];
                } else {
                    $categories = Manager::getService('document')
                        ->fetch('category', [
                            'entity_type' => 'tender_template',
                            'parent_id' => (int) $a->get('uriArgs.project_id'),
                        ])
                        ->getShape('data')
                        ->toArray();

                    if (!is_array($categories)) {
                        $categories = [];
                    } elseif (isset($categories['id'])) {
                        $categories = [$categories];
                    }

                    $entityIds = [];
                    foreach ($categories as $category) {
                        foreach ($category['documents'] ?? [] as $doc) {
                            if (($doc['name'] ?? '') === 'Invitation to Tender' && !empty($doc['id'])) {
                                $entityIds[] = (int) $doc['id'];
                            }
                        }
                    }
                    $entityIds = array_unique($entityIds);
                }

                $perEntity = [];
                $userIds = [];
                foreach ($entityIds as $entityId) {
                    $a->set('approval_workflow_entity', [
                        'entity_type' => 'document',
                        'entity_id' => $entityId,
                    ]);
                    ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity('approval_workflow_entity')($a);
                    ApprovalMiddleware::fetchApprovalsList('approval_workflow_entity')($a);

                    $approvals = $a->getCollection('approvals')->getItemsAsArray();
                    if (!$approvals) {
                        continue;
                    }

                    $workflows = $a->getCollection('approval_workflows')->getItemsAsArray();
                    $workflowMetaById = array_column($workflows, 'meta', 'id');
                    foreach ($approvals as &$approval) {
                        $approval['meta'] = ApprovalSatisfactionHelper::resolveResponseFlags(
                            $approval['meta'] ?? null,
                            $workflowMetaById[(int) ($approval['approval_level_workflow_id'] ?? 0)] ?? null
                        );
                    }
                    unset($approval);

                    $perEntity[$entityId] = [
                        'workflows' => $workflows,
                        'approvals' => $approvals,
                    ];
                    $userIds = array_merge($userIds, array_column($approvals, 'user_id'));
                }

                $result = [];
                if ($perEntity) {
                    $users = Manager::getService('account')
                        ->fetch('user/[' . implode(',', array_unique(array_filter($userIds))) . ']/account-roles')
                        ->getCollection('data')
                        ->getItemsAsArray();

                    foreach ($perEntity as $entityId => $bundle) {
                        $result += ApprovalSatisfactionHelper::buildAssignedApproversByEntity(
                            (int) $entityId,
                            $bundle['workflows'],
                            $bundle['approvals'],
                            $users,
                            $convertToUKTime
                        );
                    }
                }

                $a->set('data', $result ?: (object) []);
            },
            Generic::set("json", fn ($a) => json_encode($a->get('data'))),
        ],
    ],
];
