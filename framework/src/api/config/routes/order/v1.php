<?php

use Api\Middleware\ApiSession;
use Api\Middleware\DocumentMiddleware;
use Api\Middleware\OrderMiddleware;
use Api\Middleware\ProjectMiddleware;
use Api\Middleware\TenderMiddleware;
use Core\Config;
use Core\Middleware\Conditional;
use Core\Middleware\Generic;
use Core\Service\Manager;
use Prosper\Middleware\EmailMiddleware;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Service\AccountMiddleware;

$session_handler = Config::get("session.handler", ApiSession::class);

return [
    "type" => "http",
    "onError" => [
        "invalidToken"   => $session_handler::invalidApiToken(),
        "NotApprovalException"    => Generic::exceptionResponse("HTTP/1.0 400", "Order should be in Pending Approval status to send approval reminder", 400),
        "NotPendingException"    => Generic::exceptionResponse("HTTP/1.0 400", "Approval status should be pending to send approval reminder", 400),
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
            "key" => "(?<did>[0-9]{1,7})\/approvalReminder$",
            "method" => "POST",
            "middleware" => [
                DocumentMiddleware::fetchDocument('id', 'uriArgs.did'),
                DocumentMiddleware::fetchDocumentSigners(),
                DocumentMiddleware::fetchSignatoryStatuses(true),
                function ($a) {
                    $meta = json_decode($a->get("document")->first()->get('meta'), true);
                    $a->set('meta', $meta);
                    $a->set('quote', $meta['quote']);
                    $pid = $meta['quote']['tender']['project_id'];
                    $tid = $meta['quote']['tender']['id'];
                    $a->set("pid", $pid);
                    $a->set("tid", $tid);
                    $data = $a->getRoute()->getRequest()->getData();
                    $requestData = $data->getShape('json')->get('data');
                    $a->set('request_data', $requestData);
                },
                ProjectMiddleware::fetchProject('id', 'pid'),
                TenderMiddleware::fetchTenderHistoryType('uid', 'pending_approval', 'pendingApproval'),
                TenderMiddleware::fetchTenderHistory('pid', 'tid', true),
                OrderMiddleware::getStatus('quote', 'document_signers', 'document_signatory_statuses'),
                OrderMiddleware::fetchOrderApprovalByTransaction('quote.id'),
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
                    if ($lastHistory && $lastHistory["tender_history_type"] === 'Order') {
                        $status = Manager::getService("project")->fetch("tender/history/type")->getCollection('data')->filterByField("id", $lastHistory["status_id"])->first()->get('label');
                    }
                    $a->set('status', $status);
                    $a->set('order_approval', $a->get('order_approval_transaction')->filterByField('id', $a->get('request_data.approver_id'))->first());
                    $a->set('order_approval_status', $a->get('order_approval_transaction')->filterByField('id', $a->get('request_data.approver_id'))->first()->get('status.label'));
                },
                Conditional::switched('order_approval_status', [
                    Conditional::switched('status', [
                        function ($a) {
                            $approver = Manager::getService("account")->fetch("user/search", ['field' => 'id', 'value' => $a->get('order_approval.approver_user_id')])->getShape('data')->get();
                            $a->set('user_id', $approver['id']);
                            AccountMiddleware::loadTokenTypes("review_token")($a);
                            AccountMiddleware::createUserToken(
                                        "user_id", "token_type"
                                        )($a);
                            $orderCreatedDateTime = DocumentMiddleware::getUKDateTime($a->get('order_approval.created_at'));
                            $dateTime = DocumentMiddleware::getUKDateTime();
                            $redirectUrl = sprintf("document-creator/template/%s/order/%s", $a->get('uriArgs.did'), $a->get('quote.tender_id'));

                            EmailMiddleware::send('Assign Order Approver Reminder', [
                                "sender"    => ['id' => $approver['id']],
                                'extra'    => [
                                    'approverName'  => $approver['display_name'] ?: $approver['firstname'] . ' ' . $approver['lastname'],
                                    'requestedBy'   => $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname'),
                                    'orderValue'    => '£' . number_format(((int)$a->get('meta.values.order_value'))/100, 2),
                                    'projectName'   => $a->get('project.name'),
                                    'packageName'   => $a->get('quote.tender.label'),
                                    'firstDateTime' => sprintf("%s at %s UK Time", $orderCreatedDateTime['date'], $orderCreatedDateTime['time']),
                                    'dateTime'      => sprintf("%s at %s UK Time", $dateTime['date'], $dateTime['time']),
                                    'orderLink'     => sprintf("%s/auto_loader/?review_token=%s&redirect=%s&plain_redirect=true", Config::get('clink.site_url'), $a->get('token'), $redirectUrl)
                                ]
                            ])($a);

                            $user_name = $a->get('user.display_name') ?: $a->get('user.firstname') . ' ' . $a->get('user.lastname');
                            $recipient = $approver['display_name'] ?: $approver['firstname'] . ' ' . $approver['lastname'];
                            // Log the approval request
                            $logData = [
                                'user_id' => $a->get('user.id'),
                                'transaction_id' => $a->get('quote.id'),
                                'meta' => json_encode([
                                        'user_name' => $user_name,
                                        'recipient' => $recipient,
                                        'description' => sprintf("Approval reminder request sent by %s to %s for %s, %s", $user_name, $recipient, $a->get('project.name'), $a->get('quote.tender.label'))
                                    ]),
                                'type' => 'Reminder Sent'
                            ];
                            $a->set('logData', $logData);
                            OrderMiddleware::createOrderLog('logData')($a);
                        },
                    ], [
                        function ($a) {
                            throw new MiddlewareException("NotApprovalException");
                        },
                    ], 'Pending Approval'),
                ], [
                    function ($a) {
                        throw new MiddlewareException("NotPendingException");
                    },
                ], 'Pending'),
                Generic::set("json", function ($a) {
                    return json_encode([
                        'status' => true,
                    ]);
                })
            ],
        ]
    ]
];
