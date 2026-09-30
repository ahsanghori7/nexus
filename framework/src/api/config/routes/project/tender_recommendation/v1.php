<?php

use Core\Config;
use Api\Middleware\LogsMiddleware;
use Api\Middleware\ApprovalMiddleware;
use Api\Middleware\ApprovalSatisfactionHelper;
use Api\Middleware\DocumentMiddleware;
use Api\Middleware\Email\TenderRecommendationMiddleware as EmailTenderRecommendationMiddleware;
use Api\Middleware\NotificationMiddleware;
use Api\Middleware\OrderMiddleware;
use Core\Middleware\Procedure;
use Core\Middleware\Collection;
use Core\Middleware\Service\AccountMiddleware;
use Core\Middleware\Service\UserMiddleware;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;
use Core\Middleware\Generic;
use Core\Data\Shape;
use Api\Middleware\Pdf\tender\TenderRecommendationPdfMiddleware;
use Api\Middleware\TenderMiddleware;
use Api\Middleware\TenderRecommendationMiddleware;
use Core\Middleware\Conditional;
use Core\Service\Manager;
use Prosper\Middleware\SqsMiddleware;
use Api\Middleware\MilestoneMiddleware;

include_once "procedures.php";

$emailQueue = Config::get("services.aws.sqs.queues.approval_email");

$convertToUKTime = function ($dateTime) {
    if (!$dateTime) {
        return null;
    }
    $date = new DateTime($dateTime, new DateTimeZone('UTC'));
    $date->setTimezone(new DateTimeZone('Europe/London'));
    return $date->format("Y-m-d H:i:s");
};

