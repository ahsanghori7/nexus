<?php

namespace Prosper\Model;

use App\Api\Document;
use App\Models\Signatory as SignatoryModel;
use Core\Data\Collection;
use Core\Data\Shape;
use Core\Service\Manager;
use Prosper\Model\Document as DocumentModel;

class Signatory
{

    /**
     * @var array|string[]
     */
    protected static array $specialist_types = [
        'specialist',
        'external_subcontractor'
    ];

    /**
     * @param string $uid
     * @return mixed
     */
    static function getSignatories(string $uid = "")
    {
        $signatories = Manager::getService("document")->fetch("signatory/status")->getCollection("data");
        return $uid ? $signatories->filter(function ($item) use ($uid) {
            return $item->get('uid') === $uid;
        })->first() : $signatories;
    }

    /**
     * @param array $signers
     * @param array $signature_status
     * @return int
     */
    public static function getAllSigners(array $docs = [], $signedStatus = [])
    {
        if (!$docs) {
            return [];
        }

        $signers = Manager::getService("document")->fetch(sprintf("document/[%s]/signers", implode(",", $docs)))->getCollection("data");
        $results = [];
        foreach($signers->getItems() as $did => $items){
            $results[$did] = [];
            $signatoryRequests = $items->toArray();
            $item = array_shift($signatoryRequests); // Get last signatory requests
            $signer = $item['signer'] ?? [];
            $results[$did] = [
                'total'   => count($signer),
                'signers' => self::getTotalSigners($signer, $signedStatus)
            ];
        }

        return $results;
    }

    public static function getAllSignerSummaries(array $docs = [], array $signedStatus = [], int $userId = 0): array
    {
        if (!$docs) {
            return [];
        }

        $signers = Manager::getService("document")->fetch(sprintf("document/[%s]/signers", implode(",", $docs)))->getCollection("data");
        $documents = self::getDocumentsByIds($docs);
        $results = [];
        foreach ($signers->getItems() as $did => $items) {
            $signatoryRequests = $items->toArray();
            $item = array_shift($signatoryRequests);
            $signer = $item['signer'] ?? [];
            $results[$did] = [
                'total'    => count($signer),
                'signers'  => self::getTotalSigners($signer, $signedStatus),
                'can_sign' => $userId ? self::canUserSignFromSigners(
                    $signer,
                    $signedStatus['id'] ?? 0,
                    $userId,
                    $documents[(int)$did]['signer_user_ids'] ?? []
                ) : false,
            ];
        }

        return $results;
    }

    /**
     * @param array $signers
     * @param array $signature_status
     * @return int
     */
    public static function getTotalSigners(array $signers, array $checkingStatus): int
    {
        $signed = array_filter($signers, function($signer) use ($checkingStatus){
            return intval($signer["signer_status_id"]) === intval($checkingStatus["id"]);
        });
        return count($signed);
    }

    /**
     * @return array[]
     */
    public static function getSignatoryOrder()
    {
        return [
            2 => [
                1, //sub contractor
                0, //main contractor
            ],
            4 => [
                2, //sub contractor
                3, //sub contractor witness
                0, //main contractor
                1, //main contractor witness
            ],
            6 => [
                4, //sub contractor
                5, //sub contractor witness
                0, //main contractor
                1, //main contractor witness
                2, //main contractor bank
                3, //main contractor bank witness
            ]
        ];
    }

    /**
     * @param int $user_id
     * @param array $signer_ids
     * @return int
     * this will get the user ids in the order that they come from document creator
     * @throws \Exception
     */
    public static function getSignatoryOrderId(int $user_id, array $signer_ids): int
    {
        $total_signers = count($signer_ids);
        $signature_order = self::getSignatoryOrder()[$total_signers] ?? [];
        $key_search = array_search($user_id, $signer_ids);
        return $signature_order[$key_search];
    }

    /**
     * @param array $signers
     * @param array $signature_status
     * @param int $user_id
     * @return bool
     * @throws \Exception
     */
    public static function isNextToSign(array $signers, array $signature_status, int $user_id = 0): bool
    {
        try{
            ksort($signers);
            $signers_pending = 0;
            (new Collection(array_values($signers), Shape::class))->map(function($item) use (&$can_sign, $signature_status, $user_id, &$signers_pending){
                if( !in_array((int)$item->get("status_id"), $signature_status, true) ){
                    $signers_pending++;
                }
                //check if the user needs to sign (has an entry to the table with the status pending)
                if((int)$item->get("user_id") === $user_id){
                    $can_sign = !in_array((int)$item->get("status_id"), $signature_status, true) &&
                        ($signers_pending === 1); //no one before
                }
            });
        }catch (\Exception $e){
            $can_sign = false;
        }

        return $can_sign ?? false;
    }

