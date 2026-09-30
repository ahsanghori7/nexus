<?php

namespace App\Models;

use App\Api\Transactions;

class Order extends Abstraction
{
    public const STATUS_WITHDREW = 'Withdrew';

    /**
     * @param array $orders
     * @return array
     */
    public static function extractDataFromOrder(array $orders = []): array
    {
        $data = [];
        if($orders){
            array_map(function($template) use (&$data){
                if(isset($template["documents"]) && is_array($template["documents"])){
                    array_map(function($document) use (&$data){
                        $meta = json_decode($document["meta"], true);
                        if ($meta && isset($meta["quote"])) {
                            $data['dids'][$document["id"]] = $document["id"];
                            $data['quotes'][$document["id"]] = $meta["quote"];
                            if (isset($meta["quote"]['tender_id'])) {
                                $data['tids'][$meta["quote"]['tender_id']] = $meta["quote"]['tender_id'];
                            }
                        }
                    }, $template["documents"]);
                }
            }, $orders);
        }
        return $data;
    }

    /**
     * @param array $order
     * @param array $signatory
     * @param array $statuses
     * @return string
     */
    public static function getStatus(array $order, array $signatory, array $statuses): string
    {
        if($signatory) {
            try{
                $signatory_status = self::getSignatoryStatus($signatory, $statuses);
            }catch (\Exception $e){
                $signatory_status = null;
            }
        }
        $status_label = self::getDocumentStatus($order);
        if($status_label !== self::STATUS_WITHDREW){
            $status_label = $signatory_status ?? $status_label;
        }

        return $status_label;
    }


    /**
     * @param array $order_data
     * @return string
     */
    public static function getDocumentStatus(array $order_data): string
    {
        $statusId = (int)($order_data['status_id'] ?? 0);

        //This is the latest status that a order can have
        if($statusId === Transactions::TRANSACTION_STATUS_WITHDRAWN){
            return self::STATUS_WITHDREW;
        }

        if($statusId === Transactions::TRANSACTION_STATUS_SIGNED_MANUALLY){
            return 'Signed';
        }

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
                $status = self::STATUS_WITHDREW;
                break;
            }
            if( in_array($value['signer_status_id'], $status_pending, true) ){
                $status = 'Pending Signature';
            }
        }
        return $status;
    }

    /**
     * @param array $tenders
     * @return array
     */
    public static function getOrderDataFromTenders(array $tenders = []): array
    {
        $order_data = [];
        foreach($tenders as $tender){
            $order_data[$tender['id']] = $tender;
        }
        return $order_data;
    }

    /**
     * @param array $signers
     * @param array $signature_status
     * @return int
     */
    public static function getTotalSigners(array $signers, array $signature_status): int
    {
        $signed = 0;
        $signature_status = array_map('intval', array_values(array_filter($signature_status)));
        array_map(function ($item) use (&$signed, $signature_status) {
            if( in_array((int)$item['signer_status_id'], $signature_status, true) ){
                $signed++;
            }
        }, $signers);
        return $signed;
    }

}
