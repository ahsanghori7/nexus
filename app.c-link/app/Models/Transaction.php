<?php

namespace App\Models;

use App\Models\Util;
use App\Api\Account;
use App\Api\Project;
use App\Api\Transactions;
use App\Api\Tender as TenderApi;
use App\Api\Document\Category;
use App\Api\OrderApprover;
use App\Factory\UserFactory;
use App\Models\Signatory as SignatoryModel;
use DateTime;
// use NumberFormatter;
use App\Cron\DocQueue\Order as DocQueueOrder;

class Transaction extends Abstraction
{

    const ENTITY_TYPE = "order_template";
    /* TODO: Remove if we decide to drop draft orders work */
    const TOGGLE_DRAFT_WORK = false;

    protected static array $projectCache = [];

    protected static array $featuresCache = [];

    protected static array $accountFeaturesCache = [];

    protected static array $tenderRecommendationCache = [];

    /**
     * @param string|null $k
     * @return array
     */
    public function getMeta(?string $k = null)
    {
        $meta = $this->getData("meta");
        if (is_string($meta)) {
            $meta = json_decode($meta, true);
        }
        if ($k && $meta) {
            return $meta[$k] ?? false;
        }
        return $meta ?? [];
    }

    /**
     * @param array $ids
     * @return array
     */
    public function getTransactionCountByTenderIds(array $ids = []): array
    {
        foreach ($this->getData() as $transaction) {
            $transactions[$transaction['tender_id']][$transaction['subcontractor_id']][] = $transaction;
        }
        foreach ($ids as $id) {
            $count[$id] = array_map('count', $transactions[$id] ?? []);
        }
        return $count ?? [];
    }

