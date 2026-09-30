<?php

namespace Api\Middleware;

use App\Domain\Account\Manage;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class OrderMiddleware{

    const TRANSACTION_STATUS_SENT = 1;
    const TRANSACTION_STATUS_WITHDRAWN = 2;
    const TRANSACTION_STATUS_SIGNED_MANUALLY = 4;


    /**
     * @param string $orderKey
     * @param string $signatoryKey
     * @param string $statusesKey
     * @return \Closure
     *
     * Usage:
     * $action->get('status')
     */
    public static function getStatus(string $orderKey, string $signatoryKey, string $statusesKey): \Closure
    {
        return function (Shape $action) use ($orderKey, $signatoryKey, $statusesKey) {
            $signatory = $action->get($signatoryKey);
            $order = $action->get($orderKey);
            if($signatory) {
                try{
                    $signatory_status = self::getSignatoryStatus($signatory, $action->get($statusesKey));
                }catch (\Exception $e){
                    $signatory_status = null;
                }
            }
            $status_label = self::getDocumentStatus($order);
            if($status_label !== 'Withdrew'){
                $status_label = $signatory_status ?? $status_label;
            }

            return $action->set("status", $status_label);
        };
    }


    /**
     * @param array $order_data
     * @return string
     */
    public static function getDocumentStatus(array $order_data): string
    {
        $statusId = (int)($order_data['status_id'] ?? 0);

        //This is the latest status that a order can have
        if($statusId === self::TRANSACTION_STATUS_WITHDRAWN){
            return 'Withdrew';
        }

        if($statusId === self::TRANSACTION_STATUS_SIGNED_MANUALLY){
            return 'Signed';
        }

        //If the order dont have a price that means that the order is in draft
        $meta = json_decode($order_data['meta'] ?? '', true);
        $orderWasIssued = !empty($order_data['order_price']) && !empty($meta['order_template_id']);

        return $orderWasIssued ? 'Sent' : 'Draft';
    }

    /**
     * @param array $signatory
     * @param array $statuses
     * @return string
     * @throws \Exception
     */
    public static function getSignatoryStatus(array $signatory, array $statuses): string
    {
        if(!$statuses){
            throw new \Exception('No statuses provided');
        }
        $status_declined = array_filter( array_map(function($status){
            return ($status['uid'] === 'declined') ? $status['id'] : null;
        }, $statuses));
        $status_pending = array_filter( array_map(function($status){
            return ($status['uid'] === 'pending') ? $status['id'] : null;
        }, $statuses));
        $signers = $signatory['signer'] ?? [];
        $status  = $signers ? 'Signed' : 'Pending Signature';

        //Check to see if all the signatures are provided
        foreach($signers as $value){
            if( in_array($value['signer_status_id'], $status_declined, true) ){
                $status = 'Withdrew';
                break;
            }
            if( in_array($value['signer_status_id'], $status_pending, true) ){
                $status = 'Pending Signature';
            }
        }
        return $status;
    }

    /**
     * @param string $postDataKey
     * @param string $requesterUserId
     * @param string $didKey
     * @param string $statusIdKey
     * @return \Closure
     */
    public static function assignApproversRequest(string $postDataKey = 'requestData', string $requesterUserId = 'requester_user_id', string $didKey = 'did', string $statusIdKey = 'order_approver_pending_type_id'): \Closure
    {
        return function (Shape $action) use ($postDataKey, $requesterUserId, $didKey, $statusIdKey) {
            try {
                $requestData = $action->get($postDataKey);
                $approvalLevelWorkflowIds = $action->get('save_approval_level_workflow_response')['data'];
                $userData = [];
                foreach ($requestData as $key => $value) {
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
                $did = $action->get($didKey);
                $statusId = $action->get($statusIdKey);
                $requesterUserId = $action->get($requesterUserId);
                if (!$requestData || !$did || !$statusId) {
                    throw new MiddlewareException("badRequest", "Missing required data for assigning approvers");
                }
                $payload = [
                    'users' => $userData,
                    'transaction_id' => $did,
                    'requester_user_id' => $requesterUserId,
                    'status_id' => $statusId,
                ];
                return Manager::getService("project")->write("order_approver", new Shape(['data' => $payload]));
            } catch (\Exception $e) {
                throw new MiddlewareException("assignApproverError", $e->getMessage());
            }
        };
    }

      /**
     * @param string $filterKey
     * @param string $filterValue
     * @param string $typeName
     * @return \Closure
     *
     * Usage:
     * $action->get("order_approver_type_{$typeName}")
     */
    public static function fetchOrderApproverType(string $filterKey = '', string $filterValue = '', string $typeName = ''): \Closure
    {
        return function (Shape $action) use ($filterKey, $filterValue, $typeName) {
            try {
                $data = Manager::getService("project")->fetch("order_approver/type")->getCollection('data')->filterByField($filterKey, $filterValue)->first();
                return $action->set("order_approver_type_{$typeName}", $data);
            } catch (\Exception $e) {
                throw new MiddlewareException("OrderApproverTypeError", $e->getMessage());
            }
        };
    }

    /**
     * @param string $didKey
     * @return \Closure
     */
    public static function removeOrderApproversByTransaction(string $didKey = 'did'): \Closure
    {
        return function (Shape $action) use ($didKey) {
            try {
                return Manager::getService("project")->delete("order_approver/transaction/" . $action->get($didKey));
            } catch (\Exception $e) {
                throw new MiddlewareException("RemoveOrderApproverError", $e->getMessage());
            }
        };
    }

    /**
     * @param string $postDataKey
     * @return \Closure
     */
    public static function createOrderLog(string $postDataKey = 'logData'): \Closure
    {
        return function (Shape $action) use ($postDataKey) {
            try {
                $logData = $action->get($postDataKey);
                return Manager::getService("project")->write("order_approver/log", new Shape(['data' => $logData]));
            } catch (\Exception $e) {
                throw new MiddlewareException("OrderLogErrpr", $e->getMessage());
            }
        };
    }

    /**
     * @param string $postDataKey
     * @param string $approverIdKey
     * @return \Closure
     */
    public static function orderApprovalRejection(string $postDataKey = 'requestData', string $approverIdKey = 'approver_id'): \Closure
    {
        return function (Shape $action) use ($postDataKey, $approverIdKey) {
            try {
                $requestData = $action->get($postDataKey);
                $id = $action->get($approverIdKey);
                if (!$requestData) {
                    throw new MiddlewareException("badRequest", "Missing required data for assigning approvers");
                }
                Manager::getService("project")->update("order_approver/{$id}", new Shape(['data' => $requestData]));
            } catch (\Exception $e) {
                throw new MiddlewareException("assignApproverError", $e->getMessage());
            }
        };
    }

    /**
     * @param string $filterKey
     * @param string $filterValue
     * @return \Closure
     *
     * Usage:
     * $action->get('order_approval')
     */
    public static function fetchOrderApproval(string $filterKey = '', string $filterValue = ''): \Closure
    {
        return function (Shape $action) use ($filterKey, $filterValue) {
            try {
                $value = $action->get($filterValue);
                $data = Manager::getService("project")->fetch(sprintf("order_approver/%s", $value))->getShape('data');
                return $action->set('order_approval', $data);
            } catch (\Exception $e) {
                throw new MiddlewareException("assignApproverError", $e->getMessage());
            }
        };
    }

    /**
     * @param string $transactionIdey
     * @return \Closure
     *
     * Usage:
     * $action->get('order_approval_transaction')
     */
    public static function fetchOrderApprovalByTransaction(string $transactionIdey = ''): \Closure
    {
        return function (Shape $action) use ($transactionIdey) {
            try {
                $value = $action->get($transactionIdey);
                $data = Manager::getService("project")->fetch(sprintf("order_approver/transaction/%s", $value))->getCollection('data');
                return $action->set('order_approval_transaction', $data);
            } catch (\Exception $e) {
                throw new MiddlewareException("assignApproverError", $e->getMessage());
            }
        };
    }

    /**
     * @param bool $clearWithdrawnStatus Reset status 2 when starting a new approval cycle.
     * @return \Closure
     */
    public static function syncOrderPrice(bool $clearWithdrawnStatus = false): \Closure
    {
        return function (Shape $action) use ($clearWithdrawnStatus) {
            $orderValue = (int)$action->get('meta.values.order_value');
            $order = $action->get('quote');
            $qid = $order['id'];
            $pid = $action->get('pid');
            if ($orderValue && $qid && $pid) {
                $transactionData = [
                    'order_price' => $orderValue,
                    'order_updated' => date("Y-m-d H:i:s"),
                ];

                if (
                    $clearWithdrawnStatus
                    && (int)($order['status_id'] ?? 0) === self::TRANSACTION_STATUS_WITHDRAWN
                ) {
                    $transactionData['status_id'] = self::TRANSACTION_STATUS_SENT;
                }

                Manager::getService("project")->update(
                    sprintf("project/%s/tender/transaction/%s", $pid, $qid),
                    new Shape(['data' => $transactionData])
                );
            }
        };
    }

    /**
     * Reset the transaction value used by the Orders page Draft/Sent fallback.
     */
    public static function resetOrderPrice(
        string $pidKey = 'pid',
        string $transactionIdKey = 'transaction_id'
    ): \Closure {
        return function (Shape $action) use ($pidKey, $transactionIdKey) {
            $pid = (int)$action->get($pidKey);
            $transactionId = (int)$action->get($transactionIdKey);

            if (!$pid || !$transactionId) {
                throw new MiddlewareException(
                    "badRequest",
                    "Missing project or transaction ID when resetting the order price"
                );
            }

            return Manager::getService("project")->update(
                sprintf("project/%s/tender/transaction/%s", $pid, $transactionId),
                new Shape(['data' => [
                    'order_price' => 0,
                    'order_updated' => date("Y-m-d H:i:s"),
                ]])
            );
        };
    }

    /**
     * @param string $qidKey
     * @return \Closure
     *
     * Usage:
     * $action->get('quote')
     */
    public static function fetchQuote(string $qidKey = 'qid'): \Closure
    {
        return function (Shape $action) use ($qidKey) {
            try {
                $id = $action->get($qidKey);
                $data = Manager::getService("project")->fetch("transaction/{$id}")->getCollection('data')->first();
                return $action->set('quote', $data);
            } catch (\Exception $e) {
                throw new MiddlewareException("assignApproverError", $e->getMessage());
            }
        };
    }


}
