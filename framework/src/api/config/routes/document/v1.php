<?php

use Core\Config;
use Core\Middleware\Generic;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Procedure;
use Core\Middleware\Rest;
use Api\Middleware\ApiSession;
use Api\Middleware\ApprovalMiddleware;
use Api\Middleware\ApprovalSatisfactionHelper;
use Core\Service\Manager;

use Api\Middleware\DocumentMiddleware;
use Api\Middleware\MilestoneMiddleware;
use Api\Middleware\LogsMiddleware;
use Api\Middleware\NotificationMiddleware;
use Api\Middleware\OrderMiddleware;
use Api\Middleware\ProjectMiddleware;
use Api\Middleware\TenderMiddleware;
use App\Domain\Account\Manage;
use Core\Data\Collection;
use Core\Data\Shape;
use Core\Middleware\Conditional;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\SqsService;
use Dom\Document;
use Prosper\Middleware\EmailMiddleware;
use Prosper\Middleware\SqsMiddleware;
use Api\Model\Document\Provider\Provider;

//Load in any preset Procedures to reuse
include_once("procedures.php");

$session_handler = Config::get("session.handler", ApiSession::class);
$emailQueue = Config::get("services.aws.sqs.queues.document_creator");
$approvalEmailQueue = Config::get("services.aws.sqs.queues.approval_email");

