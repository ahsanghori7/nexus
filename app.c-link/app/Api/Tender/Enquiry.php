<?php


namespace App\Api\Tender;

use App\Api\Client;

use App\Api\Tender as TenderApi;
use App\Models\Collection;
use App\Models\Tender as TenderModel;
use App\Models\Base;
use App\Api\Document as DocumentApi;

class Enquiry extends Client
{

    const ENTITY_TYPE = "Enquiry";

    /**
     * Allow Config to be overridden
     */
    public const API_CONFIG_KEY = "project";

    /*
     * Key that is store in the history meta if the contractor chose to append the boq
     */
    public const BOQ_AVAILABLE_KEY = 'boq_available';

    /**
     * @param TenderModel $tender
     * @param int $sender
     * @param array $documents
     * @param int $enquiry_document_id
     * @throws \App\Api\Exception
     */
    public static function send(TenderModel $tender, int $sender, array $documents, int $enquiry_document_id): void
    {
        $tid = $tender->getId();
        $pid = $tender->getData("project_id");
        $statusId = TenderApi::getHistoryTypes()
            ->filterByField("uid", "sent")
            ->getFirst()
            ->getId();

        foreach ($documents as $sid => $document) {
            self::post("project/$pid/tender/$tid/history", [
                    "specialist_id" => $sid,
                    "tender_history_type" => self::ENTITY_TYPE,
                    "author_id" => $sender,
                    "status_id" => (int)$statusId,
                    "meta" => ["document" => [$sid => $document], "enquiry" => $enquiry_document_id]
                ]
            );
        }
    }

    /**
     * @param TenderModel $tender
     * @param int $sender
     * @param array $documents
     * @param int $enquiry_document_id
     * @param array $data
     * @throws \App\Api\Exception
     */
    public static function updateMetaHistory(TenderModel $tender, int $sender, array $documents, int $enquiry_document_id, array $data = [], string $enquiry_type = 'Enquiry'): void
    {

        $tid = $tender->getId();
        $pid = $tender->getData("project_id");
        $statusId = TenderApi::getHistoryTypes()
            ->filterByField("uid", 'sent')
            ->getFirst()
            ->getId();

        foreach ($documents as $sid => $document) {
            $results = self::get("project/$pid/tender/$tid/history",
                ["status_id" => $statusId, "specialist_id" => $sid, "author_id" => $sender]
            );
            $results = array_shift($results);
            if($results) {
                $history = self::historyForIssuance($results["history"] ?? [], $enquiry_document_id);
                if($history) {
                    $email = '';
                    if(isset($data['accounts'])){
                        $email = array_map(function($account) use ($sender){
                            $meta = json_decode($account->getData("meta", ''), true);
                            if(isset($meta[$sender])){
                                return $meta[$sender]['email'];
                            }
                        }, $data['accounts']);
                    }
                    $email = array_shift($email);
                    if($enquiry_type === "Tender Addendum"){
                        $meta_sid = ['id' => $document['id'], "is_tender_addendum" => true];
                    }
                    else{
                        $meta_sid = ['id' => $document['id']];
                    }
                    self::updateHistory($pid, intval($tid), $history['id'],
                        ["meta" => ["document" => [$sid => $meta_sid], "enquiry" => $enquiry_document_id, "email_sent_to" => $email, self::BOQ_AVAILABLE_KEY => $data['boq_available'] ?? false]]
                    );

                    //Update the document ownership to the subcontractor so they can view the document
                    //from their dashboard
                    DocumentApi::patch(sprintf("document/%s/owner", $document['id']), [
                        'owner_id' => $sid
                    ]);
                }
            }
        }
    }

    /**
     * The history row belonging to the issuance being sent.
     *
     * A tender accumulates one row per issuance - the enquiry, then each
     * addendum - and they are told apart by the source document recorded under
     * the meta's `enquiry` key. Taking whichever row comes back first would
     * stamp this issuance's details onto an earlier one, erasing the record of
     * what that one sent.
     *
     * @param array $history
     * @param int $enquiryDocumentId
     * @return array|null
     */
    private static function historyForIssuance(array $history, int $enquiryDocumentId): ?array
    {
        foreach ($history as $row) {
            $meta = json_decode($row["meta"] ?? '', true);
            if ((int) ($meta["enquiry"] ?? 0) === $enquiryDocumentId) {
                return $row;
            }
        }

        // Rows written before the issuance was recorded carry no document id.
        return array_shift($history);
    }

    /**
     * @param $pid
     * @param int $tid
     * @param int $hid
     * @param array $data
     */
    public static function updateHistory($pid, int $tid, int $hid, array $data): void
    {
        self::patch("project/$pid/tender/$tid/history/$hid", $data);
    }