    /**
     * @param int $pid
     * @param int $tidFilter
     * @param int $status
     * @param int $group
     * @return array
     */
    public static function getOrders($pid, $tidFilter = 0, $status = 0, $group = 1): array
    {
        $user_id = UserFactory::getUser()->getId();
        $userAccountId = UserFactory::getUser()->getAccountId();

        //Load all documents that were created from quotes when pressing issue order
        $categories = Category::get("category", [
            "parent_id"   => $pid,
            "entity_type" => self::ENTITY_TYPE
        ]);

        //If there are no documents we will not have any orders
        if (!$categories) {
            return [];
        }

        //Extract data from the order document (tender_ids, quotes, document ids)
        $data = Order::extractDataFromOrder($categories);
        if (empty($data['tids']) || empty($data['dids']) || empty($data['quotes'])) {
            return [];
        }

        $transactionIds = self::getTransactionIdsFromQuotes($data['quotes']);

        //Get transactions based on tenders
        try {
            $transactions = Project::get(sprintf("transaction/tender/[%s]", implode(",", $data['tids'])));
        } catch (\Throwable $th) {
            $transactions = [];
        }
        $orders = Order::getOrderDataFromTenders($transactions);

        //Load signers status for all documents in one call
        $signers_documents = Category::get(sprintf("document/%s/signers", "[" . implode(",", $data['dids']) . "]"));

        //Order history for all tenders in one call
        try {
            $latestOrderHistory = Project::get(sprintf('project/%s/tender/order-history/[%s]', $pid, implode(',', array_values($data['tids']))));
        } catch (\Throwable $th) {
            $latestOrderHistory = [];
        }

        //Get all signatory statuses available
        $signatory_status = Category::get('signatory/status');
        $signed_statuses = array_map(
            function ($item) { return $item['uid'] === 'signed'; },
            $signatory_status ?? []
        );

        //Approvers for all transactions in one call
        $approversRaw = [];
        if ($transactionIds) {
            try {
                $approversRaw = OrderApprover::get(sprintf('order_approver/transactions/grouped/[%s]', implode(',', $transactionIds)));
            } catch (\Throwable $th) {
                $approversRaw = [];
            }
        }

        $signatoryMaps = self::buildSignatoryMaps($signers_documents);

        $approversByTransaction = self::getApproversByTransactionIds($approversRaw, (int)$userAccountId);

        foreach ($categories as $category) {
            //Documents were no longer available in the DB
            if (!isset($category["documents"])) {
                continue;
            }

            $tid    = $category["entity_id"];
            $tenderLabel = $category["label"];

            //If the tender is removed we remove the entry for order as well
            if (!$tid) {
                continue;
            }

            //Filter all tenders by tender id if provided
            if ($tidFilter && (int) $tidFilter !== (int)$tid) {
                continue;
            }

            foreach ($category["documents"] as $doc) {

                //Filter all orders by status if provided
                if ($status && (int) $status !== (int)$doc["status"]) {
                    continue;
                }

                $quote = $data['quotes'][$doc['id']];
                $idQuote = $quote['id'] ?? null;

                if (!$idQuote) {
                    continue;
                }

                $order = $orders[$quote['id']] ?? null;

                //The quote was deleted
                if (!$order) {
                    continue;
                }

                //Get the current document signers status
                $doc_signers = $signers_documents[$doc['id']] ?? [];
                $signers = array_shift($doc_signers);

                $entry_data = [];
                $sid = 0;
                if (isset($quote['subcontractor']['id'])) {
                    $sid = (int)$quote['subcontractor']['id'];
                    $signers_data = self::computeSignatoryData($signers ?? [], $signed_statuses, $user_id, $signatoryMaps);
                    $orderDate = new DateTime($doc["created_at"]);
                    $value = ($order['order_price'] !== 0) ? $order['order_price'] : $quote['price'];
                    $price = Transactions::pennyToFloat(intval($value));

                    $order_number = null;
                    $order_status = 'Draft';
                    $lastHistory = $latestOrderHistory[$tid][$sid] ?? null;
                    if (
                        $lastHistory && $lastHistory["tender_history_type"] === 'Order'
                        && intval($sid) === intval($lastHistory["specialist_id"])
                    ) {
                        $order_status = TenderApi::getHistoryTypes()->filterById($lastHistory["status_id"])->getFirst()->getData("label");
                    } else {
                        $order_status =  Order::getStatus($order, $signers ?? [], $signatory_status);
                    }

                    //The transaction was withdrawn
                    if ((int)$order['status_id'] === Transactions::TRANSACTION_STATUS_WITHDRAWN) {
                        $order_status = 'Withdrew';
                    }

                    $order_number = $order['order_number'] ?? null;
                    $entry_data = [
                        "value" => $price,
                        "order_nr" => $order_number,
                        "order_id" => $quote['id'],
                        'status' => $order_status,
                        "created_at" => $orderDate->format("Y-m-d"),
                    ];

                    $entry_data += [
                        "document"  => [
                            'id'   => (int)$doc['id'],
                            'name' => $doc["name"]
                        ],
                        "subcontractor" => [
                            'id'    => $sid,
                            'name'  => $quote['subcontractor']['name'] ?? '',
                            'email' => $quote['subcontractor']['email'] ?? ''
                        ],
                        "signatory" => [
                            'total'    => count($signers['signer'] ?? []),
                            'signers'  => $signers_data['total'],
                            'can_sign' => $signers_data['can_sign'],
                        ],
                        'status'    => $order_status,
                        "created_at"  => $orderDate->format("Y-m-d"),
                        "assigned_approvers" => $approversByTransaction[$quote['id']] ?? [],
                    ];
                }

                if (empty($entry_data)) {
                    continue;
                }

                $response[$tid]['tender'] = [
                    'id'    => $tid,
                    'label' => $tenderLabel
                ];

                //Check to see if we need to group the orders by subcontractor id
                if ($group && $group !== "false") {
                    $response[$tid]['entries'][$sid] = $entry_data;
                } else {
                    $response[$tid]['entries'][$sid . $doc['name']] = $entry_data;
                }
            }
            $entries = array_values($response[$tid]['entries'] ?? []);
            if ($entries) {
                $response[$tid]['entries'] = $entries;
            }
        }

        return $response ?? [];
    }