return [
    [
        "id" => "tender_recommendation_list",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation$",
        "method" => "GET",
        "description" => "Return a list of all tender recommendations for a project",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Rest::fetchDynamic(
                "project",
                "project/{project.id}/tender_recommendation",
                [],
                "data",
                postProcessor: function ($res, $a) {
                    $trShape = [];
                    if ($res) {
                        $dataShape = $res->getShape("data");
                        $trShape = $dataShape->toArray();
                    }

                    // Collect IDs
                    $authorIds      = array_unique(array_column($trShape, "author_id"));
                    $transactionIds = array_unique(array_column($trShape, "transaction_id"));
                    $tenderIds      = array_unique(array_column($trShape, "tender_id"));

                    $a->set("author_ids", $authorIds);
                    $a->set("transaction_ids", $transactionIds);
                    $a->set("tender_ids", $tenderIds);

                    // Preload tenders
                    $projectTenders = $a->getShape("project")->getShape("tender");
                    $tenders = [];
                    foreach ($projectTenders->toArray() as $t) {
                        if (in_array($t['id'], $tenderIds)) {
                            $tenders[$t['id']] = $t;
                        }
                    }
                    $a->set("tenders", $tenders);

                    // Fetch transactions
                    if (!empty($transactionIds)) {
                        $transactions = Rest::fetchDynamic(
                            "project",
                            "transaction/transactions/" . implode(",", $transactionIds),
                            [],
                            "transactions"
                        );
                        $transactions($a);

                        $transactionsShape = $a->get("transactions");
                        $transactionsArr   = $transactionsShape
                            ? $transactionsShape->toArray()
                            : $transactionsShape;

                        $subcontractorIds = array_unique(array_column($transactionsArr ?? [], "subcontractor_id"));
                        $a->set("subcontractor_ids", $subcontractorIds);

                        AccountMiddleware::loadAccountsByIdArray("subcontractor_ids")($a);
                    }

                    // Load authors
                    UserMiddleware::loadUsersByIdArray("author_ids")($a);

                    // Save final tender array
                    $a->set("data", $trShape);
                }
            ),

            Collection::format(function ($item, $a) use ($convertToUKTime) {
                $canIssueOrder = false;
                if ($item->get('status') === 'Approved') {
                    $order = Manager::getService("project")->fetch(sprintf("transaction/%s", $item->get('transaction_id')))->getShape('data')->get();
                    $order = array_shift($order);
                    $a->set('order', $order);
                    $document = Manager::getService("document")->fetch("category", ['entity_id' => $order['tender_id'], 'entity_type' => 'order_template'])->getShape('data')->get();
                    $canIssueOrder = true;
                    if (!empty($document)) {
                        $document = array_shift($document);
                        $idx = count($document['documents']) - 1;
                        $documents = $document['documents'];
                        $document = $documents[$idx];
                        $a->set('document_id', $document['id']);
                        DocumentMiddleware::fetchDocumentSigners('document_id')($a);
                        TenderMiddleware::fetchTenderHistoryType('uid', 'pending_approval', 'pendingApproval')($a);
                        $a->set('tid', $item->get('tender_id'));
                        TenderMiddleware::fetchTenderHistory('uriArgs.project_id', 'tid', true)($a);
                        DocumentMiddleware::fetchSignatoryStatuses(true)($a);
                        OrderMiddleware::getStatus('order', 'document_signers', 'document_signatory_statuses')($a);
                        $tenderHistory = $a->get('tender_history');
                        $lastHistory = null;
                        if (!empty($tenderHistory)) {
                            $tenderHistory = array_shift($tenderHistory);
                            $history = $tenderHistory["history"];
                            $lastHistory = array_shift($history);
                            $a->set('last_tender_history', $lastHistory);
                        }
                        $status = $a->get('status');
                        if ($lastHistory && $lastHistory["tender_history_type"] === 'Order') {
                            $status = Manager::getService("project")->fetch("tender/history/type")->getCollection('data')->filterByField("id", $lastHistory["status_id"])->first()->get('label');
                        }
                        $canIssueOrder = !in_array($status, ['Sent', 'Awarded Package']);
                    }
                }
                $tenders = $a->get("tenders") ?? [];
                $users = $a->get("users") ?? [];
                $accounts = $a->get("accounts") ?? [];
                $transactionsShape = $a->get("transactions");
                $tender = $tenders[$item->get('tender_id')] ?? null;

                // For author
                $author = null;
                foreach ($users as $u) {
                    $userId = is_object($u) ? $u->get("id") : ($u["id"] ?? null);
                    if ($userId == $item->get("author_id")) {
                        $author = $u;
                        break;
                    }
                }

                // For subcontractor
                $subcontractor = null;
                if ($transactionsShape) {
                    $transactionsArr = $transactionsShape
                        ? $transactionsShape->toArray()
                        : $transactionsShape;

                    foreach ($transactionsArr as $tx) {
                        if ($tx["id"] == $item->get("transaction_id")) {
                            foreach ($accounts as $acc) {
                                if ($acc["id"] == $tx["subcontractor_id"]) {
                                    $subcontractor = $acc;
                                    break 2;
                                }
                            }
                        }
                    }
                }
                // fetch assigned approvers
                $a->set('approval_workflow_entity', [
                    'entity_type' => 'tender_recommendation',
                    'entity_id' => $item->get("id"),
                ]);
                ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity()($a);
                ApprovalMiddleware::fetchApprovalsList()($a);

                if($a->getCollection('approval_workflows')->count() > 0) {
                    // fetch users to notify based on active/completed approval levels
                    $approvalLevelWorkflowIds = $a->getCollection('approval_workflows')->getIds();
                    $approvalUserIds = $a->getCollection('approvals')->filterByExistInArray('approval_level_workflow_id', $approvalLevelWorkflowIds)->values('user_id', true);
                } else {
                    $approvals = $a->get('approvals')->toArray();
                    $approvalUserIds = array_column($approvals, "user_id");
                }

                $a->set('approver_user_ids', $approvalUserIds);

                // load approver user details
                UserMiddleware::loadUsersByIdArray(k: 'approver_user_ids', key: 'approver_users')($a);

                $approverUsers = [];
                foreach ($a->get('approver_users') as $user) {
                    $userId = $user['id'] ?? null;
                    if ($userId !== null) {
                        $accountRole = Manager::getService('account')->fetch("user/$userId/account-roles")->getCollection('data')->first()->toArray();
                        if (isset($accountRole['id']) && $accountRole['id']) {
                            $accountRoleData = [
                                'id' => $accountRole['id'] ?? null,
                                'label' => $accountRole['label'] ?? null,
                                'role_id' => $accountRole['role_id'] ?? null,
                            ];
                        }
                        $user['account_role'] = $accountRoleData ?? null;
                        $user['display_name'] = $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'];
                        $approverUsers[$userId] = $user;
                    }
                }

                $approvalLevelWorkflows = $a->getShape('approval_workflows')->get();
                $isLevel = true;
                if(is_array($approvalLevelWorkflows) && !empty($approvalLevelWorkflows)) {
                    foreach($approvalLevelWorkflows as $workflow) {
                        $meta = json_decode($workflow['meta'], true);
                        $approvals = $a->getCollection('approvals')->filterByField('approval_level_workflow_id', $workflow['id'])->map(function ($item) use ($approverUsers, $convertToUKTime, $meta) {
                            return array_merge(
                                [
                                    'id' => $item->get('id'),
                                    'user_id' => $item->get('user_id'),
                                    'comment' => $item->get('comment'),
                                ],
                                ApprovalSatisfactionHelper::resolveResponseFlags($item->get('meta'), $meta),
                                [
                                    'created_at' => $convertToUKTime($item->get('created_at')),
                                    'updated_at' => $convertToUKTime($item->get('updated_at')),
                                    'status' => $item->get('status'),
                                    'approver_user' => $approverUsers[$item->get('user_id')] ?? null,
                                ]
                            );
                        });

                        switch ($meta['rule_type']) {
                            case 'any':
                                $rule_label = 'Anyone can approve';
                                break;

                            case 'custom':
                                $rule_label = "Any {$meta['min_required']} from " . count($meta['roles']) . " must approve";
                                break;

                            default:
                                $rule_label = 'All must approve';
                                break;
                        }

                        $assignedApprovers[] = [
                            'level' => $workflow['sort_order'],
                            'rule' => $rule_label,
                            'status' => $workflow['status'] === 'pending' ? 'locked' : $workflow['status'],
                            'approvers' => $approvals,
                        ];
                    }
                } else {
                    $isLevel = false;
                    $assignedApprovers = $a->getCollection('approvals')->map(function($item) use ($approverUsers) {
                        $item->set('approver_user', $approverUsers[$item->get('user_id')] ?? null);
                        foreach (ApprovalSatisfactionHelper::resolveResponseFlags($item->get('meta')) as $flagKey => $flagValue) {
                            $item->set($flagKey, $flagValue);
                        }
                        return $item;
                    });
                }


                return [
                    "tender_recommendation_id" => $item->get("id"),
                    "transaction_id" => $item->get('transaction_id'),
                    "package_id" => $item->get("tender_id"),
                    "package_name" => $tender["label"] ?? null,
                    "subcontractor" => $subcontractor ? [
                        "id" => is_object($subcontractor) ? $subcontractor->get("id") : ($subcontractor["id"] ?? null),
                        "name" => is_object($subcontractor) ? $subcontractor->get("name") : ($subcontractor["name"] ?? null),
                    ] : null,
                    "submitted_by" => $author ? [
                        "id" => is_object($author) ? $author->get("id") : ($author["id"] ?? null),
                        "display_name" => is_object($author) ? ($author->get("display_name") ?: $author->get("firstname") . ' ' . $author->get("lastname")) : ($author["display_name"] ?: $author["firstname"] . ' ' . $author["lastname"]),
                    ] : null,
                    "status" => $item->get("status"),
                    "last_updated" => $convertToUKTime($item->get("updated_at")),
                    "assigned_approvers" => $assignedApprovers,
                    "can_issue_order" => $canIssueOrder,
                    "isLevel" => $isLevel
                ];
            }, "data")
        ]
    ],
    [
        "id" => "tender_recommendation_get",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)$",
        "method" => "GET",
        "description" => "Get a single tender recommendation by ID",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Rest::fetchDynamic(
                "project",
                "project/{project.id}/tender_recommendation/{uriArgs.id}",
                [],
                "data",
                postProcessor: function ($res, $a) {
                    $trShape = [];
                    if ($res) {
                        $dataShape = $res->getCollection("data")->first();
                        $trShape = $dataShape->toArray();
                    }

                    if (empty($trShape)) {
                        throw new MiddlewareException("TenderRecommendationInvalidField", "TenderRecommendationFetchFailed: 'data' missing or invalid");
                    }

                    // Collect IDs
                    $transactionIds = [$trShape['transaction_id']];

                    $a->set("author_ids", [$trShape['author_id']]);

                    // Fetch transactions
                    if (!empty($transactionIds)) {
                        $transactions = Rest::fetchDynamic(
                            "project",
                            "transaction/transactions/" . implode(",", $transactionIds),
                            [],
                            "transactions"
                        );
                        $transactions($a);

                        $transactionsShape = $a->get("transactions");
                        $transactionsArr   = $transactionsShape
                            ? $transactionsShape->toArray()
                            : $transactionsShape;

                        $subcontractorIds = array_unique(array_column($transactionsArr ?? [], "subcontractor_id"));
                        $a->set("subcontractor_ids", $subcontractorIds);

                        AccountMiddleware::loadAccountsByIdArray("subcontractor_ids")($a);
                    }

                    // Load authors
                    UserMiddleware::loadUsersByIdArray("author_ids")($a);

                    // Save final tender array
                    $a->set("data", $trShape);
                }
            ),
            Rest::fetchDynamic(
                "account",
                "trade_category",
                [],
                "tc_data",
            ),
            function($a){
                $item = $a->get("data");
                $packages = $a->get("tc_data")->get();
                $packages_groups = [];
                if(is_array($packages)) {
                    foreach ($packages as $package) {
                        if(isset($package['trades']) && is_array($package['trades'])) {
                            foreach ($package['trades'] as $trade) {
                            $packages_groups[$trade] = $package['label'];
                            }
                        }
                    }
                }

                $account = $a->get("accounts") ?? [];
                $account = array_shift($account);
                $users = $a->get("users") ?? [];

                // Resolve author safely
                $author = array_shift($users);

                $responseData = [
                    "tender_recommendation_id" => $item["id"],
                    "package_id" => $item["tender_id"],
                    "package_name" => $item["tender_label"],
                    "trade_category" => $packages_groups[$item["tender_label"]],
                    "subcontractor" => $account ? [
                        "id" => $account["id"],
                        "name" => $account["name"],
                    ] : null,
                    "submitted_by" => $author ? [
                        "id" => $author["id"],
                        "display_name" => $author["display_name"] ?: $author["firstname"] . ' ' . $author["lastname"],
                    ] : null,
                    "status" => $item["status"],
                    "updated_at" => $item["updated_at"],
                    "subcontractor_user_id" => $item["subcontractor_user_id"],
                    "created_at" => $item["created_at"],
                    "final_comment" => $item["final_comment"],
                    "exec_summary" => $item["exec_summary"],
                    "transaction_id" => $item["transaction_id"],
                ];
                $a->set("data", $responseData);
            },
            Generic::set("json", function ($a) {
                return json_encode([$a->get('data')]);
            }),
        ]
    ],
    [
        "id" => "tender_recommendation_create",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/create$",
        "method" => "POST",
        "description" => "Create a new tender recommendation",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("validateUniqueTenderRecommendation"),
            Generic::set("payload", function ($a) {
                $request = $a->getRoute()->getRequest();
                $json = $request->getData()->getShape('json');

                if (!$json instanceof Shape) {
                    $json = new Shape($json ?? []);
                }

                $user = $a->get("user");
                $project = $a->get("project");

                $json->set("author_id", $user["id"] ?? null);
                $json->set("project_id", $project ? $project->get("id") : null);

                return $json;
            }),
            Rest::write(
                "project",
                "project/{project.id}/tender_recommendation/create",
                function ($payload, $a) {
                    $payload = $a->get("payload");
                    return $payload;
                },
                'payload',
                function($res, $action, $data) {
                    $tr_id = $data->get('data.id');
                    $action->set('tr_id', $tr_id);

                    $action->set('logData', [
                    'user_id'     => $action->get('user.id'),
                    'entity_id'   => $tr_id,
                    'entity_type' => 'tender_recommendation',
                    'type'        => 'Recommendation Created',
                    'meta'        => json_encode([
                        'message' => 'Tender recommendation created successfully',
                        'user'    => $action->get('user.display_name') ?: $action->get('user.firstname') . ' ' . $action->get('user.lastname'),
                    ]),
                ]);

                LogsMiddleware::createLogs('logData')($action);

                // start the "Tender Recommendation" milestone
                MilestoneMiddleware::milestoneInProgress('payload.tender_id', 'Tender Recommendation Approval')($action);

                }
            ),
            Generic::set("json", function ($a) {
                return json_encode([
                    "id" => $a->get('tr_id')]);
            }),
        ],
    ],
    [
        "id" => "tender_recommendation_update",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)$",
        "method" => "PATCH",
        "description" => "Update an existing tender recommendation",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            Generic::set("payload", function ($a) {
                $tenderRec = $a->get('tender_recommendation')->toArray();
                $a->set("tender_recommendation", array_shift($tenderRec));
                $request = $a->getRoute()->getRequest();
                $json = $request->getData()->getShape('json');
                return new Shape($json);
            }),
            Rest::update(
                "project",
                "project/{uriArgs.project_id}/tender_recommendation/{uriArgs.id}",
                "payload"
            ),
            function($a) {
                $a->set('approval_workflow_entity', [
                    'entity_type' => 'tender_recommendation',
                    'entity_id' => $a->get('uriArgs.id'),
                ]);
            },
            Conditional::switched("payload.status", [
                Rest::fetchDynamic(
                    "project",
                    "transaction/{tender_recommendation.transaction_id}",
                    [],
                    "transactions"
                ),
                function ($a) {
                    $transactions = $a->get('transactions')->toArray();
                    $a->set('subcontractor_ids', [array_shift($transactions)['subcontractor_id']]);
                    AccountMiddleware::loadAccountsByIdArray("subcontractor_ids")($a);
                    $subcontractors = $a->get('accounts');
                    $subcontractor = array_shift($subcontractors);
                    $redirectUrl = sprintf("project/%s/tender_recommendations?tender_recommendation_id=%s", $a->get('project.slug'), $a->get('uriArgs.id'));
                    $tenderId = $a->get('tender_recommendation.tender_id');
                    $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                        return isset($item['id']) && $item['id'] == $tenderId;
                    });
                    $packageName = current($matched)['label'] ?? '';

                    $dateTime = EmailTenderRecommendationMiddleware::getUKDateTime();

                    $emailPayload = [
                        'qsFullName'        => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        'packageName'       => $packageName,
                        'projectName'       => $a->get('project.name', ''),
                        'redirectUrl'       => $redirectUrl,
                        'email'             => $a->get('user.email'),
                        'user_id'           => $a->get('user.id'),
                        'subcontractorName' => $subcontractor['name'],
                        'dateTime'          => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time'])
                    ];
                    $a->set('payload', new Shape($emailPayload));

                    $a->set('logData', [
                        'user_id'     => $a->get('user.id'),
                        'entity_id'   => $a->get('uriArgs.id'),
                        'entity_type' => 'tender_recommendation',
                        'type'        => 'Recommendation Cancelled',
                        'meta'        => json_encode([
                            'message'   => sprintf(
                                "Tender Recommendation has been cancelled by %s.",
                                $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname')
                            ),
                            'user' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        ]),
                    ]);
                    LogsMiddleware::createLogs('logData')($a);
                    EmailTenderRecommendationMiddleware::sendTenderRecommendationEmail(template:'tr_cancel')($a);
                    $a->set('logData', [
                        'user_id'     => $a->get('user.id'),
                        'entity_id'   => $a->get('uriArgs.id'),
                        'entity_type' => 'tender_recommendation',
                        'type'        => 'Cancellation Notification Sent To Subcontractor',
                        'meta'        => json_encode([
                            'message'   => "Cancellation notification email sent to subcontractor.",
                            'user' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        ]),
                    ]);
                    LogsMiddleware::createLogs('logData')($a);
                },
                ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity(),
                ApprovalMiddleware::fetchApprovalsList(),
                function ($a) {
                    if($a->getCollection('approval_workflows')->count() > 0) {
                        // fetch users to notify based on active/completed approval levels
                        $approvalLevelWorkflowIds = $a->getCollection('approval_workflows')
                        ->filterByExistInArray('status', ['in_progress', 'completed'])
                        ->getIds();

                        $approvalUserIds = $a->getCollection('approvals')->filterByExistInArray('approval_level_workflow_id', $approvalLevelWorkflowIds)->values('user_id', true);

                        ApprovalMiddleware::removeApprovalLevelWorkflowByEntity()($a);
                    } else {
                        $approvals = $a->get('approvals')->toArray();
                        $approvalUserIds = array_column($approvals, "user_id");
                    }

                    $a->set('approver_user_ids', $approvalUserIds);
                },
                ApprovalMiddleware::removeApprovalsByEntity(),
                UserMiddleware::loadUsersByIdArray("approver_user_ids"),
                function($a) {
                    $subcontractors = $a->get('accounts');
                    $subcontractor = array_shift($subcontractors);
                    $users = $a->get('users');
                    $tenderId = $a->get('tender_recommendation.tender_id');
                    $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                        return isset($item['id']) && $item['id'] == $tenderId;
                    });
                    $packageName = current($matched)['label'] ?? '';
                    $redirectUrl = sprintf("project/%s/tender_recommendations?tender_recommendation_id=%s", $a->get('project.slug'), $a->get('uriArgs.tr_id'));

                    $dateTime = EmailTenderRecommendationMiddleware::getUKDateTime();
                    $email_data = [];
                    foreach ($users as $user) {
                        $email_data[] = [
                            'template' => 'TR Cancelled Approver',
                            'app' => 'clink',
                            'email' => $user['email'],
                            'user_id' => $user['id'],
                            'body' => [
                                'approverName' => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                                'qsFullName' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                                'packageName' => $packageName,
                                'projectName' => $a->get('project.name', ''),
                                'subcontractorName' => $subcontractor['name'],
                                "dateTime" => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                'url' => $redirectUrl
                            ]
                        ];
                    }

                    $queueData[] = [
                        'type' => 'tender_recommendation',
                        'uid' => $a->get('user.id'),
                        'email_data' => $email_data,
                        'time' => time()
                    ];
                    $a->set('queueData', $queueData);
                },
                SqsMiddleware::writeAll("queueData", $emailQueue),
                function($a) {
                    $a->set('logData', [
                        'user_id'     => $a->get('user.id'),
                        'entity_id'   => $a->get('uriArgs.id'),
                        'entity_type' => 'tender_recommendation',
                        'type'        => 'Cancellation Notification Sent To Approvers',
                        'meta'        => json_encode([
                            'message' => sprintf(
                                "Cancellation notification email sent to approver(s) %s.",
                                isset($users) ? implode(', ', array_column($users, 'display_name')) : '',
                            ),
                            'user' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        ]),
                    ]);
                    LogsMiddleware::createLogs('logData')($a);
                }
            ], [
                Conditional::switched("payload.status", [
                    ApprovalMiddleware::removeApprovalLevelWorkflowByEntity(),
                    ApprovalMiddleware::removeApprovalsByEntity(),
                    function($a)    {
                        $a->set('logData', [
                            'user_id'     => $a->get('user.id'),
                            'entity_id'   => $a->get('uriArgs.id'),
                            'entity_type' => 'tender_recommendation',
                            'type'        => 'Rejection Acknowledged',
                            'meta'        => json_encode([
                                'message'   => sprintf(
                                    "Tender Recommendation has been acknowledged by %s.",
                                    $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname')
                                ),
                                'user' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        ]),
                    ]);
                    LogsMiddleware::createLogs('logData')($a);
                    }
                ], [], "Draft"),
            ], "Cancelled"),
            Generic::set("json", fn() => json_encode(["success" => true])),
        ],
    ],
    [
        "id" => "tender_recommendation_delete",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)$",
        "method" => "DELETE",
        "description" => "Delete a tender recommendation",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Rest::delete(
                "project",
                "project/{uriArgs.project_id}/tender_recommendation/{uriArgs.id}"
            ),
            Generic::set("json", fn() => json_encode(["success" => true])),
        ],
    ],
    [
        "id" => "tender_recommendation_save_as_draft",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/save_as_draft$",
        "method" => "PATCH",
        "description" => "Save a tender recommendation as draft",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            Generic::set("payload", function ($a) {
                $request = $a->getRoute()->getRequest();
                $json = $request->getData()->getShape('json');
                $payload = new Shape($json);
                $allowedFields = ["exec_summary", "subcontractor_user_id", "final_comment", "forecasts"];
                $payloadArray = $payload->toArray();

                foreach (array_keys($payloadArray) as $key) {
                    if (!in_array($key, $allowedFields)) {
                        throw new MiddlewareException("TenderRecommendationInvalidField", "Invalid field provided: $key");
                    }
                }

                if ($payload->get("forecasts") !== null) {
                    $forecasts = $payload->get("forecasts");
                    if (!is_array($forecasts) || empty($forecasts)) {
                        throw new MiddlewareException("TenderRecommendationInvalidField", "Field 'forecasts' must be a non-empty array");
                    }
                    foreach ($forecasts as $f) {
                        if (!isset($f["transaction_id"]) || !isset($f["forecast"]) || !is_numeric($f["forecast"])) {
                            throw new MiddlewareException("TenderRecommendationInvalidField", "Each must have numeric value 'forecast' and 'transaction_id'");
                        }
                    }
                }

                return $payload;
            }),

            function ($a) {
                Rest::update(
                    "project",
                    "project/{uriArgs.project_id}/tender_recommendation/{uriArgs.id}/save_as_draft",
                    "payload"
                )($a);

                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.id'),
                    'entity_type' => 'tender_recommendation',
                    'type'        => 'Edit Recommendation',
                    'meta'        => json_encode([
                        'message' => 'Tender recommendation saved as draft',
                        'user'    => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                    ]),
                ]);

                LogsMiddleware::createLogs('logData')($a);

                $a->set("json", json_encode([
                    "success" => true,
                    "message" => "Tender Recommendation has been updated successfully"
                ]));
            },
        ],
    ],
    [
        "id" => "tender_recommendation_pricing_summary_list",
        "key" => "^(?<project_id>[0-9]+)\/package\/(?<package_id>[0-9]+)\/quotes$",
        "method" => "GET",
        "description" => "Fetch pricing summary quotes per package within a project",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Rest::fetchDynamic(
                "project",
                "project/{uriArgs.project_id}/package/{uriArgs.package_id}/quotes",
                [],
                "data",
                postProcessor: function ($res, $a) {
                    if (!$res) {
                        throw new MiddlewareException("PricingSummaryFetchFailed", "Failed to fetch pricing summary data");
                    }

                    $shape = $res->getShape("data");
                    $data = $shape ? $shape->toArray() : [];

                    if (!is_array($data) || (isset($data['transaction_id']) && !isset($data[0]))) {
                        $data = [$data];
                    }

                    // collect subcontractor IDs
                    $subcontractorIds = array_unique(array_filter(array_column($data, "subcontractor_id")));
                    $a->set("subcontractor_ids", $subcontractorIds);

                    // preload subcontractor accounts
                    if (!empty($subcontractorIds)) {
                        AccountMiddleware::loadAccountsByIdArray("subcontractor_ids")($a);
                    }

                    $a->set("data", $data);
                }
            ),

            Collection::format(function ($item, $a) {
                $accounts = $a->get("accounts") ?? [];

                // Collecting subcontractor data
                $subcontractor = null;
                foreach ($accounts as $acc) {
                    $accId = is_object($acc) ? $acc->get("id") : ($acc["id"] ?? null);
                    if ($accId == $item->get("subcontractor_id")) {
                        $subcontractor = $acc;
                        break;
                    }
                }

                return [
                    "transaction_id"   => $item->get("transaction_id"),
                    "subcontractor"    => $subcontractor ? [
                        "id"   => is_object($subcontractor) ? $subcontractor->get("id") : ($subcontractor["id"] ?? null),
                        "name" => is_object($subcontractor) ? $subcontractor->get("name") : ($subcontractor["name"] ?? null),
                    ] : null,
                    "package_name"     => $item->get("package_name"),
                    "quoted_price"     => $item->get("quoted_price") / 100,
                    "forecast"         => $item->get("forecast") / 100,
                    "note"             => $item->get("note"),
                    "budget"           => $item->get("package_budget") / 100,
                    "created_at"       => $item->get("created_at"),
                    "updated_at"       => $item->get("updated_at"),
                ];
            }, "data"),
        ]
    ],
    [
        "id" => "tender_recommendation_pricing_summary_update",
        "key" => "^(?<project_id>[0-9]+)\/package\/(?<package_id>[0-9]+)\/quote\/(?<transaction_id>[0-9]+)$",
        "method" => "PATCH",
        "description" => "Update forecast and note for a quote in tender pricing summary",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Generic::set("payload", function ($a) {
                $request = $a->getRoute()->getRequest();
                $json = $request->getData()->getShape("json");

                if (!$json instanceof \Core\Data\Shape) {
                    $json = new \Core\Data\Shape($json ?? []);
                }

                $payload = new \Core\Data\Shape([
                    "forecast" => $json->get("forecast") * 100,
                    "note"     => $json->get("note"),
                ]);

                $a->set("payload", $payload);
                return $payload;

            }),
            Rest::update(
                "project",
                "project/{uriArgs.project_id}/package/{uriArgs.package_id}/quote/{uriArgs.transaction_id}",
                "payload"
            ),

            Generic::set("json", function ($a) {
                $payload = $a->get("payload");
                $data = $payload ? $payload->toArray() : [];
                return json_encode([
                    "success" => true,
                    "data" => $data
                ]);
            }),
        ],
    ],
    [

        "id" => "tender_recommendation_report_generate",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/report\/generate$",
        "method" => "POST",
        "description" => "Generate or update Tender Recommendation Report PDF",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            TenderRecommendationPdfMiddleware::setOptions(),
            TenderRecommendationPdfMiddleware::generateReport(),
            TenderRecommendationPdfMiddleware::uploadToS3(),
            TenderRecommendationPdfMiddleware::cleanTmpFile(),
            function ($a) {
                // fetch assigned approvers
                $a->set('approval_workflow_entity', [
                    'entity_type' => 'tender_recommendation',
                    'entity_id' => $a->get('uriArgs.id'),
                ]);
                ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity()($a);
                ApprovalMiddleware::fetchApprovalsList()($a);

                if ($a->getCollection('approval_workflows')->count() > 0) {
                    // fetch users to notify based on active/completed approval levels
                    $approvalLevelWorkflowIds = $a->getCollection('approval_workflows')
                        ->filterByField('status', 'in_progress')
                        ->getIds();

                    $approvalUserIds = $a->getCollection('approvals')->filterByExistInArray('approval_level_workflow_id', $approvalLevelWorkflowIds)->values('user_id', true);
                } else {
                    $approvals = $a->get('approvals')->toArray();
                    $approvalUserIds = array_column($approvals, "user_id");
                }

                $a->set('isApprover', in_array($a->get('user.id'), $approvalUserIds));
            },
            TenderRecommendationPdfMiddleware::respondWithS3Url(),
        ],
    ],
    [
        "id" => "tender_recommendation_report_get",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/report\/pdf$",
        "method" => "GET",
        "description" => "Return existing PDF URL or generate new one if not found",
        "response_keys" => "data",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            // TODO: Implement check if PDF exists in S3, if not generate new one
            // For now - always generate new PDF
            TenderRecommendationPdfMiddleware::setOptions(),
            TenderRecommendationPdfMiddleware::generateReport(),
            TenderRecommendationPdfMiddleware::uploadToS3(),
            TenderRecommendationPdfMiddleware::cleanTmpFile(),
            TenderRecommendationPdfMiddleware::respondWithS3Url(),
            // Set the response data in the correct format
            function ($a) {
                $json = $a->get('json');
                if ($json) {
                    $data = json_decode($json, true);
                    $a->set('data', $data);
                }
            },
        ],
    ],
    [
        "id" => "tender_recommendation_report_preview",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/report\/preview$",
        "method" => "GET",
        "description" => "Preview Tender Recommendation Report PDF directly in browser (Development)",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            TenderRecommendationPdfMiddleware::setOptions(),
            TenderRecommendationPdfMiddleware::outputPdfDirectly(),
        ],
    ],
    [
        "id" => "tender_recommendation_approvers",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<tr_id>[0-9]+)\/approvers$",
        "method" => "GET",
        "description" => "Get list of approvers for a tender recommendation",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            function($a){
                $res = Manager::getService("account")->fetch(sprintf("approvals/%s/trapprovers", $a->get('user.account_id')), [
                    "user_id" => $a->get("user.id")
                ])->getShape("data")->get();
                $data['entity_type'] = 'tender_recommendation';
                $data['entity_id'] = $a->get('uriArgs.tr_id');
                $assignedApprovers = Manager::getService("project")->fetch("approvals", $data)->getShape("data")->toArray();

                // Extract all assigned user IDs
                $assignedUserIds = array_column($assignedApprovers, 'user_id');

                // Add "assigned" key to each user in finalData
                $finalData = array_map(function($user) use ($assignedUserIds) {
                    $user['assigned'] = in_array($user['id'], $assignedUserIds);
                    return $user;
                }, $res);
                $a->set("data", $finalData);
            },
            Generic::set("json", fn($a) => json_encode($a->get("data"))),
        ],
    ],
    [
        "id" => "tender_recommendation_approvals",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<tr_id>[0-9]+)\/approvals$",
        "method" => "POST",
        "description" => "Assign approver/s to a tender recommendation",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationOwnershipById"),
            function($a) use ($convertToUKTime) {
                $request = $a->getRoute()->getRequest();
                $requestData = $request->getData()->getShape('json')->toArray();
                $data['approvers'] = $requestData;
                $data['entity_type'] = 'tender_recommendation';
                $data['entity_id'] = $a->get('uriArgs.tr_id');
                $data['status'] = 'Pending';
                $a->set('payload', new Shape($data));
                $a->set('tender_id', $a->get('tender_recommendation.tender_id'));
                $checkApprovalAssignee = Manager::getService("project")->fetch("approvals", $data)->getShape("data")->count();

                if ($checkApprovalAssignee > 0) {
                    throw new MiddlewareException("TenderRecommendationApproversAlreadyExists", 'Approval already assigned to one or more users');
                };
                $tenderInfo = Manager::getService("project")->fetch(sprintf("tender/%s",$a->get('tender_recommendation.tender_id')))->getShape("data")->get();
                $approvalLevelIds = array_unique(array_column($data["approvers"], 'approval_level_id'));
                $approversIds = array_unique(array_column($data['approvers'], 'user_id'));
                $a->set('log_user_ids', $approversIds);
                UserMiddleware::loadUsersByIdArray("log_user_ids")($a);
                $userMap = [];
                foreach ($a->get('users') as $user) {
                    $userMap[$user['id']] = $user;
                }
                $role_based_users = [];
                foreach ($data['approvers'] as $item) {
                    $userId = $item['user_id'];
                    $levelId = $item['approval_level_id'];
                    if (isset($userMap[$userId])) {
                        $user = array_merge(
                            [
                                'id' => $userId,
                                'user_id' => $userId,
                                'type' => ApprovalSatisfactionHelper::approverEntryType($item),
                                'user' => $userMap[$userId]['display_name'] ?: $userMap[$userId]['firstname'] . ' ' . $userMap[$userId]['lastname'],
                                'timestamp' => $convertToUKTime(date('Y-m-d H:i:s')),
                                'comment' => '',
                            ],
                            ApprovalSatisfactionHelper::approverLogFlags($item)
                        );
                        $role_based_users[$levelId][] = $user;
                    }
                }
                $configurations = Manager::getService("project")->fetch(sprintf("approval-workflow-configurations/%d/type/tender_recommendation", $a->get('user.account_id')))->getShape('data')->get();
                $approvalLevels = ApprovalMiddleware::mapApprovalLevelsById(
                    is_array($configurations) ? $configurations : [],
                    array_map('intval', $approvalLevelIds)
                );
                $transaction = Manager::getService("project")
                    ->fetch(sprintf("transaction/%s", $a->get('tender_recommendation.transaction_id')))
                    ->getShape('data')
                    ->toArray();
                $orderValue = count($transaction) > 0 && isset($transaction[0]['price']) ? (int) $transaction[0]['price'] : null;
                $approvalLevels = ApprovalMiddleware::mergeThresholdRoles(
                    $approvalLevels,
                    'tender_recommendation',
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
                $log_data = [];
                $c = 0;
                $inProgressAssigned = false;
                $allLevelsCompleted = $sortedApprovalLevelIds !== [];
                foreach ($sortedApprovalLevelIds as $id) {
                    $levelRows = array_filter(
                        $data['approvers'],
                        static fn ($row) => (int) ($row['approval_level_id'] ?? 0) === (int) $id
                    );
                    $isLevelSatisfied = ApprovalSatisfactionHelper::isLevelSatisfiedFromRows($levelRows);
                    $workflowStatus = ApprovalSatisfactionHelper::resolveWorkflowStatus($isLevelSatisfied, $inProgressAssigned);
                    if ($workflowStatus !== 'completed') {
                        $allLevelsCompleted = false;
                    }
                    $levelMeta = is_array($approvalLevels[$id] ?? null) ? $approvalLevels[$id] : [];
                    $approvalWorkflowPayload[] = [
                        'approval_level_id' => $id,
                        'entity_type' => 'tender_recommendation',
                        'entity_id' => $a->get('uriArgs.tr_id'),
                        'status' => $workflowStatus,
                        'sort_order' => $approvalLevels[$id]['sort_order'] ?? 0,
                        'meta' => json_encode(array_merge(
                            $levelMeta,
                            ApprovalSatisfactionHelper::buildLevelMetaFlagsFromRows($levelRows),
                            ['consolidate_notifications' => !empty($configurations['consolidate_notifications'])]
                        )),
                    ];
                    $log_data['levels'][$c]['approval_level_id'] = $id;
                    $log_data['levels'][$c]['level'] = $approvalLevels[$id]['sort_order'] ?? 0;
                    $log_data['levels'][$c]['status'] = $workflowStatus;
                    $log_data['levels'][$c] = array_merge(
                        $log_data['levels'][$c],
                        ApprovalSatisfactionHelper::levelLogFlags(
                            ApprovalSatisfactionHelper::buildLevelMetaFlagsFromRows($levelRows)
                        )
                    );
                    switch ($approvalLevels[$id]['rule_type']) {
                        case 'all':
                            $log_data['levels'][$c]['rule'] = "All must approve";
                            break;
                        case 'any':
                            $log_data['levels'][$c]['rule'] = "Anyone can approve";
                            break;
                        case 'custom':
                            $log_data['levels'][$c]['rule'] = "Any {$approvalLevels[$id]['min_required']} from " . count($approvalLevels[$id]['roles']) . " must approve";
                            break;
                        default:
                            $log_data['levels'][$c]['rule'] = "Unknown";
                    }
                    if(array_key_exists($id, $role_based_users))
                    {

                        $log_data['levels'][$c]['entries'] = $role_based_users[$id];
                    }
                    $c++;
                }
                $a->set("approval_workflow_payload", $approvalWorkflowPayload);
                $a->set('assign_approval_complete', $allLevelsCompleted);

                $existingLogs = Manager::getService("project")
                    ->fetch("logs", ['entity_type' => 'tender_recommendation', 'entity_id' => $a->get('uriArgs.tr_id')])
                    ->getShape("data")
                    ->get();

                $approvalLogs = array_filter($existingLogs, function ($log) {
                    return $log['type'] === 'Sent For Approval';
                });

                $instance = count($approvalLogs) + 1;
                $approvalAssign = [
                    "type"            => "approval_request",
                    "instance"        => $instance,
                    "heading"         => "Approval Request #" . $instance,
                    "label"           => "Sent For Approval",
                    "status"          => "pending",
                    "user_id"         => $a->get('user.id'),
                    "user"            => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                    "timestamp"       => date("Y-m-d H:i:s"),
                    "tr_id"           => $a->get('uriArgs.tr_id'),
                    "package_name"    => $tenderInfo[$a->get('tender_recommendation.tender_id')]['label'],
                    "levels"           => $log_data['levels']
                ];

                $log_data = [
                    "approver_assign" => $approvalAssign,
                ];
                $a->set('log_data', json_encode($log_data));
                $notifyLevelId = (int) min($approvalLevelIds);
                foreach ($a->get('approval_workflow_payload') ?? [] as $workflowRow) {
                    if (($workflowRow['status'] ?? '') === 'in_progress') {
                        $notifyLevelId = (int) ($workflowRow['approval_level_id'] ?? $notifyLevelId);
                        break;
                    }
                }

                foreach ($data['approvers'] as $approver) {
                    if (!isset($approver['user_id']) || !is_numeric($approver['user_id'])) {
                        throw new MiddlewareException("TenderRecommendationInvalidApprover", "Each approver must have a numeric 'user_id'");
                    }
                }
                $notifyUserIds = [];
                foreach ($data['approvers'] as $approver) {
                    if ((int) $approver['approval_level_id'] !== $notifyLevelId
                        || !ApprovalSatisfactionHelper::shouldNotifyApprover($approver)) {
                        continue;
                    }
                    $notifyUserIds[(int) $approver['user_id']] = (int) $approver['user_id'];
                }
                $a->set('user_ids', array_values($notifyUserIds));
            },
            ApprovalMiddleware::saveApprovalLevelWorkflow('approval_workflow_payload'),
            function($a){
                $approverData = $a->get('payload.approvers');
                $approvalLevelWorkflowIds = $a->get('save_approval_level_workflow_response')['data'];
                $userData = [];
                foreach ($approverData as $value) {
                    $approvalLevelWorkflowId = array_filter($approvalLevelWorkflowIds, function($item) use ($value){
                        return $item['approval_level_id'] === $value['approval_level_id'];
                    });

                    $approvalLevelWorkflowId = reset($approvalLevelWorkflowId);
                    $userData[] = array_merge(
                        [
                            'user_id' => $value['user_id'],
                            'approval_level_workflow_id' => $approvalLevelWorkflowId['approval_level_workflow_id'],
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
                    return $payload;
                },
                'payload'
            ),
            TenderRecommendationMiddleware::updateTenderRecommendation(resultKey: "tender_recommendation_data"
            ),
            UserMiddleware::loadUsersByIdArray("user_ids"),
            function($a) {
                $users = $a->get('users') ?? [];
                if ($users === []) {
                    return;
                }
                $tenderId = $a->get('tender_id');
                $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                    return isset($item['id']) && $item['id'] == $tenderId;
                });
                $packageName = current($matched)['label'] ?? '';
                $projectName = $a->get('project.name');
                $redirectUrl = sprintf("project/%s/tender_recommendations?tender_recommendation_id=%s", $a->get('project.slug'), $a->get('uriArgs.tr_id'));

                $dateTime = EmailTenderRecommendationMiddleware::getUKDateTime();
                $email_data = [];
                foreach ($users as $user) {
                    $email_data[] = [
                        'template' => 'TR Assign Approver',
                        'app' => 'clink',
                        'email' => $user['email'],
                        'user_id' => $user['id'],
                        'body' => [
                            'approverName' => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                            'qsFullName' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                            'packageName' => $packageName,
                            'projectName' => $projectName,
                            'dateTime' => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                            'url' => $redirectUrl
                        ]
                    ];

                    // Notify this approver a tender recommendation needs their approval — additive to the queued email above.
                    $a->set('notification_payload', [
                        'account_id' => (int) ($user['account_id'] ?? $a->get('user.account_id')),
                        'receiver_user_id' => (int) $user['id'],
                        'project_id' => $a->get('project.id'),
                        'type' => 'approval_required',
                        'title' => 'Tender recommendation requires your approval',
                        'message' => NotificationMiddleware::buildContextLine([
                            ['label' => 'Project', 'value' => $projectName],
                            ['label' => 'Package Name', 'value' => $packageName],
                            ['label' => 'By', 'value' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname')],
                        ]),
                        'target_type' => 'tender_recommendation',
                        'target_id' => (int) $a->get('uriArgs.tr_id'),
                        'target_url' => 'main-contractor/' . $redirectUrl,
                    ]);
                    NotificationMiddleware::createSilently()($a);
                }

                $email_data[] = [
                    'template' => 'TR Assign Approver Requester',
                    'app' => 'clink',
                    'email' => $a->get('user.email'),
                    'user_id' => $a->get('user.id'),
                    'body' => [
                        'approverName' => isset($users) ? implode(', ', array_column($users, 'display_name')) : '',
                        'qsFullName' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        'packageName' => $packageName,
                        'projectName' => $projectName,
                        'dateTime' => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                        'url' => urlencode($redirectUrl . "&scroll=true")
                    ]
                ];

                $queueData[] = [
                    'type' => 'tender_recommendation',
                    'uid' => $a->get('user.id'),
                    'email_data' => $email_data,
                    'time' => time()
                ];
                $a->set('queueData', $queueData);
            },
            SqsMiddleware::writeAll("queueData", $emailQueue),
            function ($a) {
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.tr_id'),
                    'entity_type' => 'tender_recommendation',
                    'type'        => 'Sent For Approval',
                    'meta'        => $a->get('log_data')
                ]);
            },
            LogsMiddleware::createLogs('logData'),
            function ($a) {
                if (!$a->get('assign_approval_complete')) {
                    return;
                }

                $requesterId = (int) $a->get('tender_recommendation.author_id');
                $requesterData = Manager::getService("account")
                    ->fetch("user/search", ['field' => 'id', 'value' => $requesterId])
                    ->getShape('data')
                    ->get();

                $tenderId = $a->get('tender_id');
                $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                    return isset($item['id']) && $item['id'] == $tenderId;
                });
                $packageName = current($matched)['label'] ?? '';
                $projectName = $a->get('project.name');
                $redirectUrl = sprintf("project/%s/tender_recommendations?tender_recommendation_id=%s", $a->get('project.slug'), $a->get('uriArgs.tr_id'));

                $a->set('payload', new Shape([
                    'approverName' => $requesterData['display_name'] ?: $requesterData['firstname'] . ' ' . $requesterData['lastname'],
                    'qsFullName'   => $requesterData['display_name'] ?: $requesterData['firstname'] . ' ' . $requesterData['lastname'],
                    'packageName'  => $packageName,
                    'projectName'  => $projectName,
                    'redirectUrl'  => $redirectUrl,
                    'email'        => $requesterData['email'],
                    'user_id'      => $requesterData['id'],
                ]));
                EmailTenderRecommendationMiddleware::sendTenderRecommendationEmail(template: "tr_approved")($a);

                $a->set('payload', new Shape(['status' => 'Approved']));
                TenderRecommendationMiddleware::updateTenderRecommendation()($a);

                MilestoneMiddleware::milestoneComplete('tender_id', 'Tender Recommendation Approval')($a);
            },
            Generic::set("json", fn($a) => json_encode(["success" => true])),
        ],
    ],
    [
        "id" => "tender_recommendation_approval_withdraw",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<tr_id>[0-9]+)\/approvals\/withdraw$",
        "method" => "DELETE",
        "description" => "Remove approver to a tender recommendation",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationOwnershipById"),
            function($a){
                $a->set("payload", new Shape([
                    "status" => 'Draft'
                ]));
                $a->set('approval_workflow_entity', [
                    'entity_type' => 'tender_recommendation',
                    'entity_id' => $a->get('uriArgs.tr_id'),
                ]);
            },
            ApprovalMiddleware::fetchApprovalLevelWorkflowByEntity(),
            function ($a) {
                if($a->getCollection('approval_workflows')->count() > 0) {
                    $approvalWorkflowsNotCompletedCount = $a->getCollection('approval_workflows')
                        ->filterByExistInArray('status', ['in_progress', 'pending'])
                        ->count();

                    if($approvalWorkflowsNotCompletedCount === 0) {
                        throw new MiddlewareException("TenderRecommendationApprovalCompleted", "Request cannot be withdrawn as the approval process has already completed.");
                    } else {
                        ApprovalMiddleware::fetchApprovalsList()($a);

                        $approvalLevelWorkflowIds = $a->getCollection('approval_workflows')
                        ->filterByExistInArray('status', ['in_progress', 'completed'])
                        ->getIds();

                        $approvalUserIds = $a->getCollection('approvals')->filterByExistInArray('approval_level_workflow_id', $approvalLevelWorkflowIds)->values('user_id', true);
                        $a->set('approver_user_ids', $approvalUserIds);

                        ApprovalMiddleware::removeApprovalLevelWorkflowByEntity()($a);
                    }
                }
            },
            ApprovalMiddleware::removeApprovalsByEntity(),
            TenderRecommendationMiddleware::updateTenderRecommendation(resultKey: "tender_recommendation_response"),
            UserMiddleware::loadUsersByIdArray("approver_user_ids"),
            Rest::fetchDynamic(
                "project",
                "transaction/{tender_recommendation.transaction_id}",
                [],
                "transactions"
            ),
            function($a) {
                $transactions = $a->get('transactions')->toArray();
                $a->set('subcontractor_ids', [array_shift($transactions)['subcontractor_id']]);
                AccountMiddleware::loadAccountsByIdArray("subcontractor_ids")($a);
                $subcontractors = $a->get('accounts');
                $subcontractor = array_shift($subcontractors);
                $users = $a->get('users');
                $tenderId = $a->get('tender_recommendation.tender_id');

                $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                    return isset($item['id']) && $item['id'] == $tenderId;
                });
                $packageName = current($matched)['label'] ?? '';
                $redirectUrl = sprintf("project/%s/tender_recommendations?tender_recommendation_id=%s", $a->get('project.slug'), $a->get('uriArgs.tr_id'));

                $dateTime = EmailTenderRecommendationMiddleware::getUKDateTime();
                $email_data = [];
                foreach ($users as $user) {
                    $email_data[] = [
                        'template' => 'TR Request Withdrawn Approver',
                        'app' => 'clink',
                        'email' => $user['email'],
                        'user_id' => $user['id'],
                        'body' => [
                            'approverName' => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                            'qsFullName' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                            'packageName' => $packageName,
                            'projectName' => $a->get('project.name', ''),
                            'subcontractorName' => $subcontractor['name'],
                            "dateTime" => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                            'url' => $redirectUrl
                        ]
                    ];
                }

                $queueData[] = [
                    'type' => 'tender_recommendation',
                    'uid' => $a->get('user.id'),
                    'email_data' => $email_data,
                    'time' => time()
                ];
                $a->set('queueData', $queueData);
            },
            SqsMiddleware::writeAll("queueData", $emailQueue),
            function ($a) {
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.tr_id'),
                    'entity_type' => 'tender_recommendation',
                    'type'        => 'Withdraw Approval',
                    'meta'        => json_encode([
                        'message' => 'Approver(s) removed from tender recommendation',
                        'user'    => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                    ]),
                ]);
            },
            LogsMiddleware::createLogs('logData'),
            Generic::set("json", fn($a) => json_encode(["success" => true])),
        ],
    ],
    [
        "id" => "tender_recommendation_approval_update",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/approval\/(?<approver_id>[0-9]+)$",
        "method" => "PUT",
        "description" => "Approver action to a tender recommendation",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            Procedure::get("fetchAndValidateApprovalById"),
            function($a){
                $trData = $a->get('tender_recommendation')->toArray();
                $trData = array_shift($trData);
                $a->set('requester_ids', [$trData['author_id']]);
                $a->set('tender_recommendation', $trData);
                $a->set('tender_id', $a->get('tender_recommendation.tender_id'));
                $request = $a->getRoute()->getRequest();
                $json = $request->getData()->getShape('json');
                $data = [
                    "entity_type" => 'tender_recommendation',
                    "entity_id" => $a->get('uriArgs.id')
                ];
                $a->set('updateTRFlag', false);
                $checkApprovalAsignee = Manager::getService("project")->fetch("approvals", $data)->getShape("data");
                $checkApprovalAsigneeArray = $checkApprovalAsignee->toArray();
                $approval_level_workflow_id = $checkApprovalAsigneeArray[0]['approval_level_workflow_id'];
                $a->set('approval_level_workflow_id', $approval_level_workflow_id);
                $meta = [
                    'message' => "Tender Recommendation {$json->get('status')} by approver",
                    'comment' => $json->get('comment') ?? '',
                    'user'    => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                ];
                if($approval_level_workflow_id == '')
                {
                    $userIdToMatch = $a->int('user.id');
                    $matched = array_filter($checkApprovalAsigneeArray, function ($item) use ($userIdToMatch) {
                        return isset($item['user_id']) && $item['user_id'] == $userIdToMatch;
                    });
                    if (empty($matched)) {
                        throw new MiddlewareException("tenderRecommendationOwnershipError", "You don't have access to approve/reject this Tender Recommendation.");
                    } else {
                        $approval = array_shift($matched);
                        if ($approval['status']['label'] !== 'Pending') {
                            throw new MiddlewareException("ApprovalAssignFailed", "You have already submitted your approval decision for this Tender Recommendation.");
                        }
                    }
                    $a->set('updateTRFlag', true);
                }
                elseif($approval_level_workflow_id > 0)
                {
                    $status = $json->get('status');

                    $endpoint = sprintf(
                        "approval-workflow-process/%s/%d",
                        $data['entity_type'],
                        $data['entity_id']
                    );
                    $approvalWorkflow = Manager::getService("project")->fetch($endpoint)->getShape("data")->get();

                    $approvalWorkflowCurrent = array_filter($approvalWorkflow, function ($item) {
                        return isset($item['status']) && $item['status'] === 'in_progress';
                    });

                    if (!$approvalWorkflowCurrent)
                    {
                        throw new MiddlewareException("approvalLevelIdError", "Could not find Approval Level Id in progress.");
                    }

                    $approvalWorkflowCurrent = reset($approvalWorkflowCurrent);

                    UserMiddleware::loadUsersByIdArray("requester_ids", key:"requester_users")($a);
                    $users = $a->get('requester_users');
                    $user = array_shift($users);
                    $redirectUrl = sprintf("project/%s/tender_recommendations?tender_recommendation_id=%s", $a->get('project.slug'), $a->get('uriArgs.id'));
                    $tenderId = $a->get('tender_id');
                    $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                        return isset($item['id']) && $item['id'] == $tenderId;
                    });
                    $packageName = current($matched)['label'] ?? '';
                    $projectName = $a->get('project.name');

                    $emailPayload = [
                        'status'      => $status,
                        'approverName' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                        'qsFullName' => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                        'packageName' => $packageName,
                        'projectName' => $projectName,
                        'redirectUrl' => $redirectUrl,
                        'email' => $user['email'],
                        'user_id' => $user['id'],
                        'feedback' => $a->get('payload.comment'),
                    ];
                    $a->set('payload', new Shape($emailPayload));

                    $currUserId = $a->get('user.id');
                    $current_approval_level_workflow_id = $approvalWorkflowCurrent['id'];
                    $currLevelApprovals = array_filter($checkApprovalAsignee->toArray(), function ($item) use ($current_approval_level_workflow_id) {
                        return isset($item['approval_level_workflow_id']) && $item['approval_level_workflow_id'] == $current_approval_level_workflow_id;
                    });
                    $userExists = false;
                    foreach ($currLevelApprovals as $item) {
                        if (isset($item['user_id']) && ((int)$item['user_id'] === (int)$currUserId)) {
                            $userExists = true;
                            break;
                        }
                    }
                    if(!$userExists)
                    {
                        throw new MiddlewareException("tenderRecommendationOwnershipError", "You do not have the required role at the current in-progress approval level to approve or reject this tender recommendation.");
                    }

                    if($status == 'Approved')
                    {
                        $currWorkflowMeta = json_decode($approvalWorkflowCurrent['meta'], true);
                        $approvalWorkflowPending = array_values(array_filter(
                            $approvalWorkflow,
                            static fn ($item) => ($item['status'] ?? '') === 'pending'
                        ));
                        $levelComplete = ApprovalSatisfactionHelper::isLevelCompleteAfterUserApprove(
                            $currWorkflowMeta,
                            array_values($currLevelApprovals),
                            (int) $currUserId
                        );
                        $a->set('is_level_complete', $levelComplete);

                        if ($levelComplete) {
                            Manager::getService("project")->update(
                                sprintf("approval-workflow-process/workflow/%s", $approvalWorkflowCurrent['id']),
                                new Shape(['data' => ['status' => 'completed']])
                            );
                        }

                        $checkApprovalAsigneeArray = $checkApprovalAsignee->toArray();
                        $cascadePlan = ApprovalSatisfactionHelper::planCrossLevelCascadesIfEnabled(
                            $currWorkflowMeta,
                            $approvalWorkflowPending,
                            $checkApprovalAsigneeArray,
                            (int) $currUserId
                        );
                        $approvalWorkflowPending = ApprovalMiddleware::applyCrossLevelCascadePlan($cascadePlan);

                        if ($levelComplete && $approvalWorkflowPending === []) {
                            $a->set('is_approval_complete', true);
                            $a->set('updateTRFlag', true);
                            MilestoneMiddleware::milestoneComplete('tender_id', 'Tender Recommendation Approval')($a);
                            EmailTenderRecommendationMiddleware::sendTenderRecommendationEmail(template: "tr_approved")($a);
                            // Notify the requester their tender recommendation was approved — additive to the email above.
                            $a->set('notification_payload', [
                                'account_id' => (int) ($user['account_id'] ?? $a->get('user.account_id')),
                                'receiver_user_id' => (int) $user['id'],
                                'project_id' => $a->get('project.id'),
                                'type' => 'tender_recommendation_approved',
                                'title' => 'Your tender recommendation has been approved',
                                'message' => NotificationMiddleware::buildContextLine([
                                    ['label' => 'Project', 'value' => $projectName],
                                    ['label' => 'Package Name', 'value' => $packageName],
                                    ['label' => 'By', 'value' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname')],
                                ]),
                                'target_type' => 'tender_recommendation',
                                'target_id' => (int) $a->get('uriArgs.id'),
                                'target_url' => 'main-contractor/' . $redirectUrl,
                            ]);
                            NotificationMiddleware::createSilently()($a);
                        } elseif ($levelComplete) {
                            usort(
                                $approvalWorkflowPending,
                                static fn ($a, $b) => (int) ($a['sort_order'] ?? 0) <=> (int) ($b['sort_order'] ?? 0)
                            );
                            $nextWorkflow = $approvalWorkflowPending[0];
                            Manager::getService("project")->update(
                                sprintf("approval-workflow-process/workflow/%s", $nextWorkflow['id']),
                                new Shape(['data' => ['status' => 'in_progress']])
                            );

                            $cascadeActions = $cascadePlan['actions'] ?? [];
                            $nextLevelApprovers = array_filter(
                                $checkApprovalAsigneeArray,
                                static fn ($item) => (int) ($item['approval_level_workflow_id'] ?? 0) === (int) $nextWorkflow['id']
                                    && ApprovalSatisfactionHelper::shouldNotifyApprover($item, $cascadeActions)
                            );
                            if ($nextLevelApprovers) {
                                $a->set('user_ids', array_column($nextLevelApprovers, 'user_id'));
                                UserMiddleware::loadUsersByIdArray("user_ids", key:"approver_users")($a);

                                $users = $a->get('approver_users');
                                $requester_users = $a->get('requester_users');
                                $requester_user = array_shift($requester_users);
                                $dateTime = EmailTenderRecommendationMiddleware::getUKDateTime();

                                $email_data = [];
                                foreach ($users as $user) {
                                    $email_data[] = [
                                        'template' => 'TR Assign Approver',
                                        'app' => 'clink',
                                        'email' => $user['email'],
                                        'user_id' => $user['id'],
                                        'body' => [
                                            'approverName' => $user['display_name'] ?: $user['firstname'] . ' ' . $user['lastname'],
                                            'qsFullName' => $requester_user['display_name'] ?: $requester_user['firstname'] . ' ' . $requester_user['lastname'],
                                            'packageName' => $packageName,
                                            'projectName' => $projectName,
                                            'dateTime' => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                            'url' => $redirectUrl
                                        ]
                                    ];

                                    // Notify this next-level approver a tender recommendation needs their approval — additive to the queued email above.
                                    $a->set('notification_payload', [
                                        'account_id' => (int) ($user['account_id'] ?? 0),
                                        'receiver_user_id' => (int) $user['id'],
                                        'project_id' => $a->get('project.id'),
                                        'type' => 'approval_required',
                                        'title' => 'Tender recommendation requires your approval',
                                        'message' => NotificationMiddleware::buildContextLine([
                                            ['label' => 'Project', 'value' => $projectName],
                                            ['label' => 'Request Type', 'value' => $packageName],
                                            ['label' => 'By', 'value' => $requester_user['display_name'] ?: $requester_user['firstname'] . ' ' . $requester_user['lastname']],
                                        ]),
                                        'target_type' => 'tender_recommendation',
                                        'target_id' => (int) $a->get('uriArgs.id'),
                                        'target_url' => 'main-contractor/' . $redirectUrl,
                                    ]);
                                    NotificationMiddleware::createSilently()($a);
                                }

                                $queueData[] = [
                                    'type' => 'tender_recommendation',
                                    'uid' => $requester_user['id'],
                                    'email_data' => $email_data,
                                    'time' => time()
                                ];
                                $a->set('queueData', $queueData);
                            }
                        }
                    }

                    if($status == 'Rejected')
                    {
                        $payload = [
                            'status' => 'rejected',
                        ];
                        Manager::getService("project")->update(
                            sprintf("approval-workflow-process/workflow/%s", $approvalWorkflowCurrent['id']),
                            new Shape(['data' => $payload])
                        );
                        $a->set('updateTRFlag', true);

                        // send TR rejected email to requester
                        EmailTenderRecommendationMiddleware::sendTenderRecommendationEmail(template: "tr_rejected")($a);

                        // Notify the requester their tender recommendation was rejected — additive to the email above.
                        $a->set('notification_payload', [
                            'account_id' => (int) ($user['account_id'] ?? $a->get('user.account_id')),
                            'receiver_user_id' => (int) $user['id'],
                            'project_id' => $a->get('project.id'),
                            'type' => 'tender_recommendation_rejected',
                            'title' => 'Your tender recommendation has been rejected',
                            'message' => NotificationMiddleware::buildContextLine([
                                ['label' => 'Project', 'value' => $projectName],
                                ['label' => 'Package Name', 'value' => $packageName],
                                ['label' => 'By', 'value' => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname')],
                            ]),
                            'target_type' => 'tender_recommendation',
                            'target_id' => (int) $a->get('uriArgs.id'),
                            'target_url' => 'main-contractor/' . $redirectUrl,
                        ]);
                        NotificationMiddleware::createSilently()($a);
                    }
                    $currentWorkflowMeta = json_decode($approvalWorkflowCurrent['meta']);
                    $existingLogs = Manager::getService("project")
                        ->fetch("logs", ['entity_type' => 'tender_recommendation', 'entity_id' => $a->get('uriArgs.id')])
                        ->getShape("data")
                        ->get();

                    $approvalLogs = array_filter($existingLogs, function ($log) {
                        return $log['type'] === 'Sent For Approval';
                    });

                    $meta['approval_level_id'] = $currentWorkflowMeta->id;
                    $meta['instance'] = count($approvalLogs);

                }
                else
                {
                    throw new MiddlewareException("approvalLevelIdError", "Could not find Approval Level Id.");
                }
                $payload = $a->get('payload');
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.id'),
                    'entity_type' => 'tender_recommendation',
                    'type'        => $payload->get('status') ?? 'Pending',
                    'meta'        => json_encode($meta),
                ]);

                LogsMiddleware::createLogs('logData')($a);
                $a->set('payload', $json);
                $a->set('status', $json->get('status'));
            },
            SqsMiddleware::writeAll("queueData", $emailQueue),
            Rest::update(
                "project",
                "approvals/{uriArgs.approver_id}",
                "payload",
                postProcessor: function ($res, $a, $data) {
                    if (!empty($data->get('error'))) {
                        throw new MiddlewareException("ApprovalAssignFailed", $data->get('error.description'));
                    }
                }
            ),
            function($a)    {
                if($a->get('updateTRFlag'))
                {
                    $action = TenderRecommendationMiddleware::updateTenderRecommendation("uriArgs.id", "payload");
                    $action($a);
                }
            },
            Generic::set("json", fn($a) => json_encode(["success" => true])),
        ],
    ],
    [
        "id" => "tender_recommendation_approval_reminder",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<tr_id>[0-9]+)\/approvals\/(?<approval_id>[0-9]+)\/reminder$",
        "method" => "POST",
        "description" => "Reminder approver to approve a tender recommendation",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationOwnershipById"),
            function($a) {
                if ($a->get('tender_recommendation.status') !== 'Pending') {
                    throw new MiddlewareException("ReminderStatusError", "You can only send a reminder when the record status is Pending.");
                }
                $a->set('approval_workflow_entity', [
                    'entity_type' => 'tender_recommendation',
                    'entity_id' => $a->get('uriArgs.tr_id'),
                ]);
                ApprovalMiddleware::fetchApprovalsList()($a);
                $approvals = $a->getCollection('approvals')->filterByField('id', (int) $a->get('uriArgs.approval_id'))->first()->get();
                if(!$approvals) {
                    throw new MiddlewareException('ApprovalNotFound', 'No Approval Request found.');
                }

                if($approvals['status']['label'] !== 'Pending') {
                    throw new MiddlewareException('ApprovalNotFound', 'The user has already approved/rejected this request.');
                }

                $a->set('approval', $approvals);
                $a->set('approver_user_ids', [$approvals['user_id']]);

                $res = Manager::getService('account')->fetch('email/logs-by-entity', [
                    'entity_type' => 'tender_recommendation',
                    'entity_id' => $a->get('uriArgs.tr_id'),
                    'user_ids' => implode($a->get('approver_user_ids')),
                ])->getShape('data')->toArray();
                $a->set('email_logs', $res);
            },
            UserMiddleware::loadUsersByIdArray("approver_user_ids"),
            function($a) {
                $approval = $a->get('approval');
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

                $matchedUser = array_filter($a->get('users'), function ($item) use ($userId) {
                    return isset($item['id']) && $item['id'] == $userId;
                });
                $user = array_shift($matchedUser);

                $redirectUrl = sprintf("project/%s/tender_recommendations?tender_recommendation_id=%s", $a->get('project.slug'), $a->get('uriArgs.tr_id'));
                $tenderId = $a->get('tender_recommendation.tender_id');
                $matched = array_filter($a->get('project.tender'), function ($item) use ($tenderId) {
                    return isset($item['id']) && $item['id'] == $tenderId;
                });
                $packageName = current($matched)['label'] ?? '';
                $projectName = $a->get('project.name');

                $dateTime = EmailTenderRecommendationMiddleware::getUKDateTime($approval['created_at']);
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
                    'entityType' => 'tender_recommendation',
                    'entityId' => $a->get('uriArgs.tr_id'),
                ];
                $a->set('payload', new Shape($emailPayload));

                // Send email to Approver
                EmailTenderRecommendationMiddleware::sendTenderRecommendationEmail(template: "tr_reminder")($a);

                $emailPayload['email'] = $a->get('user.email');
                $emailPayload['user_id'] = $a->get('user.id');
                $a->set('payload', new Shape($emailPayload));

                // Send notification to Requester
                EmailTenderRecommendationMiddleware::sendTenderRecommendationEmail(template: "tr_reminder_requester")($a);
                // Reminder Log
                $payload = $a->get('payload');
                $requesterName = $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                $approverName  = $payload->get('approverName');
                $a->set('logData', [
                    'user_id'     => $a->get('user.id'),
                    'entity_id'   => $a->get('uriArgs.tr_id'),
                    'entity_type' => 'tender_recommendation',
                    'type'        => 'Reminder Sent',
                    'meta'        => json_encode([
                        'message' => sprintf(
                            "Tender Recommendation approval reminder has been sent by %s to %s.",
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
    [
        "id" => "tender_recommendation_logs",
        "key" => "^(?<project_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/logs$",
        "method" => "GET",
        "description" => "Get all logs for a specific tender recommendation",
        "response_keys" => "logs",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            function($a) use ($convertToUKTime) {
                $data = [
                    "entity_type" => 'tender_recommendation',
                    "entity_id"   => $a->get('uriArgs.id'),
                ];

                $tenderRec = $a->get('tender_recommendation')->toArray();
                $tenderRec = array_shift($tenderRec);
                $entityNo = $a->get('uriArgs.id');
                $packageName= $tenderRec['tender_label'];
                $logs['entity_no'] = $entityNo;
                $logs['package_name'] = $packageName;

                $logs['logs'] = Manager::getService("project")
                    ->fetch("logs", $data)
                    ->getShape("data")
                    ->toArray();

                $userIds = array_unique(array_column($logs['logs'], "user_id"));
                if (!empty($userIds)) {
                    $a->set("user_ids", $userIds);
                    UserMiddleware::loadUsersByIdArray("user_ids")($a);
                    $users = $a->get("users") ?? [];

                    $rejectedMeta = [];
                    $approvedMeta = [];

                    foreach ($logs['logs'] as $i => &$log) {
                        foreach ($users as $user) {
                            $uid = is_object($user) ? $user->get("id") : ($user["id"] ?? null);
                            if ($uid == $log["user_id"]) {
                                $log["user_name"] = is_object($user)
                                    ? ($user->get("display_name") ?: $user->get("firstname") . ' ' . $user->get("lastname"))
                                    : ($user["display_name"] ?: $user["firstname"] . ' ' . $user["lastname"]);
                                break;
                            }
                        }

                        $date = $convertToUKTime($log['updated_at']);

                        $metaRaw = $log['meta'];
                        $metaData = json_decode($metaRaw, true);

                        if(array_key_exists('approver_assign', $metaData))
                        {
                            unset($metaData['approver_assign']['status'], $metaData['approver_assign']['tr_id'], $metaData['approver_assign']['package_name']);
                            $log = $metaData['approver_assign'];
                            $log['timestamp'] = $date;
                        }
                        elseif($log['type'] == 'Approved' && array_key_exists('instance', $metaData))
                        {
                            if(array_key_exists('instance', $metaData))
                            {
                                $log['instance'] = $metaData['instance'];
                            }
                            if(array_key_exists('approval_level_id', $metaData))
                            {
                                $log['approval_level_id'] = $metaData['approval_level_id'];
                            }
                            if(array_key_exists('comment', $metaData))
                            {
                                $log['comment'] = $metaData['comment'];
                            }
                            $approvedMeta[] = $log;
                            unset($logs['logs'][$i]);

                        }
                        elseif($log['type'] == 'Rejected' && array_key_exists('instance', $metaData))
                        {
                            if(array_key_exists('instance', $metaData))
                            {
                                $log['instance'] = $metaData['instance'];
                            }
                            if(array_key_exists('approval_level_id', $metaData))
                            {
                                $log['approval_level_id'] = $metaData['approval_level_id'];
                            }
                            if(array_key_exists('comment', $metaData))
                            {
                                $log['comment'] = $metaData['comment'];
                            }

                            $rejectedMeta[] = $log;
                            unset($logs['logs'][$i]);
                        }
                        else
                        {
                            $message = $metaData['message'] ?? null;

                            $log = [
                                'type' => strtolower(preg_replace('/[^A-Za-z0-9]+/', '_', $log['type'])),
                                'label' => $log['type'],
                                'user' => $log['user_name'],
                                'timestamp' => $date,
                                'comment' => $message,
                            ];
                        }

                    }
                    $logs['logs'] = array_values($logs['logs']);
                    foreach ($rejectedMeta as $rejected) {

                        $meta = json_decode($rejected['meta'], true);
                        $instanceId = $meta['instance'] ?? null;
                        $levelId    = $meta['approval_level_id'] ?? null;
                        $userId     = $rejected['user_id'] ?? null;
                        $message    = $rejected['comment'] ?? null;

                        foreach ($logs['logs'] as &$logItem) {

                            // only approval_request nodes
                            if (($logItem['type'] ?? null) !== 'approval_request') {
                                continue;
                            }

                            if (($logItem['instance'] ?? null) != $instanceId) {
                                continue;
                            }

                            foreach ($logItem['levels'] as &$level) {

                                if (($level['approval_level_id'] ?? null) != $levelId) {
                                    continue;
                                }

                                foreach ($level['entries'] as &$entry) {

                                    if (($entry['id'] ?? null) == $userId) {
                                        $entry['type'] = 'rejected';
                                        $entry['label'] = 'Rejected';
                                        $entry['timestamp'] = $convertToUKTime($rejected['updated_at']);
                                        $entry['comment'] = $message;
                                        break; // exit all loops
                                    }
                                }
                                unset($entry);
                            }
                            unset($level);
                        }
                        unset($logItem);
                    }

                    foreach ($approvedMeta as $approved) {

                        $meta = json_decode($approved['meta'], true);

                        $instanceId = $meta['instance'] ?? null;
                        $levelId    = $meta['approval_level_id'] ?? null;
                        $userId     = $approved['user_id'] ?? null;
                        $message    = $approved['comment'] ?? null;

                        foreach ($logs['logs'] as &$logItem) {

                            // only approval_request nodes
                            if (($logItem['type'] ?? null) !== 'approval_request') {
                                continue;
                            }

                            if (($logItem['instance'] ?? null) != $instanceId) {
                                continue;
                            }

                            foreach ($logItem['levels'] as &$level) {

                                if (($level['approval_level_id'] ?? null) != $levelId) {
                                    continue;
                                }

                                foreach ($level['entries'] as &$entry) {

                                    if (($entry['id'] ?? null) == $userId) {
                                        $entry['type'] = 'approved';
                                        $entry['label'] = ApprovalSatisfactionHelper::resolveApprovalLogLabelFromMeta(
                                            array_merge($entry, is_array($meta) ? $meta : []),
                                            $approved['type'] ?? 'Approved'
                                        );
                                        $entry['timestamp'] = $convertToUKTime($approved['updated_at']);
                                        $entry['comment'] = $message;
                                        break; // exit all loops
                                    }
                                }
                            }
                        }
                    }

                    foreach ($logs['logs'] as &$logItem) {
                        if (($logItem['type'] ?? null) !== 'approval_request') {
                            continue;
                        }
                        foreach ($logItem['levels'] as &$level) {
                            foreach ($level['entries'] as &$entry) {
                                $entry = ApprovalSatisfactionHelper::finalizeLogEntryForGet($entry);
                            }
                            unset($entry);
                        }
                        unset($level);
                        $logItem['levels'] = ApprovalSatisfactionHelper::finalizeLogLevelsForGet($logItem['levels']);
                    }
                    unset($logItem);
                }
                $logs['logs'] = array_reverse($logs['logs']);
                $a->set("logs", $logs);
            },
            Generic::set("json", fn($a) => json_encode($a->get("logs"))),
        ],
    ],
    [
        "id" => "tender_recommendation_attachments",
        "key" => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/attachments$",
        "method" => "GET",
        "description" => "Get attachments for the specific tender recommendation",
        "response_keys" => "attachments",
        "middleware" => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            fn($a) => TenderRecommendationMiddleware::getAttachments($a),
            Generic::set("json", fn($a) => json_encode($a->get("data"))),
        ],
    ],
    [
        "id"            => "tender_recommendation_upload_existign_attachments",
        "key"           => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/upload_existing$",
        "method"        => "POST",
        "description"   => "Upload existing attachments for the specific tender recommendation",
        "response_keys" => "attachments_uploaded",
        "middleware"    => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            fn($a) => TenderRecommendationMiddleware::uploadExisting($a),
            Generic::set("json", fn($a) => json_encode($a->get("payload"))),
        ],
    ],
    [
        "id"            => "tender_recommendation_upload_attachments",
        "key"           => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/upload_attachments$",
        "method"        => "POST",
        "description"   => "Upload attachments for the specific tender recommendation",
        "response_keys" => "attachments_uploaded",
        "middleware"    => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            fn($a) => TenderRecommendationMiddleware::uploadAttachments($a),
            Generic::set("json", fn($a) => json_encode($a->get("payload"))),
        ],
    ],
    [
        "id"            => "tender_recommendation_remove_attachments",
        "key"           => "^(?<project_id>[0-9]+)\/tender\/(?<tender_id>[0-9]+)\/tender_recommendation\/(?<id>[0-9]+)\/attachments\/(?<attachment_id>[0-9]+)$",
        "method"        => "DELETE",
        "description"   => "Remove attachments for the specific tender recommendation",
        "response_keys" => "attachments_uploaded",
        "middleware"    => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            fn($a) => TenderRecommendationMiddleware::removeAttachments($a),
            Generic::set("json", fn($a) => json_encode($a->get("payload"))),
        ],
    ],
    [
        "id"           => "tender_recommendation_download_manager_attachments",
        "key"          => "^(?<project_id>[0-9]+)\/tender_recommendation_attachment\/download_manager\/(?<id>[0-9]+)$",
        "method"       => "GET",
        "description"  => "Get tender recommendation attachments with summary for download manager",
        "response_keys" => "data",
        "middleware"   => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            fn($a) => TenderRecommendationMiddleware::getAttachmentsForDownloadManager($a),
            Generic::set("json", fn($a) => json_encode($a->get("data"))),
        ],
    ],
    [
        "id"          => "tender_recommendation_download_attachment",
        "key"         => "^(?<project_id>[0-9]+)\/tender_recommendation_attachment\/download\/(?<id>[0-9]+)$",
        "method"      => "GET",
        "description" => "Download a single attachment for tender recommendation",
        "middleware"  => [
            Procedure::get("fetchAndValidateProjectById"),
            fn($a) => TenderRecommendationMiddleware::downloadAttachment($a),
        ],
    ],
    [
        "id"          => "tender_recommendation_download_manager_attachments_zip",
        "key"         => "^(?<project_id>[0-9]+)\/tender_recommendation_attachment\/download\/(?<id>[0-9]+)\/zip$",
        "method"      => "GET",
        "description" => "Download all tender recommendation attachments as a ZIP",
        "middleware"  => [
            Procedure::get("fetchAndValidateProjectById"),
            Procedure::get("fetchAndValidateTenderRecommendationById"),
            fn($a) => TenderRecommendationMiddleware::downloadAttachmentsAsZip($a),
        ],
    ],
];