return [
    "type" => "http",
    "onError" => [
        "invalidToken"   => $session_handler::invalidApiToken(),
        "documentOwnershipError" => Generic::exceptionResponse("HTTP/1.0 403"),
        "noDocumentFound"    => Generic::exceptionResponse("HTTP/1.0 404"),
        "documentSignersError"    => Generic::exceptionResponse("HTTP/1.0 400"),
        "UnAuthorizedApprover"    => Generic::exceptionResponse("HTTP/1.0 401", "You are not allowed to assign approvers."),
        "OrderNotCreated"    => Generic::exceptionResponse("HTTP/1.0 400", "Order has not been created yet. Please create the order before assigning approvers."),
        "serviceError"     => Generic::exceptionResponse("HTTP/1.0 500"),
        "forbidden" => Generic::exceptionResponse("HTTP/1.0 403"),
        "badRequest" => Generic::exceptionResponse("HTTP/1.0 400"),
    ],
    "middleware" => [
        function ($action) use ($session_handler) {
            //browser will send before a OPTIONS request, without the authorisation token, and then will send the real request
            if ($action->getRoute()->getRequest()->get("method") !== "OPTIONS") {
                $session_handler::validate()($action);
            }
        },
    ],
    "default_action" => [
        "middleware" => [
            function ($a) {
                //ToDo: Add some more context and info
                $a->set("message", "No Api Route Found");
            },
            Generic::set("json",  function ($a) {
                $a->set("headers", ["HTTP/1.0 404 No Api Route Found" => ""]);
                return json_encode(['message' => $a->get("message", ""), "code" => 404]);
            })
        ]
    ],
    "actions" => [
        [
            "id" => "document-download",
            "key" => "download\/(?<did>[0-9]{1,7})$",
            "method" => "GET",
            "middleware" => [
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                DocumentMiddleware::downloadDocument(),
                function($action) {
                    $outputPath = $action->get('output');
                    $status     = ($outputPath && file_exists($outputPath)) ? 'downloaded' : 'not_downloaded';
                    header('X-Download-Status: ' . $status);
                    header('Access-Control-Expose-Headers: X-Download-Status');
                },
                DocumentMiddleware::outputDocument(),
            ]
        ],
        [
            "id" => "assign-order-approvers",
            "key" => "(?<did>[0-9]{1,7})\/order\/approvers$",
            "method" => "POST",
            "middleware" => [
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                DocumentMiddleware::fetchDocument('id', 'uriArgs.did'),
                function ($a) {
                    $meta = json_decode($a->get("document")->first()->get('meta'), true);
                    $a->set('meta', $meta);
                    $order = Manager::getService("project")->fetch(sprintf("transaction/%s", $meta['quote']['id']))->getShape('data')->get();
                    $a->set('quote', array_shift($order));
                },
                Conditional::isset('quote', [
                    DocumentMiddleware::fetchDocumentSigners(),
                    function($a) {
                        $meta = $a->get('meta');
                        $signers = $a->get('document_signers');
                        if (count($signers) > 0) {
                            $a->set('signer', array_shift($signers));
                        }
                        $pid = $meta['quote']['tender']['project_id'];
                        $tid = $meta['quote']['tender']['id'];
                        $a->set("pid", $pid);
                        $a->set("tid", $tid);
                    },
                    ProjectMiddleware::fetchProject('id', 'pid'),
                    TenderMiddleware::fetchTenderHistoryType('uid', 'pending_approval', 'pendingApproval'),
                    TenderMiddleware::fetchTenderHistory('pid', 'tid', true),
                    DocumentMiddleware::fetchSignatoryStatuses(true),
                    OrderMiddleware::getStatus('quote', 'document_signers', 'document_signatory_statuses'),
                    OrderMiddleware::fetchOrderApproverType("label", "Pending", "pending"),
                    function ($a) {
                        $tenderHistory = $a->get('tender_history');
                        $lastHistory = null;
                        if (!empty($tenderHistory)) {
                            $tenderHistory = array_shift($tenderHistory);
                            $history = $tenderHistory["history"];
                            $lastHistory = array_shift($history);
                            $a->set('last_tender_history', $lastHistory);
                        }
                        $status = $a->get('status');
                        if ($status !== 'Withdrew' && $lastHistory && $lastHistory["tender_history_type"] === 'Order') {
                            $status = Manager::getService("project")->fetch("tender/history/type")->getCollection('data')->filterByField("id", $lastHistory["status_id"])->first()->get('label');
                        }
                        if (!in_array($status, ['Draft', 'Withdrew'])) {
                            throw new MiddlewareException("forbidden", "You are not allowed to assign approvers at the current order status.");
                        }
                        $a->set('status', $status);
                        $data = $a->getRoute()->getRequest()->getData();
                        $requestData = $data->getShape('json')->get();
                        $varianceExplanation = trim((string) ($requestData['variance_explanation'] ?? '')) ?: null;
                        if (isset($requestData['approvers'])) {
                            $requestData = $requestData['approvers'];
                        }
                        $meta = $a->get('meta');
                        $quote = $a->get('quote');
                        $orderValue = (int) ($meta['values']['order_value'] ?? 0);
                        $trAmount = (int) ($quote['forecast'] ?? 0);
                        if (
                            !empty($meta['has_tender_recommendation'])
                            && $orderValue && $trAmount && $orderValue !== $trAmount
                            && !$varianceExplanation
                        ) {
                            throw new MiddlewareException(
                                "varianceExplanationRequired",
                                "The order value differs from the tender recommendation. Please explain the reason for this variance."
                            );
                        }
                        $a->set("requestData", $requestData);
                        $a->set("variance_explanation", $varianceExplanation);
                        $a->set("did", $a->get('quote')['id']);
                        $a->set("requester_user_id", $a->get('user.id'));
                        $orderApproverPendingType = $a->get('order_approver_type_pending');
                        $a->set("order_approver_pending_type_id", $orderApproverPendingType->get('id'));
                        $newTenderHistory = [
                            "author_id" => $a->get('user.account_id'),
                            "specialist_id" => $a->get('quote')['subcontractor_id'],
                            "status_id" => $a->get('tender_history_type_pendingApproval')->get('id'),
                            "tender_history_type" => "Order",
                            "meta" => []
                        ];
                        $a->set("th_post_data", $newTenderHistory);
                        $a->set("approval_type", 'order');

                        $approvalLevelIds = array_unique(array_column($requestData, 'approval_level_id'));

                        $configurations = Manager::getService("project")->fetch(sprintf("approval-workflow-configurations/%d/type/order", $a->get('user.account_id')))->getShape('data')->get();
                        $approvalLevels = ApprovalMiddleware::mapApprovalLevelsById(
                            is_array($configurations) ? $configurations : [],
                            array_map('intval', $approvalLevelIds)
                        );
                        $meta = $a->get('meta');
                        $orderValue = isset($meta['values']['order_value'])
                            ? (int) $meta['values']['order_value']
                            : null;
                        $approvalLevels = ApprovalMiddleware::mergeThresholdRoles(
                            $approvalLevels,
                            'order',
                            (int) $a->get('user.account_id'),
                            $orderValue
                        );
                        $a->set("approval_levels", $approvalLevels);
                        $sortedApprovalLevelIds = array_values($approvalLevelIds);
                        usort(
                            $sortedApprovalLevelIds,
                            static fn ($a, $b) => ($approvalLevels[$a]['sort_order'] ?? 0) <=> ($approvalLevels[$b]['sort_order'] ?? 0)
                        );
                        $approvalWorkflowPayload = [];
                        $inProgressAssigned = false;
                        $allLevelsCompleted = $sortedApprovalLevelIds !== [];
                        foreach ($sortedApprovalLevelIds as $id) {
                            $levelRows = array_filter(
                                $requestData,
                                static fn ($row) => (int) ($row['approval_level_id'] ?? 0) === (int) $id
                            );
                            $isLevelSatisfied = ApprovalSatisfactionHelper::isLevelSatisfiedFromRows($levelRows);
                            $status = ApprovalSatisfactionHelper::resolveWorkflowStatus($isLevelSatisfied, $inProgressAssigned);
                            if ($status !== 'completed') {
                                $allLevelsCompleted = false;
                            }
                            $levelMeta = is_array($approvalLevels[$id] ?? null) ? $approvalLevels[$id] : [];
                            $approvalWorkflowPayload[] = [
                                'approval_level_id' => $id,
                                'entity_type' => 'document',
                                'entity_id' => $a->get('uriArgs.did'),
                                'status' => $status,
                                'sort_order' => $approvalLevels[$id]['sort_order'] ?? 0,
                                'meta' => json_encode(array_merge(
                                    $levelMeta,
                                    ApprovalSatisfactionHelper::buildLevelMetaFlagsFromRows($levelRows),
                                    ['consolidate_notifications' => !empty($configurations['consolidate_notifications'])]
                                )),
                            ];
                        }
                        $a->set("approval_workflow_entity", [
                            'entity_type' => 'document',
                            'entity_id' => $a->get('uriArgs.did'),
                        ]);
                        $a->set("approval_workflow_payload", $approvalWorkflowPayload);
                        $a->set('assign_approval_complete', $allLevelsCompleted);

                    },
                    Conditional::switched('status', [
                        TenderMiddleware::createTenderHistory(),
                        ApprovalMiddleware::saveApprovalLevelWorkflow('approval_workflow_payload'),
                        OrderMiddleware::assignApproversRequest(),
                    ], [
                        Conditional::switched('status', [
                            TenderMiddleware::createTenderHistory(),
                            OrderMiddleware::removeOrderApproversByTransaction(),
                            ApprovalMiddleware::removeApprovalLevelWorkflowByEntity('approval_workflow_entity'),
                            ApprovalMiddleware::saveApprovalLevelWorkflow('approval_workflow_payload'),
                            OrderMiddleware::assignApproversRequest()
                        ], [
                            function ($a) {
                                throw new MiddlewareException("UnAuthorizedApprover");
                            }
                        ], 'Withdrew'),
                    ], 'Draft'),
                    function ($a) {
                        $meta           = $a->get('meta') ?? [];
                        $requestData    = $a->get('requestData') ?? [];
                        $approvalLevels = $a->get("approval_levels") ?? [];
                        $groupedApprovers = [];

                        foreach ($requestData as $data) {
                            if (!isset($data['approval_level_id'], $data['user_id'])) {
                                continue;
                            }

                            $groupedApprovers[(int) $data['approval_level_id']][] = $data;
                        }

                        $sortedApprovalLevelIds = array_values(array_unique(array_column($requestData, 'approval_level_id')));
                        usort(
                            $sortedApprovalLevelIds,
                            static fn ($aId, $bId) => ($approvalLevels[$aId]['sort_order'] ?? 0) <=> ($approvalLevels[$bId]['sort_order'] ?? 0)
                        );

                        $approvalWorkflowPayload = [];
                        $log_data = ['levels' => []];
                        $inProgressAssigned = false;
                        $c = 0;
                        foreach ($sortedApprovalLevelIds as $id) {
                            $level = $approvalLevels[$id] ?? null;

                            if (!$level || !isset($level['id'])) {
                                continue;
                            }

                            $sortOrder = $level['sort_order'] ?? 0;
                            $ruleType  = $level['rule_type'] ?? 'all';
                            $levelRows = $groupedApprovers[$id] ?? [];
                            $isLevelSatisfied = ApprovalSatisfactionHelper::isLevelSatisfiedFromRows($levelRows);
                            $workflowStatus = ApprovalSatisfactionHelper::resolveWorkflowStatus($isLevelSatisfied, $inProgressAssigned);
                            $approvalWorkflowPayload[] = [
                                'approval_level_id' => $id,
                                'entity_type'       => 'document',
                                'entity_id'         => $a->get('uriArgs.did'),
                                'status'            => $workflowStatus,
                                'sort_order'        => $sortOrder,
                                'meta'              => json_encode(array_merge(
                                    is_array($level) ? $level : [],
                                    ApprovalSatisfactionHelper::buildLevelMetaFlagsFromRows($levelRows)
                                )),
                            ];

                            $log_data['levels'][$c] = array_merge(
                                [
                                    'approval_level_id' => $id,
                                    'level'             => $sortOrder,
                                    'status'            => $workflowStatus,
                                    'entries'           => [],
                                ],
                                ApprovalSatisfactionHelper::levelLogFlags(
                                    ApprovalSatisfactionHelper::buildLevelMetaFlagsFromRows($levelRows)
                                )
                            );

                            switch ($ruleType) {
                                case 'any':
                                    $log_data['levels'][$c]['rule'] = "Anyone can approve";
                                    break;

                                case 'custom':
                                    $minRequired = (int) ($level['min_required'] ?? 0);
                                    $rolesCount  = !empty($level['roles']) ? count($level['roles']) : 0;

                                    $log_data['levels'][$c]['rule'] =
                                        "Any {$minRequired} from {$rolesCount} must approve";
                                    break;

                                case 'all':
                                default:
                                    $log_data['levels'][$c]['rule'] = "All must approve";
                                    break;
                            }

                            foreach ($levelRows as $approverRow) {
                                $userId = (int) ($approverRow['user_id'] ?? 0);
                                if ($userId <= 0) {
                                    continue;
                                }

                                $approver = Manager::getService("account")
                                    ->fetch("user/search", [
                                        'field' => 'id',
                                        'value' => $userId
                                    ])
                                    ->getShape('data')
                                    ->get();

                                $date = (new DateTime("now", new DateTimeZone('UTC')))
                                    ->setTimezone(new DateTimeZone('Europe/London'))
                                    ->format("Y-m-d H:i:s");

                                $log_data['levels'][$c]['entries'][] = array_merge(
                                    [
                                        "type"      => ApprovalSatisfactionHelper::approverEntryType($approverRow),
                                        "user_id"   => $userId,
                                        "user"      => $approver['display_name'] ?: $approver['firstname'] . ' ' . $approver['lastname'],
                                        "timestamp" => $date,
                                        "comment"   => ""
                                    ],
                                    ApprovalSatisfactionHelper::approverLogFlags($approverRow)
                                );
                            }

                            $c++;
                        }


                        $a->set("approval_workflow_payload", $approvalWorkflowPayload);
                        $existingLogs = Manager::getService("project")
                            ->fetch(sprintf(
                                "order_approver/transaction/%s/log",
                                $meta['quote']['id'] ?? null
                            ))
                            ->getShape('data')
                            ->get();

                        $existingLogs = is_array($existingLogs) ? $existingLogs : [];
                        $approvalLogs = array_filter($existingLogs,
                        function ($log) {
                            return isset($log['type']) && $log['type'] === 'Sent For Approval';
                        });

                        $instance = count($approvalLogs) + 1;
                        $approvalAssign = [
                            "type"           => "approval_request",
                            "instance"       => $instance,
                            "heading"        => "Approval Request #{$instance}",
                            "label"          => "Sent For Approval",
                            "status"         => "pending",
                            "user_id"        => $a->get('user.id'),
                            "user"           => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                            "timestamp"      => date("Y-m-d H:i:s"),
                            "transaction_id" => $meta['quote']['id'] ?? null,
                            "project_name"   => $a->get('project')->get('name') ?? null,
                            "package_name"   => $meta['quote']['tender']['label'] ?? null,
                            "levels"         => $log_data['levels'] ?? [],
                            "variance_explanation" => $a->get('variance_explanation'),
                        ];

                        $finalMeta = [
                            "approver_assign" => $approvalAssign
                        ];

                        $logData = [
                            'user_id'        => $a->get('user.id'),
                            'transaction_id' => $meta['quote']['id'] ?? null,
                            'meta'           => json_encode($finalMeta),
                            'type'           => 'Sent For Approval'
                        ];

                        $a->set('logData', $logData);
                        OrderMiddleware::createOrderLog('logData')($a);
                    },
                    OrderMiddleware::syncOrderPrice(clearWithdrawnStatus: true),
                    function($a) use ($approvalEmailQueue) {
                        $requestData = $a->get('requestData');
                        $approvalLevels = $a->get('approval_levels');
                        $meta = $a->get('meta');
                        $projectData = $a->get('project');
                        AccountMiddleware::loadTokenTypes("auto_loader")($a);
                        $values = array_values($approvalLevels);

                        usort($values, function ($a, $b) {
                            return $a['sort_order'] <=> $b['sort_order'];
                        });

                        $targetLevelId = $values[0]['id'] ?? 0;
                        foreach ($a->get('approval_workflow_payload') ?? [] as $workflowRow) {
                            if (($workflowRow['status'] ?? '') === 'in_progress') {
                                $targetLevelId = $workflowRow['approval_level_id'] ?? $targetLevelId;
                                break;
                            }
                        }

                        $emailData = [];
                        $dateTime = DocumentMiddleware::getUKDateTime();
                        foreach ($requestData as $data) {
                            if ((int) ($data['approval_level_id'] ?? 0) !== (int) $targetLevelId
                                || !ApprovalSatisfactionHelper::shouldNotifyApprover($data)) {
                                continue;
                            }
                            $approver = Manager::getService("account")->fetch("user/search", ['field' => 'id', 'value' => $data['user_id']])->getShape('data')->get();

                            $redirectUrl = sprintf("document-creator/template/%s/order/%s", $a->get('uriArgs.did'), $meta['quote']['tender_id']);
                            $emailData[] = [
                                'sender'    => ['id' => $a->get('user.id')],
                                'email' => $approver['email'],
                                'template' => 'Assign Order Approver',
                                'user_id' => $approver['id'],
                                'body' => [
                                    'approverName'  => $approver['display_name'] ?: $approver['firstname'] . ' ' . $approver['lastname'],
                                    'requestedBy'   => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                                    'orderValue'    => '£' . number_format(((int)$meta['values']['order_value'])/100, 2),
                                    'projectName'   => $projectData->get('name'),
                                    'packageName'   => $meta['quote']['tender']['label'],
                                    'dateTime'      => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                    'url'            => $redirectUrl,
                                    'plain_redirect' => true,
                                ]
                            ];

                            // Notify this approver an order needs their approval — additive to the queued email above.
                            $requesterName = $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                            $a->set('notification_payload', [
                                'account_id' => (int) ($approver['account_id'] ?? $a->get('user.account_id')),
                                'receiver_user_id' => (int) $approver['id'],
                                'project_id' => $projectData->get('id'),
                                'type' => 'approval_required',
                                'title' => 'Order requires your approval',
                                'message' => NotificationMiddleware::buildContextLine([
                                    ['label' => 'Project', 'value' => $projectData->get('name')],
                                    ['label' => 'Package Name', 'value' => $meta['quote']['tender']['label'] ?? null],
                                    ['label' => 'By', 'value' => $requesterName],
                                    ['label' => 'Reference', 'value' => $meta['quote']['order_number'] ?? null],
                                ]),
                                'target_type' => 'order',
                                'target_id' => (int) $a->get('uriArgs.did'),
                                'target_url' => $redirectUrl,
                            ]);
                            NotificationMiddleware::createSilently()($a);
                        }

                        if ($emailData) {
                            $a->set('queueData', [[
                                'type' => 'order',
                                'uid' => $a->get('user.id'),
                                'email_data' => $emailData,
                                'time' => time()
                            ]]);
                            SqsMiddleware::writeAll("queueData", $approvalEmailQueue)($a);
                        }
                    },
                    function ($a) use ($emailQueue) {
                        if (!$a->get('assign_approval_complete')) {
                            return;
                        }

                        $meta = $a->get('meta');
                        $inQueueType = Manager::getService("project")
                            ->fetch("tender/history/type")
                            ->getCollection('data')
                            ->filterByField('uid', 'in_queue')
                            ->first();
                        $a->set("th_post_data", [
                            "author_id" => $a->get('user.account_id'),
                            "specialist_id" => $meta['quote']['subcontractor']['id'] ?? null,
                            "status_id" => $inQueueType->get('id'),
                            "tender_history_type" => "Order",
                            "meta" => []
                        ]);
                        TenderMiddleware::createTenderHistory()($a);

                        $requesterId = (int) $a->get('requester_user_id');
                        $requesterData = Manager::getService("account")
                            ->fetch("user/search", ['field' => 'id', 'value' => $requesterId])
                            ->getShape('data')
                            ->get();
                        $requesterName = $requesterData['display_name']
                            ?: $requesterData['firstname'] . ' ' . $requesterData['lastname'];
                        $dateTime = DocumentMiddleware::getUKDateTime();

                        EmailMiddleware::send('Approve Order', [
                            "sender" => ['id' => $requesterData['id']],
                            'extra' => [
                                'approverName' => $requesterName,
                                'requesterName' => $requesterName,
                                'orderValue' => '£' . number_format(((int) ($meta['values']['order_value'] ?? 0)) / 100, 2),
                                'projectName' => $a->get('project.name'),
                                'packageName' => $meta['quote']['tender']['label'] ?? null,
                                'dateTime' => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                'subcontractorCompany' => $meta['quote']['subcontractor']['name'] ?? null,
                                'orderLink' => sprintf("%s/main-contractor/project/%s/orders", Config::get('clink.site_url'), $a->get('project.slug')),
                            ]
                        ])($a);

                        $a->set('queueData', [[
                            'did' => $a->get('uriArgs.did'),
                            'qid' => $meta['quote']['id'] ?? null,
                            'sids' => $meta['quote']['subcontractor']['id'] ?? null,
                            'aid' => $a->get('user.account_id'),
                            'uid' => $requesterId,
                            'signing_mechanism' => null,
                            'time' => time()
                        ]]);
                        SqsMiddleware::writeAll("queueData", $emailQueue)($a);

                        MilestoneMiddleware::milestoneComplete('tid', 'Order Approval')($a);
                    },
                ],
                [
                    function ($a) {
                        throw new MiddlewareException("OrderNotCreated");
                    }
                ]),
                Generic::set("json", function ($a) {
                    return json_encode([
                        'status' => true,
                    ]);
                })
            ]
        ],
        [
            "id" => "order-approval-process",
            "key" => "(?<did>[0-9]{1,7})\/order\/approval$",
            "method" => "POST",
            "middleware" => [
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                DocumentMiddleware::fetchDocument('id', 'uriArgs.did'),
                function ($a) {
                    $a->set('is_level_complete', false);
                    $a->set('is_approval_complete', false);
                    $data = $a->getRoute()->getRequest()->getData();
                    $requestData = $data->getShape('json')->get();
                    $a->set('request_data', $requestData);
                    $meta = json_decode($a->get("document")->first()->get('meta'), true);
                    $a->set('meta', $meta);
                    $a->set('quote', $meta['quote']);
                    $pid = $meta['quote']['tender']['project_id'];
                    $tid = $meta['quote']['tender']['id'];
                    $a->set("pid", $pid);
                    $a->set("tid", $tid);
                    $a->set("order_value", '£' . number_format(((int)$meta['values']['order_value'])/100, 2));
                },
                OrderMiddleware::fetchOrderApprovalByTransaction('quote.id'),
                ProjectMiddleware::fetchProject('id', 'pid'),
                OrderMiddleware::fetchOrderApproval('id', 'request_data.approver_id'),
                Procedure::get("verifyApproverWithLevel"),
                Conditional::switched('request_data.status', [
                    // Approved handling
                    Conditional::isTrue('isApprovalLevel', [
                        function ($a) use ($approvalEmailQueue) {
                            $approvalWorkflow = $a->getCollection('approval_level_workflow_by_entity');
                            $approvalWorkflowCurrent = $approvalWorkflow->filterByField('status', 'in_progress')->first();

                            $currWorkflowMeta = json_decode($approvalWorkflowCurrent->get('meta'), true);
                            $approvalWorkflowPending = $approvalWorkflow->filterByField('status', 'pending');
                            $approvals = $a->get('order_approval_transaction');
                            $currUserId = (int) $a->get('user.id');
                            $currLevelApprovals = $approvals->filterByField('approval_level_workflow_id', $approvalWorkflowCurrent->get('id'));
                            $levelComplete = ApprovalSatisfactionHelper::isLevelCompleteAfterUserApprove(
                                $currWorkflowMeta,
                                $currLevelApprovals->getItemsAsArray(),
                                $currUserId,
                                'approver_user_id'
                            );
                            $a->set('is_level_complete', $levelComplete);

                            if ($levelComplete) {
                                Manager::getService("project")->update(
                                    sprintf("approval-workflow-process/workflow/%s", $approvalWorkflowCurrent->get('id')),
                                    new Shape(['data' => ['status' => 'completed']])
                                );
                            }

                            $pendingWorkflowRows = $approvalWorkflowPending->getItemsAsArray();
                            $cascadePlan = ApprovalSatisfactionHelper::planCrossLevelCascadesIfEnabled(
                                $currWorkflowMeta,
                                $pendingWorkflowRows,
                                $approvals->getItemsAsArray(),
                                $currUserId,
                                'approver_user_id'
                            );
                            $remainingPending = ApprovalMiddleware::applyCrossLevelCascadePlan(
                                $cascadePlan,
                                'order_approver'
                            );

                            if ($levelComplete && $remainingPending === []) {
                                $a->set('is_approval_complete', true);
                            } elseif ($levelComplete) {
                                usort(
                                    $remainingPending,
                                    static fn ($a, $b) => (int) ($a['sort_order'] ?? 0) <=> (int) ($b['sort_order'] ?? 0)
                                );
                                $nextWorkflow = $remainingPending[0];
                                $nextLevelApprovers = $approvals
                                    ->filterByField('approval_level_workflow_id', $nextWorkflow['id'])
                                    ->getItemsAsArray();
                                Manager::getService("project")->update(
                                    sprintf("approval-workflow-process/workflow/%s", $nextWorkflow['id']),
                                    new Shape(['data' => ['status' => 'in_progress']])
                                );

                                // Send notification to the assigned approvers
                                $emailData = [];
                                $requesterUser = null;
                                $meta = $a->get('meta');
                                $projectData = $a->get('project');

                                $dateTime = DocumentMiddleware::getUKDateTime();
                                $cascadeActions = $cascadePlan['actions'] ?? [];

                                foreach ($nextLevelApprovers as $data) {
                                    if (!ApprovalSatisfactionHelper::shouldNotifyApprover($data, $cascadeActions)) {
                                        continue;
                                    }
                                    $approver = Manager::getService("account")->fetch("user/search", ['field' => 'id', 'value' => $data['approver_user_id']])->getShape('data')->get();
                                    if ($requesterUser === null) {
                                        $requesterUser = Manager::getService("account")->fetch("user/search", ['field' => 'id', 'value' => $data['requester_user_id']])->getShape('data')->get();
                                    }
                                    $redirectUrl = sprintf("document-creator/template/%s/order/%s", $a->get('uriArgs.did'), $meta['quote']['tender_id']);
                                    $emailData[] = [
                                        'sender'    => ['id' => $requesterUser['id']],
                                        'email' => $approver['email'],
                                        'template' => 'Assign Order Approver',
                                        'user_id' => $approver['id'],
                                        'body' => [
                                            'approverName'  => $approver['display_name'] ?: $approver['firstname'] . ' ' . $approver['lastname'],
                                            'requestedBy'   => $requesterUser['display_name'] ?: $requesterUser['firstname'] . ' ' . $requesterUser['lastname'],
                                            'orderValue'    => '£' . number_format(((int)$meta['values']['order_value'])/100, 2),
                                            'projectName'   => $projectData->get('name'),
                                            'packageName'   => $meta['quote']['tender']['label'],
                                            'dateTime'      => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                            'url'            => $redirectUrl,
                                            'plain_redirect' => true,
                                        ]
                                    ];

                                    // Notify this next-level approver an order needs their approval — additive to the queued email above.
                                    $a->set('notification_payload', [
                                        'account_id' => (int) ($approver['account_id'] ?? 0),
                                        'receiver_user_id' => (int) $approver['id'],
                                        'project_id' => $projectData->get('id'),
                                        'type' => 'approval_required',
                                        'title' => 'Order requires your approval',
                                        'message' => NotificationMiddleware::buildContextLine([
                                            ['label' => 'Project', 'value' => $projectData->get('name')],
                                            ['label' => 'Request Type', 'value' => $meta['quote']['tender']['label'] ?? null],
                                            ['label' => 'By', 'value' => $requesterUser['display_name'] ?: $requesterUser['firstname'] . ' ' . $requesterUser['lastname']],
                                            ['label' => 'Reference', 'value' => $meta['quote']['order_number'] ?? null],
                                        ]),
                                        'target_type' => 'order',
                                        'target_id' => (int) $a->get('uriArgs.did'),
                                        'target_url' => $redirectUrl,
                                    ]);
                                    NotificationMiddleware::createSilently()($a);
                                }

                                if ($emailData) {
                                    $a->set('queueData', [[
                                        'type' => 'order',
                                        'uid' => $a->get('user.id'),
                                        'email_data' => $emailData,
                                        'time' => time()
                                    ]]);
                                    SqsMiddleware::writeAll("queueData", $approvalEmailQueue)($a);
                                }

                            }
                        },
                    ], true),
                    OrderMiddleware::fetchOrderApproverType("label", "Approved", "Approved"),
                    TenderMiddleware::fetchTenderHistoryType('uid', 'in_queue', 'in_queue'),
                    function($a) {
                        $approvalData = [
                            'status_id' => $a->get('order_approver_type_Approved.id'),
                            'comment' => '',
                            'is_approver_read' => 1,
                            'is_requester_read' => 1,
                        ];
                        $a->set('approval_data', $approvalData);
                        if ($a->get('is_approval_complete') || !$a->get('isApprovalLevel')) {
                            $newTenderHistory = [
                                "author_id" => $a->get('user.account_id'),
                                "specialist_id" => $a->get('quote')['subcontractor']['id'],
                                "status_id" => $a->get('tender_history_type_in_queue.id'),
                                "tender_history_type" => "Order",
                                "meta" => []
                            ];
                            $a->set("th_post_data", $newTenderHistory);
                            TenderMiddleware::createTenderHistory()($a);
                        }
                    },
                    OrderMiddleware::orderApprovalRejection('approval_data', 'request_data.approver_id'),
                    OrderMiddleware::syncOrderPrice(),
                    function ($a) use ($emailQueue) {
                        if ($a->get('is_approval_complete') || !$a->get('isApprovalLevel')) {
                            $orderApproval = $a->get('order_approval');
                            $requesterData = Manager::getService("account")->fetch("user/search", ['field' => 'id', 'value' => $orderApproval->get('requester_user_id')])->getShape('data')->get();
                            $a->set('requester_user', $requesterData);

                            $dateTime = DocumentMiddleware::getUKDateTime();

                            EmailMiddleware::send('Approve Order', [
                                "sender"    => ['id' => $requesterData['id']],
                                'extra'    => [
                                    'approverName'              => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                                    'requesterName'             => $requesterData['display_name'] ?: $requesterData['firstname'] . ' ' . $requesterData['lastname'],
                                    'orderValue'                => $a->get('order_value'),
                                    'projectName'               => $a->get('project.name'),
                                    'packageName'               => $a->get('quote.tender.label'),
                                    'dateTime'                  => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                    'subcontractorCompany'      => $a->get('quote.subcontractor.name'),
                                    'orderLink'                 => sprintf("%s/main-contractor/project/%s/orders", Config::get('clink.site_url'), $a->get('project.slug')),
                                ]
                            ])($a);

                            // Notify the requester their order was approved — additive to the email above, never replaces it.
                            $a->set('notification_payload', [
                                'account_id' => (int) ($requesterData['account_id'] ?? $a->get('user.account_id')),
                                'receiver_user_id' => (int) $requesterData['id'],
                                'project_id' => $a->get('project.id'),
                                'type' => 'order_approved',
                                'title' => 'Your order has been approved',
                                'message' => NotificationMiddleware::buildContextLine([
                                    ['label' => 'Project', 'value' => $a->get('project.name')],
                                    ['label' => 'Package Name', 'value' => $a->get('quote.tender.label')],
                                    ['label' => 'By', 'value' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname')],
                                    ['label' => 'Reference', 'value' => $a->get('quote.order_number')],
                                ]),
                                'target_type' => 'order',
                                'target_id' => (int) $a->get('uriArgs.did'),
                                'target_url' => sprintf("document-creator/template/%s/order/%s", $a->get('uriArgs.did'), $a->get('quote.tender_id')),
                            ]);
                            NotificationMiddleware::createSilently()($a);

                            $queueData[] = [
                                'did'                   => $a->get('uriArgs.did'),
                                'qid'                   => $a->get('quote.id'),
                                'sids'                  => $a->get("quote.subcontractor.id"),
                                'aid'                   => $a->get('user.account_id'),
                                'uid'                   => $a->get('order_approval.requester_user_id'),
                                'signing_mechanism'     => $a->get('request_data.signing_mechanism') ?? null,
                                'time'                  => time()
                            ];
                            $a->set('queueData', $queueData);
                            SqsMiddleware::writeAll("queueData", $emailQueue)($a);
                        }

                    },
                    function ($a) {
                        // Approved Log for approval request
                        $existingLogs = Manager::getService("project")
                            ->fetch(sprintf("order_approver/transaction/%s/log", $a->get('quote.id')))
                            ->getShape('data')
                            ->get();

                        $approvalLogs = array_values(array_filter($existingLogs, function ($log) {
                            return $log['type'] === 'Sent For Approval';
                        }));

                        $lastApprovalLog = end($approvalLogs);
                        $instance = 1;
                        if ($lastApprovalLog) {
                            $meta = json_decode($lastApprovalLog['meta'], true);
                            $instance = $meta['approver_assign']['instance'] ?? 1;
                        }

                        $orderApproval = $a->get('order_approval');
                        $workflowId = $orderApproval->get('approval_level_workflow_id');
                        $workflows = Manager::getService("project")
                            ->fetch(sprintf(
                                "approval-workflow-process/%s/%d",
                                'document',
                                $a->get('uriArgs.did')
                            ))
                            ->getShape('data')
                            ->get();

                        $workflow = array_values(array_filter($workflows, function ($wf) use ($workflowId) {
                            return $wf['id'] == $workflowId;
                        }));

                        $workflow = $workflow[0] ?? null;
                        $workflowMeta = json_decode($workflow['meta'], true);
                        $approvalLevelId = $workflowMeta['id'] ?? null;
                        $user_name = $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                        $logData = [
                            'user_id'        => $a->get('user.id'),
                            'transaction_id' => $a->get('quote.id'),
                            'meta' => json_encode([
                                'instance'           => $instance,
                                'approval_level_id'  => $approvalLevelId,
                                'approval_level_workflow_id' => $workflowId,
                                'status'             => 'Approved',
                                'user_name'          => $user_name,
                                'description'        => sprintf(
                                    "%s approved Level %s (Instance %s) for %s, %s",
                                    $user_name,
                                    $approvalLevelId,
                                    $instance,
                                    $a->get('project.name'),
                                    $a->get('quote.tender.label')
                                )
                            ]),
                            'type' => 'Approved'
                        ];
                        $a->set('logData', $logData);
                        OrderMiddleware::createOrderLog('logData')($a);
                    },

                    // mark the "Order Approval" milestone as completed
                    MilestoneMiddleware::milestoneComplete('tid', 'Order Approval')
                ],
                [
                    Conditional::switched('request_data.status', [
                        // Rejected handling
                        OrderMiddleware::fetchOrderApproverType("label", "Rejected", "Rejected"),
                        TenderMiddleware::fetchTenderHistoryType('uid', 'rejected', 'rejected'),
                        function($a) {
                            if ($a->get('isApprovalLevel')) {
                                // Move the current level to rejected
                                $approvalWorkflow = $a->getCollection('approval_level_workflow_by_entity');
                                $approvalWorkflowCurrent = $approvalWorkflow->filterByField('status', 'in_progress')->first();
                                $payload = [
                                    'status' => 'rejected',
                                ];
                                Manager::getService("project")->update(
                                    sprintf("approval-workflow-process/workflow/%s", $approvalWorkflowCurrent->get('id')),
                                    new Shape(['data' => $payload])
                                );
                            }

                            $approvalData = [
                                'status_id' => $a->get('order_approver_type_Rejected')->get('id'),
                                'comment' => $a->get('request_data.comment'),
                                'is_approver_read' => 1,
                            ];
                            $a->set('approval_data', $approvalData);
                            $newTenderHistory = [
                                "author_id" => $a->get('user.account_id'),
                                "specialist_id" => $a->get('quote')['subcontractor']['id'],
                                "status_id" => $a->get('tender_history_type_rejected')->get('id'),
                                "tender_history_type" => "Order",
                                "meta" => []
                            ];
                            $a->set("th_post_data", $newTenderHistory);
                        },
                        OrderMiddleware::orderApprovalRejection('approval_data', 'request_data.approver_id'),
                        TenderMiddleware::createTenderHistory(),
                        function ($a) {
                            $orderApproval = $a->get('order_approval');
                            $requesterData = Manager::getService("account")->fetch("user/search", ['field' => 'id', 'value' => $orderApproval->get('requester_user_id')])->getShape('data')->get();

                            $dateTime = DocumentMiddleware::getUKDateTime();

                            EmailMiddleware::send('Reject Order', [
                                "sender"    => ['id' => $requesterData['id']],
                                'extra'    => [
                                    'approverName'  => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                                    'requesterName'   => $requesterData['display_name'] ?: $requesterData['firstname'] . ' ' . $requesterData['lastname'],
                                    'orderValue'    => $a->get('order_value'),
                                    'projectName'   => $a->get('project')->get('name'),
                                    'packageName'   => $a->get('quote.tender.label'),
                                    'dateTime'      => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                    'comment'       => $a->get('request_data.comment'),
                                    'orderLink'     => sprintf("%s/document-creator/template/%s/order/%s", Config::get('clink.site_url'), $a->get('uriArgs.did'), $a->get('quote.tender_id')),
                                ]
                            ])($a);

                            // Notify the requester their order was rejected — additive to the email above.
                            $a->set('notification_payload', [
                                'account_id' => (int) ($requesterData['account_id'] ?? $a->get('user.account_id')),
                                'receiver_user_id' => (int) $requesterData['id'],
                                'project_id' => $a->get('project.id'),
                                'type' => 'order_rejected',
                                'title' => 'Your order has been rejected',
                                'message' => NotificationMiddleware::buildContextLine([
                                    ['label' => 'Project', 'value' => $a->get('project')->get('name')],
                                    ['label' => 'Package Name', 'value' => $a->get('quote.tender.label')],
                                    ['label' => 'By', 'value' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname')],
                                    ['label' => 'Reference', 'value' => $a->get('quote.order_number')],
                                ]),
                                'target_type' => 'order',
                                'target_id' => (int) $a->get('uriArgs.did'),
                                'target_url' => sprintf("document-creator/template/%s/order/%s", $a->get('uriArgs.did'), $a->get('quote.tender_id')),
                            ]);
                            NotificationMiddleware::createSilently()($a);

                            // Reject log of approved request
                            $existingLogs = Manager::getService("project")
                            ->fetch(sprintf("order_approver/transaction/%s/log", $a->get('quote.id')))
                            ->getShape('data')
                            ->get();

                            $approvalLogs = array_values(array_filter($existingLogs, function ($log) {
                                return $log['type'] === 'Sent For Approval';
                            }));

                            $lastApprovalLog = end($approvalLogs);
                            $instance = 1;
                            if ($lastApprovalLog) {
                                $meta = json_decode($lastApprovalLog['meta'], true);
                                $instance = $meta['approver_assign']['instance'] ?? 1;
                            }

                            $orderApproval = $a->get('order_approval');
                            $workflowId = $orderApproval->get('approval_level_workflow_id');
                            $workflows = Manager::getService("project")
                                ->fetch(sprintf(
                                    "approval-workflow-process/%s/%d",
                                    'document',
                                    $a->get('uriArgs.did')
                                ))
                                ->getShape('data')
                                ->get();

                            $workflow = array_values(array_filter($workflows, function ($wf) use ($workflowId) {
                                return $wf['id'] == $workflowId;
                            }));

                            $workflow = $workflow[0] ?? null;
                            $workflowMeta = json_decode($workflow['meta'], true);
                            $approvalLevelId = $workflowMeta['id'] ?? null;
                            $user_name = $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                            $logData = [
                                'user_id'        => $a->get('user.id'),
                                'transaction_id' => $a->get('quote.id'),
                                'meta' => json_encode([
                                    'instance'           => $instance,
                                    'approval_level_id'  => $approvalLevelId,
                                    'approval_level_workflow_id' => $workflowId,
                                    'status'             => 'Rejected',
                                    'comment'            => $a->get('request_data.comment'),
                                    'user_name'          => $user_name,
                                    'description'        => sprintf(
                                        "%s rejected Level %s (Instance %s) for %s, %s",
                                        $user_name,
                                        $approvalLevelId,
                                        $instance,
                                        $a->get('project.name'),
                                        $a->get('quote.tender.label')
                                    )
                                ]),
                                'type' => 'Rejected'
                            ];
                            $a->set('logData', $logData);
                            OrderMiddleware::createOrderLog('logData')($a);
                        },
                    ],[
                        function ($a) {
                            throw new MiddlewareException("UnAuthorizedApproval");
                        }
                    ], 'Rejected')
                ], 'Approved'),
                Generic::set("json", function ($a) {
                    return json_encode([
                        'status' => true,
                    ]);
                })
            ]
        ],
        [
            "id" => "withdraw-order-approval",
            "key" => "(?<did>[0-9]{1,7})\/order\/approval\/withdraw$",
            "method" => "POST",
            "middleware" => [
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                DocumentMiddleware::fetchDocument('id', 'uriArgs.did'),
                function ($a) {
                    $meta = json_decode($a->get("document")->first()->get('meta'), true);

                    $a->set('meta', $meta);
                    $a->set('quote', $meta['quote']);
                    $a->set('transaction_id', $meta['quote']['id']);
                    $a->set('pid', $meta['quote']['tender']['project_id']);
                    $a->set('tid', $meta['quote']['tender']['id']);
                },

                function ($a) {
                    $a->set("approval_workflow_entity", [
                        'entity_type' => 'document',
                        'entity_id' => $a->get('uriArgs.did')
                    ]);
                },

                ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity('approval_workflow_entity', 'approval_level_workflow'),
                ProjectMiddleware::fetchProject('id', 'pid'),
                TenderMiddleware::fetchTenderHistoryType('uid', 'order_draft', 'orderDraft'),
                OrderMiddleware::fetchOrderApprovalByTransaction('quote.id'),

                function ($a) {
                    $orderApprovers = $a->get('order_approval_transaction');
                    $workflowsShape = $a->get('approval_level_workflow');
                    $newCollection = new Collection($workflowsShape->get(), Shape::class);
                    $inProgressWorkflowId = $newCollection->filterByField('status', 'in_progress')->first()->get('id');
                    $inProgressLevelApprovers = $orderApprovers->filterByField('approval_level_workflow_id', $inProgressWorkflowId);
                    $meta = $a->get('meta');
                    $projectData = $a->get('project');
                    $emailData = [];

                    foreach ($inProgressLevelApprovers as $data) {
                        $data = $data->toArray();
                        $dateTime = DocumentMiddleware::getUKDateTime($data['created_at']);
                        $approver = Manager::getService("account")->fetch("user/search", ['field' => 'id', 'value' => $data['approver_user_id']])->getShape('data')->get();
                        $requester = Manager::getService("account")->fetch("user/search", ['field' => 'id', 'value' => $data['requester_user_id']])->getShape('data')->get();

                        $emailData[] = [
                            'sender'    => ['id' => $requester['id']],
                            'email' => $approver['email'],
                            'template' => 'Withdraw Order Approver',
                            'user_id' => $approver['id'],
                            'body' => [
                                'approverName'  => $approver['display_name'] ?: $approver['firstname'] . ' ' . $approver['lastname'],
                                'requestedBy'   => $requester['display_name'] ?: $requester['firstname'] . ' ' . $requester['lastname'],
                                'orderValue'    => '£' . number_format(((int)$meta['values']['order_value'])/100, 2),
                                'projectName'   => $projectData->get('name'),
                                'packageName'   => $meta['quote']['tender']['label'],
                                'dateTime'      => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                'orderId'        => $meta['quote']['order_number'] ?? null,
                            ]
                        ];
                    }

                    $queueData[] = [
                        'type' => 'order',
                        'uid' => $a->get('user.id'),
                        'email_data' => $emailData,
                        'time' => time()
                    ];
                    $a->set('queueData', $queueData);

                    if (!$workflowsShape || $workflowsShape->count() === 0) {
                        return;
                    }

                    $workflows = $workflowsShape->toArray();
                    $allCompleted = true;

                    foreach ($workflows as $workflow) {
                        if (($workflow['status'] ?? null) !== 'complete') {
                            $allCompleted = false;
                            break;
                        }
                    }

                    if ($allCompleted) {
                        throw new MiddlewareException(
                            "forbidden",
                            "Cannot withdraw. All approval levels are completed"
                        );
                    } else {
                        ApprovalMiddleware::removeApprovalLevelWorkflowByEntity('approval_workflow_entity')($a);
                    }
                },
                SqsMiddleware::writeAll("queueData", $approvalEmailQueue),

                function ($a) {
                    $meta = $a->get('meta');
                    $a->set('th_post_data', [
                        'author_id' => $a->get('user.account_id'),
                        'specialist_id' => $meta['quote']['subcontractor']['id'],
                        'status_id' => $a->get('tender_history_type_orderDraft.id'),
                        'tender_history_type' => 'Order',
                        'meta' => [],
                    ]);
                },
                TenderMiddleware::createTenderHistory(),

                OrderMiddleware::removeOrderApproversByTransaction('transaction_id'),
                OrderMiddleware::resetOrderPrice(),

                function ($a) {
                    $meta = $a->get('meta');
                    $projectName = $a->get('project.name') ?? 'N/A';
                    $tenderName  = $meta['quote']['tender']['label'] ?? 'N/A';
                    $existingLogs = Manager::getService("project")
                        ->fetch(sprintf("order_approver/transaction/%s/log", $meta['quote']['id']))
                        ->getShape('data')
                        ->get();

                    $withdrawLogs = array_values(array_filter($existingLogs, function ($log) {
                        return ($log['type'] ?? null) === 'Sent For Approval';
                    }));

                    $instance = count($withdrawLogs);
                    $user_name = $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                    $logData = [
                        'user_id'        => $a->get('user.id'),
                        'transaction_id' => $meta['quote']['id'],
                        'meta'           => json_encode([
                            'instance'    => $instance,
                            'status'      => 'Withdrawn',
                            'user_name'   => $user_name,
                            'description' => sprintf(
                                "%s withdrew approval request for %s, %s",
                                $user_name,
                                $projectName,
                                $tenderName
                            )
                        ]),
                        'type' => 'Withdrawn'
                    ];

                    $a->set('logData', $logData);
                    OrderMiddleware::createOrderLog('logData')($a);
                },

                Generic::set("json", function () {
                    return json_encode([
                        'status' => true,
                        'message' => 'Approval withdrawn successfully'
                    ]);
                })
            ]
        ],
        [
            "key" => "(?<did>[0-9]{1,7})\/replace$",
            "method" => "POST",
            "middleware" => [
                function ($a) {
                    $requestData = $a->getRoute()->getRequest()->getData();
                    $data = $requestData->getShape('json');
                    $a->setItems([
                        "did" => $a->get('uriArgs.did'),
                        "cid" => $data->get('cid'),
                        "documentId" => $data->get('id'),
                    ]);
                },
                DocumentMiddleware::fetchDocument('id', 'uriArgs.did'),
                DocumentMiddleware::fetchDocument('id', 'documentId'),
                DocumentMiddleware::replaceDocuemnt(),
                Generic::set("json",  function ($a) {
                    return json_encode(['success' => true]);
                })
            ]
        ],
        [
            "id" => "order-rejection-acknowledgement",
            "key" => "(?<did>[0-9]{1,7})\/order\/rejection-acknowledge$",
            "description" => "Endpoint for requester to acknowledge the rejection of an order",
            "method" => "POST",
            "middleware" => [
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                DocumentMiddleware::fetchDocument('id', 'uriArgs.did'),
                TenderMiddleware::fetchTenderHistoryType('uid', 'order_draft', 'orderDraftType'),
                function ($shape) {
                    $meta = json_decode($shape->get('document')->first()->get('meta'), true);
                    $pid = $meta['quote']['tender']['project_id'];
                    $tid = $meta['quote']['tender']['id'];
                    $shape->set("pid", $pid);
                    $shape->set("tid", $tid);
                    $shape->set("transaction_id", $meta['quote']['id']);

                    $newTenderHistory = [
                        "author_id" => $shape->get('user.account_id'),
                        "specialist_id" => $meta['quote']['subcontractor']['id'],
                        "status_id" => $shape->get('tender_history_type_orderDraftType.id'),
                        "tender_history_type" => "Order",
                        "meta" => []
                    ];

                    $shape->set("approval_workflow_entity", [
                        'entity_type' => 'document',
                        'entity_id' => $shape->get('uriArgs.did')
                    ]);
                    $shape->set("th_post_data", $newTenderHistory);
                },
                ApprovalMiddleware::removeApprovalLevelWorkflowByEntity('approval_workflow_entity'),
                OrderMiddleware::removeOrderApproversByTransaction('uriArgs.did'),
                OrderMiddleware::resetOrderPrice('pid', 'transaction_id'),
                TenderMiddleware::createTenderHistory(),
                function ($a) {
                    $meta = json_decode($a->get('document')->first()->get('meta'), true);
                    $existingLogs = Manager::getService("project")
                        ->fetch(sprintf("order_approver/transaction/%s/log", $meta['quote']['id']))
                        ->getShape('data')
                        ->get();

                    $approvalLogs = array_values(array_filter($existingLogs, function ($log) {
                        return $log['type'] === 'Rejected';
                    }));

                    $instance = count($approvalLogs);
                    $user_name = $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                    $logData = [
                        'user_id'        => $a->get('user.id'),
                        'transaction_id' => $meta['quote']['id'],
                        'meta'           => json_encode([
                            'instance'      => $instance,
                            'status'        => 'Rejection Acknowledged',
                            'user_name'     => $user_name,
                            'description'   => sprintf(
                                "%s acknowledged rejection for %s, %s",
                                $user_name,
                                $a->get('project.name'),
                                $meta['quote']['tender']['label']
                            )
                        ]),
                        'type' => 'Rejection Acknowledged'
                    ];

                    $a->set('logData', $logData);
                    OrderMiddleware::createOrderLog('logData')($a);
                },
                Generic::set("json",  function ($a) {
                    return json_encode(['success' => true]);
                })
            ]
        ],
        [
            "id" => "order-logs",
            "key" => "(?<did>[0-9]{1,7})\/order\/logs$",
            "method" => "GET",
            "middleware" => [
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                DocumentMiddleware::fetchDocument('id', 'uriArgs.did'),
                function ($a) {
                    $meta = json_decode($a->get("document")->first()->get('meta'), true);
                    $quoteId = $meta['quote']['id'];
                    $a->set('quote', $meta['quote']);
                    $a->set('project_name', $meta['quote']['tender']['project_name'] ?? '');
                    $a->set('package_name', $meta['quote']['tender']['label'] ?? '');
                    $logs = Manager::getService("project")
                        ->fetch(sprintf("order_approver/transaction/%s/log", $quoteId))
                        ->getShape('data')
                        ->get();
                    $convertToUKTime = function ($dateTime) {
                        if (!$dateTime) return null;
                        $date = new DateTime($dateTime, new DateTimeZone('UTC'));
                        $date->setTimezone(new DateTimeZone('Europe/London'));
                        return $date->format("Y-m-d H:i:s");
                    };

                    $sentLogs = [];
                    $actionLogs = [];
                    $oldLogs = [];
                    $hasWorkflowLogs = false;

                    foreach ($logs as $log) {
                        $metaData = json_decode($log['meta'], true);
                        if (
                            !empty($metaData['approval_level_id']) ||
                            !empty($metaData['approval_level_workflow_id']) ||
                            isset($metaData['approver_assign'])
                        ) {
                            $hasWorkflowLogs = true;
                        }

                        if ($log['type'] === 'Sent For Approval') {
                            $sentLogs[] = $log;
                        } elseif (in_array($log['type'], ['Approved', 'Rejected'])) {
                            $actionLogs[] = $log;
                        } else {
                            $oldLogs[] = $log;
                        }
                    }


                    $finalLogs = [];
                    foreach ($sentLogs as $log) {

                        $metaData = json_decode($log['meta'], true);

                        if (empty($metaData['approver_assign'])) {
                            continue;
                        }

                        $approval = $metaData['approver_assign'];
                        $instance = $approval['instance'];

                        foreach ($approval['levels'] as &$level) {
                            $levelId = $level['approval_level_id'];
                            $level['approval_level_workflow_id'] = null;

                            foreach ($level['entries'] as &$entry) {
                                foreach ($actionLogs as $actionLog) {
                                    $actionMeta = json_decode($actionLog['meta'], true);

                                    if (
                                        $actionMeta['instance'] == $instance &&
                                        $actionMeta['approval_level_id'] == $levelId &&
                                        $actionMeta['user_name'] == $entry['user']
                                    ) {
                                        $entry['type'] = strtolower($actionMeta['status']);
                                        $entry['label'] = ApprovalSatisfactionHelper::resolveApprovalLogLabelFromMeta(
                                            array_merge($entry, $actionMeta),
                                            $actionLog['type'] ?? null
                                        );
                                        $entry['timestamp'] = $convertToUKTime($actionLog['created_at']);
                                        $entry['comment'] = $actionMeta['comment'] ?? '';

                                        if (!empty($actionMeta['approval_level_workflow_id'])) {
                                            $level['approval_level_workflow_id'] = $actionMeta['approval_level_workflow_id'];
                                        }
                                    }
                                }

                                $entry = ApprovalSatisfactionHelper::finalizeLogEntryForGet($entry);
                            }
                            unset($entry);
                        }
                        unset($level);

                        $approval['levels'] = ApprovalSatisfactionHelper::finalizeLogLevelsForGet(
                            $approval['levels'],
                            'approved',
                            'pending'
                        );

                        $finalLogs[] = [
                            "type"      => "approval_request",
                            "instance"  => $approval['instance'],
                            "heading"   => $approval['heading'],
                            "label"     => $approval['label'],
                            "user"      => $approval['user'],
                            "timestamp" => $convertToUKTime($approval['timestamp']),
                            "sort_timestamp" => $log['created_at'],
                            "levels"    => $approval['levels'],
                            "comment"   => $approval['variance_explanation'] ?? '',
                        ];
                    }

                    $formattedOldLogs = [];
                    foreach ($oldLogs as $log) {
                        $metaData = json_decode($log['meta'], true);

                        $formattedOldLogs[] = [
                            'user_id'   => $a->get('user.id'),
                            "type"      => strtolower(str_replace(' ', '_', $log['type'])),
                            "label"     => $log['type'],
                            "user"      => $metaData['user_name'] ?? 'Unknown user',
                            "timestamp" => $log['created_at'],
                            "sort_timestamp" => $log['created_at'],
                            "comment"   => $metaData['comment'] ?? ($log['comment'] ?? ''),
                            "description"   => $metaData['description'] ?? ($log['description'] ?? '')
                        ];
                    }

                    if ($hasWorkflowLogs) {
                        $responseLogs = array_merge($formattedOldLogs, $finalLogs);
                    } else {
                        $responseLogs = $formattedOldLogs;
                    }

                    usort($responseLogs, function ($a, $b) {
                        $t1 = isset($a['sort_timestamp']) ? strtotime($a['sort_timestamp']) : 0;
                        $t2 = isset($b['sort_timestamp']) ? strtotime($b['sort_timestamp']) : 0;
                        return $t1 <=> $t2;
                    });
                    $a->set('response_logs', $responseLogs);
                },

                Generic::set("json", function ($a) {
                    return json_encode([
                        "entity_no"   => $a->get('quote.id'),
                        "package_name"=> $a->get('package_name'),
                        "logs"        => $a->get('response_logs')
                    ]);
                })
            ]
        ],
        [
            "id" => "document-snapshot-download-all",
            "key" => "(?<did>[0-9]{1,7})\/snapshot\/download-all$",
            "method" => "GET",
            "middleware" => [
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                DocumentMiddleware::downloadDocumentSnapshotArchive(),
                DocumentMiddleware::outputDocument(),
            ]
        ],
        [
            "id" => "document_snapshot",
            "key" => "(?<did>[0-9]{1,7})\/snapshot$",
            "method" => "GET",
            "response_keys" => ["data" => "snapshot"],
            "description" => "Get document snapshot tree",
            "middleware" => [
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                DocumentMiddleware::fetchDocumentSnapshot(),
            ]
        ],
        [
            "id" => "document-preview-mode-download",
            "key" => "(?<did>[0-9]{1,7})\/preview-mode\/download$",
            "method" => "GET",
            "middleware" => [
                Procedure::get("documentCheckOwnership", ['key' => 'id', 'value' => 'uriArgs.did']),
                function ($a) {
                    $getContent = (bool)($a->get("request_args.get_content") ?? false);
                    $a->set("get_content", $getContent);
                    $a->set("aid", $a->getShape("account")->int("id"));

                    $document = $a->get('document')->first();
                    $meta     = json_decode($document->get("meta") ?: '{}', true);
                    $provider = $meta['temp_snapshot']['provider'] ?? 'asite';

                    $a->set("provider", $provider);
                    $a->set("document_meta", $meta);
                },
                // Check feature flag
                Rest::fetchDynamic(
                    "account",
                    "feature/accounts/{aid}",
                    [],
                    "account_features",
                    postProcessor: function ($res, $a) {
                        $features = $res->getShape("json")->get("data") ?: [];
                        $featureNames = array_map('strtoupper', array_filter(array_column($features, 'feature')));
                        if (!in_array(strtoupper($a->get("provider")), $featureNames, true)) {
                            throw new MiddlewareException("forbidden", strtoupper($a->get("provider")) . " feature not enabled for this account");
                        }
                    }
                ),
                Rest::fetchDynamic(
                    "account",
                    "account/{aid}/provider/{provider}",
                    [],
                    "provider_data",
                    postProcessor: function ($res, $a) {
                        $a->set("provider_data", $res->getShape("json")->get("data") ?: []);
                    }
                ),
                function ($a) {
                    $providerId = (int)($a->get("provider_data.provider_id") ?? 0);
                    if (!$providerId) {
                        throw new MiddlewareException("serviceError", strtoupper($a->get("provider")) . " provider not configured");
                    }

                    $a->set("provider_id", $providerId);

                    $category = $a->get("request_args.category");
                    $folder   = $a->get("request_args.folder");
                    $file     = $a->get("request_args.file");
                    $docUri   = $a->get("request_args.uri");

                    if (!($category && $folder && $file) && !$docUri) {
                        throw new MiddlewareException("badRequest", "Missing required parameters");
                    }

                    $documentMeta = $a->get("document_meta");
                    $documentFile = $documentMeta['temp_snapshot']['categories'][$category]['children'][$folder]['children'][$file] ?? null;

                    if (!$documentFile || !isset($documentFile['download_uri'])) {
                        if (!$docUri) {
                            throw new MiddlewareException("noDocumentFound", "File not found");
                        } else {
                            $documentFile['download_uri'] = $docUri;
                            foreach ($documentMeta['temp_snapshot']['categories'] ?? [] as $cat) {
                                foreach ($cat['children'] ?? [] as $folder) {
                                    foreach ($folder['children'] ?? [] as $fileItem) {
                                        if (($fileItem['download_uri'] ?? '') === $docUri) {
                                            $documentFile = $fileItem;
                                            break 3;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    $provider = Provider::getProvider($a->get("provider"), [
                        "key" => (string)$a->get("provider_data.credentials.key")
                    ]);
                    if (!$provider) {
                        throw new MiddlewareException("serviceError", "Failed to initialize " . strtoupper($a->get("provider")) . " provider");
                    }

                    /** @var Api\Model\Document\Provider\Asite $provider */
                    $downloads = $provider->downloadDocumentByUri($documentFile['download_uri']);
                    if (!empty($documentFile['doc_title'])) {
                        $downloads['filename'] = $documentFile['doc_title'];
                    }
                    $a->set("downloads", $downloads);
                },
                Conditional::switched(
                    "get_content",
                    [
                        Generic::set("json", function ($a) {
                            return json_encode([
                                "data" => [
                                    "content"  => base64_encode($a->get("downloads.content")),
                                    "type"     => $a->get("downloads.type"),
                                    "filename" => $a->get("downloads.filename", "downloaded_file")
                                ]
                            ]);
                        })
                    ],
                    [
                        function ($a) {
                            $save_path = Config::get('document.save.tmp', '/tmp');
                            if (!is_dir($save_path)) {
                                mkdir($save_path, 0755, true);
                            }

                            $filename = $a->get("downloads.filename", "downloaded_file");
                            $save_to  = $save_path . "/" . $filename;

                            file_put_contents($save_to, $a->get("downloads.content"));
                            $a->set("output", $save_to);

                            $status = ($save_to && file_exists($save_to)) ? 'downloaded' : 'not_downloaded';
                            header('X-Download-Status: ' . $status);
                            header('Access-Control-Expose-Headers: X-Download-Status');
                        },
                        DocumentMiddleware::outputDocument(),
                    ]
                ),

            ]
        ],
    ]
];