    /**
     * @param int $pid
     * @param int $tid
     * @param int $sid
     * @param int $sender
     * @param int $did
     * @param string $uid
     * @param bool $is_tender_addendum
     * @param string $sent_to
     * @throws \App\Api\Exception
     */
    public static function addHistory(int $pid, int $tid, int $sid, int $sender, int $did, string $uid, bool $is_tender_addendum = false, string $sent_to = ''): void
    {
        $statusId = TenderApi::getHistoryTypes()
            ->filterByField("uid", $uid)
            ->getFirst()
            ->getId();


        $meta = ["document" => [$sid => []], "enquiry" => $did, "is_tender_addendum" => $is_tender_addendum];
        if($sent_to){
            $meta['email_sent_to'] = $sent_to;
        }

        self::post("project/$pid/tender/$tid/history", [
                "specialist_id" => $sid,
                "tender_history_type" => self::ENTITY_TYPE,
                "author_id" => $sender,
                "status_id" => (int)$statusId,
                "meta" => $meta
            ]
        );
    }

    /**
     * A document's position in the tender's run of addendums.
     *
     * @param int $pid
     * @param int $tid
     * @param int $documentId
     * @return int
     */
    public static function getAddendumNumber(int $pid, int $tid, int $documentId): int
    {
        if (!$pid || !$tid) {
            return 0;
        }

        $issued   = self::getIssuedDocumentIds($pid, $tid);
        $position = array_search($documentId, $issued, true);

        // Newest first, so anything after this document was issued before it.
        $earlier = $position === false ? $issued : array_slice($issued, $position + 1);

        // The enquiry opens the run and is not an addendum.
        return max(0, count($earlier) - 1) + 1;
    }

    /**
     * Source document ids issued for a tender, newest first.
     *
     * Every send - the original enquiry and each addendum after it - writes one
     * history row per subcontractor, all carrying the same source document
     * under the meta's `enquiry` key. Collapsing them by that id gives the
     * issuance order, which is what the Schedule of Changes and the addendum's
     * numbered-document inheritance walk back through.
     *
     * Only issuances that reached `sent` count. A row starts as `in_queue` when
     * the send is requested and is transitioned once delivery is confirmed, so
     * anything still mid-flight is not a baseline.
     *
     * @return int[]
     */
    public static function getIssuedDocumentIds(int $pid, int $tid): array
    {
        $statusId = (int) TenderApi::getHistoryTypes()
            ->filterByField("uid", "sent")
            ->getFirst()
            ->getId();

        $results = self::get("project/$pid/tender/$tid/history", [
            "tender_history_type" => self::ENTITY_TYPE,
            "status_id"           => $statusId,
        ]);

        $issued = [];
        foreach (($results ?: []) as $tender) {
            foreach (($tender["history"] ?? []) as $history) {
                if ((int) ($history["status_id"] ?? 0) !== $statusId) {
                    continue;
                }

                $meta = json_decode($history["meta"] ?? '', true);
                $documentId = (int) ($meta["enquiry"] ?? 0);
                if (!$documentId) {
                    continue;
                }

                // The send is dated by its first row; later rows are the same
                // issuance going out to the remaining subcontractors.
                $createdAt = (string) ($history["created_at"] ?? '');
                if (!isset($issued[$documentId]) || strcmp($createdAt, $issued[$documentId]) < 0) {
                    $issued[$documentId] = $createdAt;
                }
            }
        }

        $documentIds = array_keys($issued);
        usort($documentIds, static function (int $a, int $b) use ($issued): int {
            return strcmp($issued[$b], $issued[$a]) ?: ($b <=> $a);
        });

        return $documentIds;
    }

    /**
     * @param int $pid
     * @param int $tid
     * @param int $sid
     * @return array
     * @throws \App\Api\Exception
     */
    public static function getDocuments(int $pid,  int $tid, int $sid) : Collection
    {
        $results = self::get("project/$pid/tender/$tid/history",
            ["tender_history_type" => self::ENTITY_TYPE, "specialist_id" => $sid]
        );
        $documents = [];
        if($results) {
            foreach($results as $tender) {
                foreach($tender["history"] as $history) {
                    $meta = json_decode($history["meta"], true);
                    if($meta && isset($meta["document"]) && isset($meta["document"][$sid])) {
                        $documents[] = array_merge(
                            ["created_at" => $history["created_at"], 'enquiry' => $meta["enquiry"] ?? null],
                            $meta["document"][$sid],
                        );
                    }
                }
            }
        }

        return new Collection($documents, Base::class);
    }
}