    /**
     * @param array $quotes
     * @return array
     */
    protected static function getTransactionIdsFromQuotes(array $quotes): array
    {
        return array_values(array_unique(array_filter(array_map(
            static function ($quote) {
                return $quote['id'] ?? null;
            },
            $quotes
        ))));
    }

    /**
     * Accepts already-fetched raw approvers array and enriches each row with its
     * approver_user object. Users and roles are fetched concurrently.
     *
     * @param array $approvers  Raw data from order_approver/transactions/grouped/[ids]
     * @param int   $userAccountId
     * @return array
     */
    protected static function getApproversByTransactionIds(array $approvers, int $userAccountId): array
    {
        if (!is_array($approvers) || !$approvers) {
            return [];
        }

        $userIds = [];
        foreach ($approvers as $rows) {
            if (is_array($rows)) {
                $userIds = array_merge($userIds, array_column($rows, 'approver_user_id'));
            }
        }
        $userIds = array_values(array_unique(array_filter($userIds)));

        if (!$userIds) {
            return $approvers;
        }

        $userMap = self::getApproverUserMap($userIds, $userAccountId);
        foreach ($approvers as $transactionId => $rows) {
            foreach ($rows as $index => $row) {
                $approverId = $row['approver_user_id'] ?? null;
                if ($approverId && isset($userMap[$approverId])) {
                    $approvers[$transactionId][$index]['approver_user'] = $userMap[$approverId];
                }
            }
        }

        return $approvers;
    }

    /**
     * Fetches approver users and role definitions, then builds a userId→user map with the
     * role embedded. Enrichment is best-effort: a user-lookup failure returns an empty map
     * rather than failing the whole endpoint.
     *
     * @param array $userIds
     * @param int $userAccountId
     * @return array
     */
    protected static function getApproverUserMap(array $userIds, int $userAccountId): array
    {
        if (!$userIds) {
            return [];
        }

        // Approver enrichment is optional — a lookup failure must not fail the whole endpoint
        try {
            $users = Account::get(sprintf('user/[%s]', implode(',', $userIds)));
        } catch (\Throwable $th) {
            return [];
        }
        $users = is_array($users) ? $users : [];

        try {
            $roles = Account::get('roles/roles-level');
        } catch (\Throwable $th) {
            $roles = [];
        }
        $roles = is_array($roles) ? $roles : [];

        $accountUsers = [];
        if (isset($users[$userAccountId]) && is_array($users[$userAccountId])) {
            $accountUsers = $users[$userAccountId];
        } elseif (is_array($users)) {
            $firstValue = reset($users);
            $accountUsers = is_array($firstValue) ? $firstValue : [];
        }

        $roleMap = [];
        foreach ($roles as $role) {
            $roleMap[$role['id']] = $role;
        }

        $userMap = [];
        foreach ($accountUsers as $user) {
            $user['role'] = $roleMap[$user['type_id']] ?? [];
            $userMap[$user['id']] = $user;
        }

        return $userMap;
    }

    /**
     * @param array $transaction
     * @param int $did
     * @param string $status
     * @param array|string[] $types
     * @return array
     */
    public static function setMetaDocumentStatus(array $transaction, int $did, string $status, array $types = ['withdrew', 'sent']): array
    {
        $meta = json_decode($transaction['meta'] ?? '', true);
        foreach ($types as $type) {
            if (isset($meta[$type])) {
                $index = array_search($did, $meta[$type], false);
                if (is_numeric($index)) {
                    unset($meta[$type][$index]);
                }
                $meta[$type] = array_values($meta[$type]);
            }
        }
        $meta[$status][] = $did;

        return $meta;
    }