    private static function canUserSignFromSigners(array $signers, int $signedStatusId, int $userId, array $signerUserIds = []): bool
    {
        try {
            $signatoryOrders = [];
            foreach (array_values($signers) as $index => $signer) {
                $signerStatusId = (int)($signer['signer_status_id'] ?? 0);
                if ($signerStatusId !== $signedStatusId) {
                    $signatoryOrder = $signerUserIds
                        ? self::getSignatoryOrderId((int)$signer['signer_user_id'], $signerUserIds)
                        : $index;
                    $signatoryOrders[$signatoryOrder] = [
                        'user_id'   => (int)($signer['signer_user_id'] ?? 0),
                        'status_id' => $signerStatusId,
                    ];
                }
            }

            return $signatoryOrders ? self::isNextToSign($signatoryOrders, [$signedStatusId], $userId) : false;
        } catch (\Exception $e) {
            return false;
        }
    }

    private static function getDocumentsByIds(array $docs): array
    {
        $idsQuery = http_build_query(["ids" => array_values($docs)]);
        $documents = Manager::getService("document")->fetch("document?" . $idsQuery)->getCollection("data");
        $results = [];
        foreach ($documents->getItems() as $document) {
            $signers = [];
            $meta = json_decode($document->get("meta", ''), true);
            $values = $meta["values"] ?? [];
            if (is_array($values)) {
                ksort($values);
                $signers = array_filter($values, function ($key) {
                    return strpos($key, "signature_") === 0;
                }, ARRAY_FILTER_USE_KEY);
            }

            $results[(int)$document->get("id")] = [
                'signer_user_ids' => array_values($signers ?? []),
            ];
        }

        return $results;
    }

    /**
     * @param int $doc_id
     * @param int $user_id
     * @param $signed_status_id
     * @return bool
     * @throws \Exception
     */
    public static function canSign(int $doc_id, int $user_id, $signed_status_id): bool
    {
        try{
            $signers = Manager::getService("document")->fetch(sprintf("document/%s/signers", $doc_id))->getCollection("data");
            if($signers->count()) {
                $did      = $signers->getFirst()->get("document_id");
                $document = Manager::getService("document")->fetch("document/$did")->getShape("data");
                $meta     = json_decode($document->get("meta", ''), true);
                ksort($meta["values"]);
                $sids     = array_filter($meta["values"], function ($key) {
                    return strpos($key, "signature_") === 0;
                }, ARRAY_FILTER_USE_KEY);
                $signer_user_ids = array_values($sids);
                (new Collection($signers->getFirst()->get("signer"), Shape::class))->map(function($signer) use (&$signatory_orders, &$nr, $signed_status_id, $signer_user_ids){
                    $signatory_order = self::getSignatoryOrderId($signer->get("signer_user_id"), $signer_user_ids);
                    if ($signed_status_id !== $signer->get("signer_status_id")){
                        $signatory_orders[$signatory_order] = [
                            'user_id'   => $signer->get("signer_user_id"),
                            'status_id' => $signer->get("signer_status_id")
                        ];
                    }
                    $nr++;
                });
                if($signatory_orders) {
                    $can_sign = self::isNextToSign($signatory_orders, [$signed_status_id], $user_id);
                }
            }
        }catch (\Exception $e){
            $can_sign = false;
        }
        return $can_sign ?? false;
    }

    /**
     * @param string $idKey
     * @param string $statusKey
     * @return \Closure
     */
    public static function hasActiveSignatory(string $idKey, string $statusKey): \Closure
    {
        return function($a) use ($idKey, $statusKey){
            try{
                if($a->get($idKey)) {
                    $user_signatories = Manager::getService("document")->fetch("signatory", ['user_id' => $a->get($idKey), 'status_id' => $a->get($statusKey)])->getCollection("data");
                }
            }catch (\Exception $e){
                $user_signatories = [];
            }
            $a->set("signatories", $user_signatories ?? []);
        };
    }
}