    /**
     * @param array $args
     * @return string
     * @throws \App\Api\Exception
     */
    public function getOrderValue(array $args = []): string
    {
        $transaction = $this->getData();
        $tender = $transaction['tender'] ?? null;
        $tid = $tender['id'] ?? null;
        $pid = $tender['project_id'] ?? null;
        $project = self::getCachedProject((int)$pid);
        $aid = $project['group_id'] ?? null;

        if ($aid) {
            $featureName = "TENDER_RECOMMENDATION";
            $features = self::getCachedFeatures();
            $index = array_search($featureName, array_column($features, 'name'));
            $feature = $features[$index] ?? null;
            $idFeature = $feature['id'] ?? null;

            $featuresAccount = self::getCachedAccountFeatures((int)$aid);
            $filteredFeatures = array_filter($featuresAccount, function ($item) use ($idFeature) {
                return (int)$item['feature_id'] === (int)$idFeature;
            });

            if (count($filteredFeatures)) { // TENDER_RECOMMENDATION featur is enabled for the account
                $tenderRecommendation = self::getCachedTenderRecommendation((int)$pid);
                $specificTenderRecommendation = array_filter($tenderRecommendation, function ($item) use ($tid) {
                    return (int)$item['tender_id'] === (int)$tid;
                });
                $sourceKey = count($specificTenderRecommendation) ? 'forecast' : 'price';
                $price = $transaction[$sourceKey] ?? 0;
            } else {
                $price = $transaction["price"] ?? 0;
            }

            return Util::getTextPennyValue(intval($price));

            // TODO: Uncomment this when the version ubuntu in the server increase to 22 to be able to use the class NumberFormatter
            // $currencyFormatter = new NumberFormatter('en_GB', NumberFormatter::CURRENCY);
            // $wordFormatter = new NumberFormatter('en_GB', NumberFormatter::SPELLOUT);
            // $priceFormatted = $currencyFormatter->formatCurrency($price, 'GBP');
            // $wordsFormatted = ucfirst($wordFormatter->format($price));
            // return $priceFormatted . " - " . $wordsFormatted . " pounds";
        }
        return "";
    }

    /**
     * @param int $pid
     * @return array
     */
    public static function getCachedProject(int $pid): array
    {
        if ($pid && !isset(self::$projectCache[$pid])) {
            self::$projectCache[$pid] = Project::get("project/$pid");
        }

        return self::$projectCache[$pid] ?? [];
    }

    /**
     * @return array
     */
    public static function getCachedFeatures(): array
    {
        if (empty(self::$featuresCache)) {
            self::$featuresCache = Account::get("feature");
        }

        return self::$featuresCache;
    }

    /**
     * @param int $aid
     * @return array
     */
    public static function getCachedAccountFeatures(int $aid): array
    {
        if ($aid && !isset(self::$accountFeaturesCache[$aid])) {
            self::$accountFeaturesCache[$aid] = Account::get("feature/accounts/" . $aid);
        }

        return self::$accountFeaturesCache[$aid] ?? [];
    }

    /**
     * @param int $pid
     * @return array
     */
    public static function getCachedTenderRecommendation(int $pid): array
    {
        if ($pid && !isset(self::$tenderRecommendationCache[$pid])) {
            self::$tenderRecommendationCache[$pid] = Project::get("project/$pid/tender_recommendation");
        }

        return self::$tenderRecommendationCache[$pid] ?? [];
    }

    /**
     * Pre-fetch all document meta, users and accounts needed for signatory ordering in a few
     * bulk HTTP calls. Eliminates the per-document Document::load() + per-signer getUser() +
     * per-document getAccounts()/loadUsersByIds() calls that DocCreator::getSignatoryOrderFromDocumentCreator()
     * and Signatory::getSigners() make.
     *
     * Returns:
     *   'order'       => [docId => [ordered_user_ids]]  — signing order per document
     *   'valid_users' => [userId => true]               — users that exist (deleted users excluded)
     *
     * @param array $signers_documents Bulk signers response keyed by document ID
     * @return array{order: array, valid_users: array}
     */
    protected static function buildSignatoryMaps(array $signers_documents): array
    {
        // Signing order lives in the document meta (values.signature_*); load it for every
        // document with signers in one bulk call instead of a Document::load() per document.
        $docIdsWithSigners = [];
        foreach ($signers_documents as $docId => $rows) {
            $rowsArr  = (array) $rows;
            $firstRow = reset($rowsArr);
            if ($firstRow && !empty($firstRow['signer'])) {
                $docIdsWithSigners[] = (int) $docId;
            }
        }

        $signatureUidsByDoc = [];
        $returnedDocIds     = [];
        // Chunk the id list so the request URL stays within server limits on large projects.
        // A failure propagates (matches the original per-document Document::load behaviour).
        foreach (array_chunk($docIdsWithSigners, 100) as $docIdChunk) {
            $docs = \App\Api\Document::get("document", ["ids" => $docIdChunk]);
            foreach ((array) $docs as $docRow) {
                $returnedDocIds[(int) $docRow['id']] = true;
                $meta = $docRow['meta'] ?? [];
                if (is_string($meta)) {
                    $meta = json_decode($meta, true) ?: [];
                }
                $values = $meta['values'] ?? [];
                $uids = array_values(array_filter(array_map('intval',
                    array_filter($values, static function ($k) {
                        return strpos((string) $k, 'signature_') === 0;
                    }, ARRAY_FILTER_USE_KEY)
                )));
                if ($uids) {
                    $signatureUidsByDoc[(int) $docRow['id']] = $uids;
                }
            }
        }

        // A partial response would silently drop a document's signing order — fail loudly instead
        $missingDocs = array_diff($docIdsWithSigners, array_keys($returnedDocIds));
        if ($missingDocs) {
            throw new \RuntimeException(
                'Transaction::buildSignatoryMaps: document meta missing for ids [' . implode(',', $missingDocs) . ']'
            );
        }

        // Collect signer user IDs for the bulk user fetch
        $signerUserIds = [];
        foreach ($signers_documents as $rows) {
            foreach ((array) $rows as $row) {
                foreach ($row['signer'] ?? [] as $signer) {
                    $uid = (int) ($signer['signer_user_id'] ?? 0);
                    if ($uid) {
                        $signerUserIds[] = $uid;
                    }
                }
            }
        }

        $allUids = array_values(array_unique(array_filter(array_merge(
            array_merge(...(array_values($signatureUidsByDoc) ?: [[]])),
            $signerUserIds
        ))));

        if (!$allUids) {
            return ['order' => [], 'valid_users' => []];
        }

        // Bulk user fetch — chunked to respect the id-list limit, then merged
        $users = [];
        foreach (array_chunk($allUids, 75) as $chunk) {
            try {
                $chunkResult = Account::loadUsersByIds($chunk);
            } catch (\Throwable $th) {
                throw new \RuntimeException(
                    'Transaction::buildSignatoryMaps failed to load signatory users: ' . $th->getMessage(),
                    0,
                    $th
                );
            }
            if (is_array($chunkResult)) {
                $users = array_merge($users, $chunkResult);
            }
        }
        // Empty result means all users were deleted — acceptable, signing order will be empty
        if (!$users) {
            return ['order' => [], 'valid_users' => []];
        }

        // Bulk account fetch — getAccounts() already chunks internally
        $accountIds = array_values(array_unique(array_filter(array_column($users, 'account_id'))));
        try {
            $accounts = $accountIds ? Account::getAccounts($accountIds) : [];
        } catch (\Throwable $th) {
            throw new \RuntimeException(
                'Transaction::buildSignatoryMaps failed to load signatory accounts: ' . $th->getMessage(),
                0,
                $th
            );
        }

        $specialistTypes = Account::getSpecialistTypes();
        $userById        = array_column($users, null, 'id');

        // Replicates DocCreator::getSignatoryOrderFromDocumentCreator() per document (in-memory)
        $orderByDoc = [];
        foreach ($signatureUidsByDoc as $docId => $uids) {
            // Accounts present among this document's loaded signature users
            $docAccIds = [];
            foreach ($uids as $uid) {
                $accId = (int) ($userById[$uid]['account_id'] ?? 0);
                if ($accId) {
                    $docAccIds[$accId] = true;
                }
            }
            // Contractor = last non-specialist account in getAccounts() response order,
            // mirroring DocCreator's `foreach ($accounts as $account)` overwrite (last wins).
            $contractorAccountId = null;
            foreach ($accounts as $accId => $acc) {
                if (isset($docAccIds[(int) $accId]) && !Account::isTypeOf((int) $acc['type_id'], $specialistTypes)) {
                    $contractorAccountId = (int) $accId;
                }
            }

            $grouped = ['contractor' => [], 'subcontractor' => []];
            foreach ($uids as $index => $uid) {
                if (!isset($userById[$uid])) {
                    // Deleted/removed user — excluded from the order, matching DocCreator which
                    // iterates only the users returned by loadUsersByIds.
                    continue;
                }
                $accId = $userById[$uid]['account_id'] ?? null;
                $type  = ($accId && (int) $accId === $contractorAccountId) ? 'contractor' : 'subcontractor';
                $grouped[$type][$index] = $uid;
            }
            ksort($grouped['contractor']);
            ksort($grouped['subcontractor']);
            $orderByDoc[$docId] = array_values(array_merge($grouped['contractor'], $grouped['subcontractor']));
        }

        return [
            'order'       => $orderByDoc,
            'valid_users' => array_flip(array_column($users, 'id')),
        ];
    }

    /**
     * Computes signatory data for one document using pre-built maps instead of HTTP calls.
     * Replicates Signatory::getSigners() logic — same return shape: ['total' => int, 'can_sign' => bool].
     * 'total' is the count of signers who have already signed (not total signers).
     *
     * @param array $signers        One row from $signers_documents (has 'document_id' and 'signer' keys)
     * @param array $signed_statuses Boolean-mapped status array from getOrders() (processed same as getSigners())
     * @param int   $user_id        Current user ID
     * @param array $signatoryMaps  Output of buildSignatoryMaps()
     * @return array{total: int, can_sign: bool}
     */
    protected static function computeSignatoryData(
        array $signers,
        array $signed_statuses,
        int $user_id,
        array $signatoryMaps
    ): array {
        $return = ['total' => 0, 'can_sign' => false];

        if (empty($signers['signer'])) {
            return $return;
        }

        // Mirror the processing in Signatory::getSigners() to keep identical semantics
        $signature_status = array_map('intval', array_values(array_filter($signed_statuses)));
        $docId            = (int) ($signers['document_id'] ?? 0);
        $signer_user_ids  = $signatoryMaps['order'][$docId] ?? [];
        $validUsers       = $signatoryMaps['valid_users'];

        $total            = 0;
        $signatory_orders = [];

        foreach ($signers['signer'] as $signer) {
            $sid = (int) ($signer['signer_user_id'] ?? 0);
            if (!$sid || !isset($validUsers[$sid])) {
                // User deleted from team — skip, matching AccountApi::getUser() === null check
                continue;
            }
            $signatory_order = SignatoryModel::getSignatoryOrderId($sid, $signer_user_ids);
            if (!in_array((int) $signer['signer_status_id'], $signature_status, true)) {
                $signatory_orders[$signatory_order] = [
                    'user_id'   => $sid,
                    'status_id' => $signer['signer_status_id'],
                ];
            } else {
                $return['total']++;
            }
            $total++;
        }

        if ($signatory_orders) {
            ksort($signatory_orders);
            $signers_pending = 0;
            foreach ($signatory_orders as $item) {
                if (!in_array((int) $item['status_id'], $signature_status, true)) {
                    $signers_pending++;
                }
                if ((int) $item['user_id'] === $user_id) {
                    $return['can_sign'] = $signers_pending === 1;
                }
            }
        }

        return $return + ['total' => $total];
    }
}
