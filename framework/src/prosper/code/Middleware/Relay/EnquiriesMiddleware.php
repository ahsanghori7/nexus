<?php

namespace Prosper\Middleware\Relay;

use Api\Middleware\LogsMiddleware;
use Api\Middleware\MilestoneMiddleware;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Exception\RestException;
use Prosper\Middleware\EmailMiddleware;
use Core\Service\Manager;
use Core\Middleware\Generic;
use Core\Data\Collection as CollectionClass;
use CURLFile;
use Core\Config;
use Prosper\Model\Document as DocumentModel;
use Core\Middleware\Collection as CollectionMiddleware;
use Prosper\Model\Signatory;

class EnquiriesMiddleware
{

    public const ENQUIRY_SENT_ID = 1;
    public const TRANSACTION_SENT_ID = 1;
    public const TRANSACTION_WITHDRAW_ID = 2;
    public const TENDER_STATUS_DECLINED = 2;

    /**
     * @param string $key
     * @param string $sortBy
     * @return callable
     */
    public static function loadCollection(string $key = "collection", string $sortBy = ''): callable
    {
        return function ($action) use ($key, $sortBy) {
            $user = $action->getShape("session")->getShape("user");
            $aid = $user->get("account_id");

            try {
                $filter = [
                    'specialist_id' => $aid,
                ];
                if ($sortBy) {
                    $filter['sortBy'] = $sortBy;
                }
                $data = Manager::getService('project')->fetch("tender", $filter)->getCollection('data');
            } catch (\Exception $e) {
                $data = [];
            }
            $action->set("subcontractor", ['aid' => $aid]);
            $action->set($key, $data);
        };
    }

    /**
     * @return callable
     */
    public static function loadOrders(string $tenderIdsKey = ''): callable
    {
        return function ($action) use ($tenderIdsKey) {
            try {
                $filter = ['tender_history_type' => 'Order'];
                if ($tenderIdsKey) {
                    $ids = $action->get($tenderIdsKey, []);
                    if (!$ids) {
                        $action->set("orders", new CollectionClass([], Shape::class));
                        return;
                    }
                    $filter['tender_ids'] = '[' . implode(',', $ids) . ']';
                }
                $data = Manager::getService('project')->fetch("tender/history", $filter)->getCollection('data');
            } catch (\Exception $e) {
                $data = [];
            }
            $action->set("orders", $data);
        };
    }

    /**
     * @return callable
     */
    public static function loadCollectionTenderIds(): callable
    {
        return function ($action) {
            $tender_ids = [];
            array_map(function ($project) use (&$tender_ids) {
                $project = new Shape($project);
                $tender_ids = array_merge($tender_ids,  array_keys($project->get("tender")));
            }, $action->getCollection("collection")->getItemsAsArray());
            $action->set("tender_ids", $tender_ids);
        };
    }

    /**
     * @param string $keyTenderIds
     * @return callable
     */
    public static function loadTransactionsByTenderIds(string $keyTenderIds = 'tender_ids'): callable
    {
        return function ($action) use ($keyTenderIds) {
            $ids = $action->get($keyTenderIds, []);
            $ids = implode(",", $ids);
            try {
                $data = Manager::getService('project')->fetch("transaction/tender/[$ids]")->getCollection('data');
            } catch (\Exception $e) {
                $data = [];
            }
            $action->set("transactions", $data);
        };
    }

    /**
     * @param string $subcontractorIdKey
     * @return callable
     */
    public static function loadTransactionsBySubcontractorId(string $subcontractorIdKey = 'id'): callable
    {
        return function ($action) use ($subcontractorIdKey) {
            try {
                $data = Manager::getService('project')->fetch("transaction", ['subcontractor_id' => (int)$action->get($subcontractorIdKey)])->getCollection('data');
            } catch (\Exception $e) {
                $data = [];
            }
            $action->set("transactions", $data);
        };
    }

    /**
     * @return callable
     */
    public static function validateData(): callable
    {
        return function ($action) {
            if (!(in_array((int)$action->getShape("body")->get("status_id"), $action->get("status.allowed")->get(), true))) {
                throw new MiddlewareException("invalid_enquiry_allowed_status", "Enquiry status is not allowed");
            }
        };
    }

    /**
     * @return callable
     */
    public static function loadSubcontractor(): callable
    {
        return function ($action) {
            $user = $action->getShape("session")->getShape("user");
            $account = $action->getShape("session")->getShape("account");
            $action->set("subcontractor", [
                'id'           => $user->get("id"),
                'aid'          => $user->get("account_id"),
                'name'         => $account->get("name"),
                'display_name' => $user->get("display_name"),
                'email'        => $user->get("email"),
                'subscription' => $account->get("membership.subscription_id")
            ]);
        };
    }

    /**
     * @param string $dataKey
     * @return callable
     */
    public static function loadEnquiry(string $dataKey = 'uriArgs.id'): callable
    {
        return function ($action) use ($dataKey) {
            $data = Manager::getService('project')->fetch("tender/" . (int)$action->get($dataKey))->getCollection('data');
            $action->set("enquiry", $data);
        };
    }

    /**
     * @return \Closure
     */
    public static function getCollectionDocuments(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                $aid = $action->get("subcontractor.aid");
                $transactions = [];
                $loadedTransactions = $action->get("transactions");
                if ($loadedTransactions instanceof CollectionClass) {
                    $transactions = self::indexCollectionByIntField(
                        $loadedTransactions->filter(function ($t) use ($aid) {
                            return intval($t->get("subcontractor_id")) === intval($aid);
                        }),
                        "tender_id"
                    );
                }
                $items = $collection->getItemsAsArray();
                foreach ($items as &$item) {
                    try {
                        if (!is_array($item)) {
                            continue;
                        }

                        $itemShape = new Shape($item);
                        if ($history = $itemShape->get("history", [])) {
                            $enquiries = ['enquiry' => null, 'tender_addendum' => null, 'order' => null];
                            (new CollectionClass($history, Shape::class))->map(function ($i) use ($aid, &$enquiries) {
                                $historyItems = $i->get();
                                if (!is_array($historyItems)) {
                                    return;
                                }

                                array_map(function ($history_i) use ($aid, &$enquiries) {
                                    if (is_array($history_i)) {
                                        $history_i = new Shape($history_i);
                                        if ($history_i->get("meta", "")) {
                                            $meta = json_decode($history_i->get("meta", ""), true);
                                            if (!is_array($meta)) {
                                                return;
                                            }
                                            $documentModel = new DocumentModel($meta['document'] ?? [], $aid);
                                            if ($id = $documentModel->getID()) {
                                                $type = $documentModel->getType();
                                                if ($type === 'enquiry') {
                                                    $newDate = $history_i->get("created_at");
                                                    $currentDate = $enquiries['enquiry']['date'] ?? null;
                                                    if (!$currentDate || ($newDate && $newDate >= $currentDate)) {
                                                        $enquiries['enquiry'] = [
                                                            'id'  => $id,
                                                            'date' => $newDate,
                                                            'has_boq' => $meta['boq_available'] ?? false
                                                        ];
                                                    }
                                                } else {
                                                    $enquiries[$type][] = [
                                                        'id'  => $id,
                                                        'date' => $history_i->get("created_at"),
                                                        'has_boq' => $meta['boq_available'] ?? false
                                                    ];
                                                }
                                            }
                                        }
                                    }
                                }, $historyItems);
                            });

                            $transaction = $transactions[(int)($item["tid"] ?? 0)][0] ?? null;
                            if ($transaction) {
                                $meta = $transaction->get("meta");
                                $doc = $meta ? json_decode($meta, true) : null;
                                $order = is_array($doc) ? [
                                    "id" => $doc["document"]["id"] ?? null,
                                    "transaction_id" => $doc["transaction_id"] ?? null,
                                    "order_template_id" => $doc["order_template_id"] ?? null,
                                    "date" => $transaction->get("order_created"),
                                    "url"  => $doc["document"]["url"] ?? null
                                ] : null;
                                $enquiries['order'] = $order;
                                $item["order_created"] = $transaction->get("order_created");
                                $item["order_price"] = $transaction->get("order_price");
                            }
                            $item["document"] = $enquiries;
                        }
                    } catch (\Throwable $e) {
                        $item["order_created"] = $item["order_created"] ?? null;
                        $item["order_price"] = $item["order_price"] ?? 0;
                    }
                }
                unset($item);

                $action->set("collection", new CollectionClass($items, Shape::class));
            }
        };
    }

    /**
     * @return \Closure
     */
    public static function getSignatoryData(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                $documents = $collection->filter(function ($item) {
                    $document = $item->get("document", []);
                    return !empty($document["order"]["order_template_id"]);
                });
                if ($documents->count()) {
                    $documents = array_values(array_unique(array_map(function ($doc) {
                        return intval($doc["order"]["order_template_id"]);
                    }, $documents->values("document"))));
                    $signers = $action->get("signers_by_order_template", []);
                    $missingDocuments = array_values(array_diff($documents, array_keys($signers)));
                    if ($missingDocuments) {
                        $signedStatus = Signatory::getSignatories("signed");
                        $signers += Signatory::getAllSigners($missingDocuments, $signedStatus->toArray());
                    }
                    $collection->update(function ($item) use ($signers) {
                        $isArray = is_array($item);
                        if ($isArray) {
                            $item = new Shape($item);
                        }

                        if ($document = $item->get("document", [])) {
                            $orderTemplateId = intval($document["order"]["order_template_id"] ?? 0);
                            if (!$orderTemplateId) {
                                return $isArray ? $item->toArray() : $item;
                            }

                            $signerData = $signers[$orderTemplateId] ?? [];
                            if ($signerData) {
                                $document["order"]["signatory"] = $signerData;
                                $item->set("document", $document);
                            }
                            return $isArray ? $item->toArray() : $item;
                        }
                        return $isArray ? $item->toArray() : $item;
                    });
                }
            }
        };
    }

    /**
     * @param string $limitKey
     * @param string $showInterests
     * @return callable
     * @TODO this needs a serious refactoring as it is bloatware and is very hard to keep tracking of everything
     */
    public static function processEnquiriesAndInterest(string $limitKey = '', string $showInterests = ''): callable
    {
        return function ($action) use ($limitKey, $showInterests) {
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                $history_statuses = $action->get("history");
                date_default_timezone_set('Europe/London');
                $nr = 0;
                $orders          = $action->get("orders");
                $transactions    = $action->get("transactions");
                $ordersByTender = ($orders instanceof CollectionClass) ? self::indexCollectionByIntField($orders, "tender_id") : [];
                $transactionsByTender = ($transactions instanceof CollectionClass) ? self::indexCollectionByIntField($transactions, "tender_id") : [];
                $subcontractorAid = $action->get("subcontractor.aid");
                $hasCurrentSubcontractorTransaction = ($transactions instanceof CollectionClass) &&
                    $transactions->filterByStringField("subcontractor_id", $subcontractorAid)->count();
                $sent_status = $history_statuses->filterByField('uid', 'sent')->getFirst();
                $addedStatusIds = $history_statuses->filterByField('uid', 'added')->values("id");
                $awarded = $history_statuses->filterByField('uid', 'awarded')->getFirst();
                $historyStatusById = self::indexCollectionByIntField($history_statuses, "id");
                $regionsById = self::indexCollectionByIntField($action->get("regions"), "id");
                $projectConstants = $action->get("constants")->getItems()['project'];
                $insurances = $projectConstants->get("insurances");
                $projectStatuses = $projectConstants->get("phase");
                $types = $projectConstants->get("type");

                foreach ($collection->getItemsAsArray() as $items) {
                    foreach ($items['tender'] as $tid => $tender) {
                        $signatory = [];
                        if (!isset($enquiries[$tid])) {
                            $enquiries[$tid] = new Shape([]);
                        }

                        $dataToShow = null;
                        $history = [];
                        $interest = null;
                        $enquiry = null;
                        $order = null;
                        $type = "";

                        if (isset($tender['Enquiry'])) {
                            $enquiry = end($tender['Enquiry']);
                            if (in_array((int)$enquiry['last_status'], $addedStatusIds, true)) {
                                $enquiry = null;
                            } else {
                                $history[] = ($enquiry['history']);
                                $updatedAt = end($enquiry['history'])['created_at'];
                                $dataToShow = $enquiry;
                                $type = "Enquiry";
                            }
                        }

                        if (isset($tender['Interest'])) {
                            $interest = end($tender['Interest']);
                            $history[] = end($interest['history']);
                            $updatedAt = end($interest['history'])['created_at'];
                            $dataToShow = $interest;
                            $type = "Interest";
                        }

                        if (!$showInterests && $type === 'Interest') {
                            $enquiry = null;
                            continue;
                        }

                        if (!is_null($interest) && !is_null($enquiry)) {
                            $historyInterest = array_shift($interest['history']);
                            $historyEnquiry = array_shift($enquiry['history']);
                            $dateTimestampInterest = strtotime($historyInterest["created_at"]);
                            $dateTimestampEnquiry = strtotime($historyEnquiry["created_at"]);

                            $interestByDate = $dateTimestampInterest > $dateTimestampEnquiry;
                            $type = ($interestByDate) ? "Interest" : "Enquiry";
                            $history[] = ($interestByDate) ? $historyInterest : $historyEnquiry;

                            $updatedAt = end($history)['created_at'];
                            $dataToShow = ($interestByDate) ? $interest : $enquiry;
                        }

                        if (isset($tender['Order'])) {
                            $type = "Order";
                            $order = array_shift($tender[$type]);
                            $history[] = end($order['history']);
                            $updatedAt = end($order['history'])['created_at'];
                            $dataToShow = $order;
                        }

                        $awarded_externally = false;

                        //check if the order is withdrawn
                        if (isset($transactionsByTender[(int)$tid])) {
                            if ($hasCurrentSubcontractorTransaction) {
                                $transaction_found = $transactionsByTender[(int)$tid][0]->toArray();
                                if ((int)$transaction_found['status_id'] === self::TRANSACTION_WITHDRAW_ID) {
                                    $dataToShow['last_status'] = $awarded->get("id");
                                }
                            }
                        }

                        if ($tender['awarded']) {
                            if ($ordersByTender) {
                                if (isset($ordersByTender[(int)$tid])) {
                                    $order_found = end($ordersByTender[(int)$tid]);
                                    $awarded_externally = $order_found->get("specialist_id") != $subcontractorAid;
                                } else {
                                    $order_found = null;
                                }

                                if ($transactionsByTender) {
                                    if (isset($transactionsByTender[(int)$tid])) {
                                        $transactions_items = array_map(function ($item) {
                                            return $item->toArray();
                                        }, $transactionsByTender[(int)$tid]);
                                        uasort($transactions_items, function ($a, $b) {
                                            return ($b['order_updated'] ?? null) <=> ($a['order_updated'] ?? null);
                                        });
                                        $transaction_found = array_shift($transactions_items);
                                        $transaction_found = new Shape($transaction_found);
                                        if ($transaction_found->get("price")) {

                                            if (!isset($order_found) || (strtotime($transaction_found->get("order_updated")) > strtotime($order_found->get("created_at")))) {

                                                $awarded_externally = $transaction_found->get("subcontractor_id") != $subcontractorAid;
                                            }
                                        }

                                    }
                                }
                            }
                        }

                        if (is_null($dataToShow) || !count($history)) {
                            unset($enquiries[$tid]);
                            continue;
                        }

                        if ($action->get($showInterests) === "false" && $type === 'Interest') {
                            unset($enquiries[$tid]);
                            continue;
                        }

                        if ($limit = $action->get($limitKey)) {
                            if ($nr >= $limit) {
                                unset($enquiries[$tid]);
                                continue;
                            }
                            $nr++;
                        }

                        $history_first = new Shape([]);
                        if (!is_null($enquiry)) {
                            (new CollectionClass($enquiry['history'], Shape::class))->map(function ($item) use (&$history_first, $sent_status) {
                                if ((int)$item->get("status_id") === $sent_status->get("id")) {
                                    $history_first = $item;
                                }
                            });
                        }

                        $insurance = $insurances[intval($items['employer_liabilty_insurance'])] ?? "";
                        $projectStatus = $projectStatuses[intval($items['phase'])] ?? "";
                        $projectType = $types[intval($items['type'])] ?? "";
                        $region = $regionsById[(int)$items['region']][0] ?? new Shape([]);

                        $status = $historyStatusById[(int)$dataToShow['last_status']][0] ?? new Shape([]);
                        $statusLabel = $status->get("prosper_label");
                        $statusLabel = $statusLabel ? $statusLabel : $status->get("label");
                        $createdAt = $history_first->get('created_at', date("Y-m-d H:i:s"));
                        if (!isset($updatedAt)) {
                            $updatedAt = $createdAt;
                        }
                        $history_first->set("created_at", date('Y-m-d H:i:s', strtotime(strval($createdAt) . " UTC") ?: null));

                        $enquiries[$tid]->setItems(
                            [
                                'name'          => $items['name'],
                                "tid"           => $tid,
                                'slug'          => $items['slug'],
                                'label'         => $tender['label'],
                                'project_id'    => $tender['project_id'],
                                'group_id'      => $items['group_id'],
                                'author_id'     => $items['project_creator'],
                                'history'       => $history,
                                'history_first' => $history_first->toArray(),
                                'awarded'       => $tender['awarded'],
                                'awarded_externally' => $awarded_externally,
                                'service'       => $tender['service'],
                                'size'          => $tender['size'],
                                'send_date'     => $tender['send_date'],
                                'tender_return' => $tender['tender_return'],
                                'start_on_site' => $tender['start_on_site'],
                                'decision_date' => $tender['decision_date'],
                                'project_status' => $projectStatus,
                                'signatory'      => $signatory ?? [],
                                'project_start' => $items['start'],
                                'project_completion' => $items['end'],
                                'project_type' => $projectType,
                                'project_region' => $region->get("label"),
                                'type'          => $type,
                                'employer_liabilty_insurance' => $insurance,
                                'status'        => $statusLabel,
                                'status_id'     => $dataToShow['last_status'],
                                'created_at'    => date('Y-m-d H:i:s', strtotime(strval($createdAt) . " UTC") ?: null),
                                'updated_at'    => date('Y-m-d H:i:s', strtotime(strval($updatedAt) . " UTC") ?: null),
                                'time_past'     => Generic::timePast(date("Y-m-d H:i:s"), $updatedAt) . " ago",
                            ]
                        );
                    }
                }
                $action->setItems([
                    'collection'    => new CollectionClass($enquiries ?? [], $collection->getObjectClass()),
                ]);
            }
        };
    }

    /**
     * Populate the legacy top-level signatory summary after the final collection
     * has been sliced, avoiding document-service calls for records that will not
     * be returned.
     */
    public static function loadSignatorySummaries(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");
            $transactions = $action->get("transactions");
            $orders = $action->get("orders");
            if (
                !$collection->count() ||
                !($transactions instanceof CollectionClass) ||
                !($orders instanceof CollectionClass) ||
                !$orders->count()
            ) {
                return;
            }

            $transactionsByTender = self::indexCollectionByIntField($transactions, "tender_id");
            $documentIdsByTender = [];
            $documentIds = [];

            foreach ($collection->getItems() as $item) {
                if (!$item->get("awarded")) {
                    continue;
                }

                $tid = (int)$item->get("tid");
                if (!isset($transactionsByTender[$tid])) {
                    continue;
                }

                $transactionItems = array_map(function ($transaction) {
                    return $transaction->toArray();
                }, $transactionsByTender[$tid]);

                uasort($transactionItems, function ($a, $b) {
                    return ($b['order_updated'] ?? null) <=> ($a['order_updated'] ?? null);
                });

                $transaction = array_shift($transactionItems);
                if (!$transaction) {
                    continue;
                }

                $meta = json_decode($transaction['meta'] ?? '', true);
                if (!is_array($meta)) {
                    continue;
                }

                $templateId = (int)($meta['order_template_id'] ?? 0);
                if ($templateId) {
                    $documentIdsByTender[$tid] = $templateId;
                    $documentIds[$templateId] = $templateId;
                }
            }

            if (!$documentIds) {
                return;
            }

            $user = $action->getShape("session")->getShape("user");
            $signedStatus = Signatory::getSignatories("signed");
            $signers = Signatory::getAllSignerSummaries(array_values($documentIds), $signedStatus->toArray(), (int)$user->get("id"));
            $signerCounts = [];
            foreach ($signers as $documentId => $signer) {
                $signerCounts[$documentId] = [
                    'total'   => $signer['total'] ?? 0,
                    'signers' => $signer['signers'] ?? 0,
                ];
            }
            $action->set("signers_by_order_template", $signerCounts);

            $collection->update(function ($item) use ($documentIdsByTender, $signers) {
                $isArray = is_array($item);
                if ($isArray) {
                    $item = new Shape($item);
                }

                $documentId = $documentIdsByTender[(int)$item->get("tid")] ?? null;
                if (!$documentId || !isset($signers[$documentId])) {
                    return $isArray ? $item->toArray() : $item;
                }

                if (empty($signers[$documentId]['total']) && empty($signers[$documentId]['signers'])) {
                    return $isArray ? $item->toArray() : $item;
                }

                $item->set("signatory", [
                    'total'    => $signers[$documentId]['total'],
                    'signers'  => $signers[$documentId]['signers'],
                    'can_sign' => $signers[$documentId]['can_sign'] ?? false,
                ]);

                return $isArray ? $item->toArray() : $item;
            });
        };
    }

    public static function limitLatestCollection(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");
            $items = $collection->getItemsAsArray();
            if (!$items) {
                return;
            }

            usort($items, function($a, $b) {
                $getDate = function($item) {
                    return $item['document']['order']['date'] ?? $item['document']['enquiry']['date'] ?? $item['created_at'] ?? null;
                };

                $rawDateA = $getDate($a);
                $rawDateB = $getDate($b);
                $dateA = $rawDateA ? (strtotime((string)$rawDateA) ?: 0) : 0;
                $dateB = $rawDateB ? (strtotime((string)$rawDateB) ?: 0) : 0;

                return $dateB <=> $dateA;
            });

            $limit = (int)$action->get("args.limit");
            if ($limit > 0) {
                $items = array_slice($items, 0, $limit);
            }

            $action->set("collection", new CollectionClass($items, Shape::class));
        };
    }

    private static function indexCollectionByIntField(CollectionClass $collection, string $field): array
    {
        $indexed = [];
        foreach ($collection->getItems() as $item) {
            $indexed[(int)$item->get($field)][] = $item;
        }
        return $indexed;
    }

    /**
     * @return callable
     */
    public static function loadEnquiryTypes(): callable
    {
        return function ($action) {
            $action->set("types", Manager::getService('project')->fetch("tender/history/type")->getCollection('data'));
        };
    }

    /**
     * @return callable
     */
    public static function loadDocumentTypes(): callable
    {
        return function ($action) {
            $action->set("document_types", Manager::getService('document')->fetch("document/type")->getCollection('data'));
        };
    }

    /**
     * @return \Closure
     */
    public static function loadAllowedStatuses(): callable
    {
        return function ($action) {
            $action->setItems([
                "status" => new Shape([
                    'initial' => new Shape($action->get("types")->filterByExistInArray('uid', ['sent', 'viewed'])->getIds()),
                    'allowed' => new Shape($action->get("types")->filterByExistInArray('uid', ['dismissed', 'info', 'accepted'])->getIds())
                ])
            ]);
        };
    }


    /**
     * @return callable
     * !!!DEPRICATED!!!
     * Use updateTenderHistoryStatus for updating tender history
     */
    public static function updateStatus(): callable
    {
        return function ($action) {


            $body          = $action->getShape("body");

            $sid           = (int)$action->get("subcontractor.aid");
            $tid           = (int)$action->get("uriArgs.id");
            $status_id     = (int)$body->get("status_id");

            $enquiry       = $action->getCollection("enquiry")->getItems()[$tid];
            $pid           = $enquiry->get("project_id");
            $project       = Manager::getService("project")->fetch("project/$pid")->get("data");
            $projectName   = $project->get("name");
            $sessionUser = $action->get("session");
            $currentUserId = $sessionUser->get('user_id');

            $last_status = $enquiry->get("Enquiry.$sid.last_status");
            $history = $enquiry->get("Enquiry.$sid.history");
            $status = false;
            if ($history) {

                if (in_array($last_status, $action->get("status.initial")->get(), true)) {
                    try {
                        Manager::getService('project')->write("project/$pid/tender/$tid/history", new Shape([
                            'data' => [
                                "specialist_id"         => $sid,
                                "tender_history_type"   => 'Enquiry',
                                "author_id"             => $currentUserId,
                                "status_id"             => $status_id,
                                "meta"                  => []
                            ]
                        ]));
                        $status = true;

                        MilestoneMiddleware::milestoneInProgress('uriArgs.id', 'Quote Due', 'session.user')($action);
                    } catch (RestException $e) {
                        throw new MiddlewareException(
                            "relayError",
                            $e->getMessage()
                        );
                    }

                    $DECLINED_STATUS_IDS = [self::TENDER_STATUS_DECLINED];
                    if (in_array($status_id, $DECLINED_STATUS_IDS, true)) {
                        $subcontractor = $action->getShape("subcontractor");
                        $enquiryItem = $action->getCollection("enquiry")->first();
                        $packageName = $enquiryItem->get('label');
                        $mainContractorName = '';
                        $mainContractorId = $project->get("author_id");

                        if ($mainContractorId) {
                            $mainContractorUserData = Manager::getService("account")->fetch("user", [
                                'id' => $mainContractorId
                            ])->get("data");

                            $mainContractorUsers = $mainContractorUserData->get();
                            if (!empty($mainContractorUsers)) {
                                $mainContractorUser = array_shift($mainContractorUsers);
                                $mainContractorName = $mainContractorUser['display_name'] ?? '';
                            }
                        }

                        $emailData = [
                            "sender"    => $subcontractor,
                            "recipient" => $mainContractorUser,
                            "project"   => $pid,
                            "tender"    => $enquiryItem,
                            "extra"     => new Shape([
                                'subcontractor_full_name'    => $subcontractor->get('display_name') ?? '',
                                'subcontractor_company_name' => $subcontractor->get('name'),
                                'subcontractor_email'        => $subcontractor->get('email'),
                                'maincontractor_full_name'   => $mainContractorName,
                                'project_name'               => $projectName,
                                'package_name'               => $packageName,
                                'date_time'                  => date("Y-m-d H:i:s")
                            ])
                        ];

                        EmailMiddleware::send("Tender Dismissed", $emailData)($action);
                    }
                } else {
                    throw new MiddlewareException("invalid_enquiry_initial_status", "Enquiry status was already changed");
                }
            }

            $action->set("json", json_encode(['status' => $status]));
        };
    }

    /**
     * @param callable $payloader
     * @param string $pidKey
     * @param string $tenderIdKey
     * @return callable
     * Allow for a call to the tenderHistoryEndpoint
     * Payload needs to be in format
     * [
     *      "specialist_id"         => $sid,
     *      "tender_history_type"   => 'Enquiry|Interest',
     *      "author_id"             => $author_id,
     *      "status_id"             => $status_id,
     *      "meta"                  => []
     * ]
     * ToDo: Deprecate updateStatus as not reusable at at all
     */
    public static function updateTenderHistoryStatus(callable $payloader, string $pidKey, string $tenderIdKey): callable
    {

        return function ($action) use ($payloader, $pidKey, $tenderIdKey) {

            $pid = $action->get($pidKey);
            $tid = $action->get($tenderIdKey);
            Manager::getService('project')->write("project/$pid/tender/$tid/history", new Shape([
                'data' => $payloader($action)
            ]));
        };
    }

    /**
     * @return Callable
     */
    public static function sort(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                $collection->sort(function ($a, $b) {
                    return $b->get("created_at") <=> $a->get("created_at");
                });
            }
        };
    }

    /**
     * @return callable
     */
    public static function loadContractors(): callable
    {
        return function ($action) {

            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                $collection->update(function ($item) use ($action) {
                    $isArray = is_array($item);
                    if ($isArray) {
                        $item = new Shape($item);
                    }
                    $groupId = $item->get("group_id");
                    if (!$groupId) {
                        return $isArray ? $item->toArray() : $item;
                    }

                    $account = $action->get("accounts")->filterByField("id", $groupId, cast: 'int')->first();
                    $users = $action->get("users")->filterByField("account_id", $groupId, cast: 'int')->getItems();
                    $item->set("contractor", $account);
                    $item->set("users", $users);
                    return $isArray ? $item->toArray() : $item;
                });
            }
        };
    }

    /**
     * @return callable
     */
    public static function updateContractorDetails(): callable
    {
        return function ($action) {

            $collection = $action->getCollection("collection");

            $collection->update(function ($tender) use ($action, $collection) {

                $tenders = array_map(function ($tender) use ($action) {

                    $tender = new Shape($tender);

                    $history_first = $tender->get("history_first");

                    if (is_array($history_first) && isset($history_first['author_id'])) {

                        $user_data = $action->get("users")->filterByField("id", $history_first['author_id'], cast: "int");

                        if ($user_data->count()) {
                            $user = $user_data->getFirst();
                            $fullname = trim($user->get("firstname") . " " . $user->get("lastname"));

                            $account = $action->get("accounts")->filterByField("id", (int)$user->get("account_id"), cast: "int");
                            if ($account->count()) {
                                $contractor = $account->getFirst()->get("name");
                                $contractor_id = $account->getFirst()->get("id");
                            }
                        }
                    }

                    $tender->setItems([
                        'contractor'       => $contractor ?? null,
                        'contractor_name'  => $fullname ?? null,
                        'contractor_id'    => $contractor_id ?? null,
                    ]);

                    return $tender;
                }, $action->get("collection")->getItemsAsArray());

                $action->set("collection", new CollectionClass($tenders, $collection->getObjectClass()));

                return $tender;
            });
        };
    }

    /**
     * @param array $labels_key
     * @return callable
     */
    public static function updateTenderLabel(array $labels_key): callable
    {
        return function ($action) use ($labels_key) {
            $collection = $action->getCollection("collection");
            $labels = $action->get("constants")->getItems()['tender'];
            $tenders = array_map(function ($tender) use ($labels, $labels_key) {
                $tender = new Shape($tender);
                foreach ($labels_key as $label_key) {
                    $value = $tender->get($label_key, $labels->get("default")[$label_key] ?? null);
                    $label_value = $labels->get($label_key);
                    if (isset($label_value[$value])) {
                        $tender->set($label_key, $label_value[$value]);
                    }
                }
                return $tender;
            }, $collection->getItemsAsArray());

            $action->set("collection", new CollectionClass($tenders, $collection->getObjectClass()));
        };
    }

    /**
     * @return \Closure
     */
    public static function prepareQuoteData(): callable
    {
        return function ($action) {
            $data = $action->getRoute()->getRequest()->getData();

            $sid = (int)$action->get("subcontractor.aid");
            $tid = (int)$action->get("uriArgs.id");

            $enquiry = $action->getCollection("enquiry")->getItems()[$tid];

            $history = $enquiry->get("Enquiry")[$sid] ?? [];
            $history_first = end($history['history']);
            $status_return =  $action->get("types")->filterByField("uid", 'tender_returned')->getFirst();
            $status_sent =  $action->get("types")->filterByField("uid", 'sent')->getFirst();

            $history_sent = (new CollectionClass($history['history'], Shape::class))->filterByField("status_id", (int)$status_sent->get("id"))->getLast();
            if ($history_sent->count()) {
                $contractor_id = (int)$history_sent->get("author_id");
            } else {
                $contractor_id = (int)$history_first['author_id'];
            }

            $action->set("quote", new Shape([
                'sid'       => $sid,
                'tid'       => $tid,
                'pid'       => $enquiry->get("project_id"),
                'label'     => $enquiry->get("label"),
                'file'      => $data->getShape("files"),
                'form'      => $data->getShape("form"),
                'status_id' => (int)$status_return->get("id"),
                'author_id' => $contractor_id
            ]));
        };
    }

    /**
     * @return callable
     */
    public static function uploadQuoteFile(): callable
    {
        return function ($action) {

            $data = $action->get("quote");
            $tid  = $data->get("tid");
            $documents = [];

            $files = $data->get("file.document");
            foreach ($files as $type => $values) {
                if (is_array($values)) {
                    foreach ($values as $key => $value) {
                        $documents[$key][$type] = $value;
                    }
                } else {
                    $documents[0][$type] = $values;
                }
            }
            $document_type =  $action->get("document_types")->filterByField("uid", 'structural')->getFirst();

            foreach ($documents as $document) {
                $transaction_data = [
                    "subcontractor_id"   => $data->get("sid"),
                    "pid"                => $data->get("pid"),
                    "tid"                => $tid,
                    "type_id"            => $document_type->get("id"),
                    "file"               => new CURLFile($document['tmp_name'], $document['type'], $document['name']),
                    "qid"                => $action->get("qid")
                ];
                $res = Manager::getService('project')->write("tender/$tid/transaction/file", new Shape([
                    'data' => $transaction_data,
                    'headers' => ["Content-Type" => 'multipart/form-data']
                ]));

                if ($res->getShape("info")->get("http_code") >= 500) {
                    $error = $res->get("content");
                    if (!$error) {
                        $error = "Quote document could not be uploaded to S3";
                    }
                    $action->set("file_upload_error_data", new Shape(["document" => $document]));
                    throw new MiddlewareException("file_upload_error", $error);
                }
            }
        };
    }

    /**
     * @param int $id
     * @param int $tid
     * @param int $sid
     * @throws \Exception
     */
    public static function downloadQuoteFile()
    {
        return function ($action) {
            $id = (int)$action->get("uriArgs.id");
            $tid = (int)$action->get("uriArgs.tid");
            $sid = (int)$action->get("uriArgs.sid");
            try {
                $file = sprintf(
                    '%s/tenders/%s/transactions/%s/%s.zip',
                    $id,
                    $tid,
                    'quotes',
                    $sid
                );
                $filenameArray = explode("/", $file);
                $filename = $filenameArray[array_key_last($filenameArray)] ?? "";
                $s3Service = Manager::getService('s3');
                $bucket = $s3Service->getBucket('document');
                $key = $s3Service->getKey($file, 'projects');
                $download = $s3Service->download($bucket, $key);
                if ($download) {
                    header("Content-Type: " . $download['ContentType']);
                    if ($filename) {
                        header("Content-Disposition: " . 'attachment; filename="' . $filename . '"');
                    }
                    echo $download['Body'];
                    die;
                }
            } catch (\Exception $e) {
                throw new \Exception("Permission denied.");
            }
        };
    }

    /**
     * @param string $pidKey
     * @param string $tidKey
     * @param callable $payloader
     * @return callable
     */
    public static function addHistory(string $pidKey, string $tidKey, callable $payloader): callable
    {
        return function ($action) use ($pidKey, $tidKey, $payloader) {

            $pid  = $action->get($pidKey);
            $tid  = $action->get($tidKey);

            try {
                $data = $payloader($action);
                $error = false;
                $transaction_data = [
                    "specialist_id"         => $data->get("sid"),
                    "tender_history_type"   => 'Enquiry',
                    "author_id"             => $data->get("author_id"),
                    "status_id"             => $data->get("status_id"),
                    "meta"                  => []
                ];
                $res = Manager::getService('project')->write("project/$pid/tender/$tid/history", new Shape([
                    'data' => $transaction_data
                ]));
                if ($res->get("info.http_code") >= 500) {
                    $error = $res->get("content") ?: "The quote could not be added to tender history table";
                }
            } catch (RestException $e) {
                $error = $e->getMessage();
            }

            if ($error) {
                $action->set("add_transaction_error_data", new Shape(["data" => $transaction_data ?? []]));
                throw new MiddlewareException("add_transaction_error", $error);
            }
        };
    }

    /**
     * @param array|string[] $keys
     * @return \Closure
     */
    public static function convertPriceToPenny(array $keys = ["price", "work", "prelims", "other"]): callable
    {
        return function ($action) use ($keys) {

            $data = $action->get("quote");

            $values = [];
            foreach ($keys as $key) {
                $form_value = $data->get("form." . $key);
                if (isset($form_value)) {
                    $v = preg_replace("/[^0-9.]/", "", (string) $form_value);
                    if (!is_null($v)) {
                        $decimal = strpos($v, ".");
                        if ($decimal === false) {
                            $v .= "00";
                        } elseif ((strlen($v) - $decimal) !== 3) {
                            list($pre, $suf) = explode(".", $v);
                            $suf = (strlen($suf) < 2) ? str_pad($suf, 2, "0") : substr($suf, 0, 2);
                            $v = $pre . $suf;
                        }
                    }

                    $values[$key] = (int) str_replace(".", "", (string) $v);
                }
            }

            $action->set("prices", $values);
        };
    }

    /**
     * @return \Closure
     */
    public static function addTransaction(): callable
    {
        return function ($action) {

            $data = $action->get("quote");
            $tid  = $data->get("tid");

            try {
                $error = false;
                $sessionUser = $action->getShape("session.user");
                $transaction_data = [
                    "project_id"        => $data->get("pid"),
                    "subcontractor_id"  => $data->get("sid"),
                    "package_name"      => $data->get("label"),
                    "price"             => $action->get("prices.price"),
                    "measured_work"     => $action->get("prices.work"),
                    "prelims"           => $action->get("prices.prelims"),
                    "other_items"       => $action->get("prices.other"),
                    "programme"         => $data->get("form.programme"),
                    "type_id"           => 1,
                    "source"            => "Prosper Submission",
                    "uploaded_by_user_id" => $sessionUser->get("id"),
                ];
                $res = Manager::getService('project')->write("tender/$tid/transaction", new Shape([
                    'data' => $transaction_data
                ]));

                $qid = $res->get("json.id");
                if ($qid === null && $res->get("json") instanceof Shape) {
                    $json = $res->getShape("json");
                    $qid = $json->get("id", $json->get("data.id"));
                } else {
                    // some services wrap data under "data"
                    $qid = $qid ?? $res->get("json.data.id");
                }
                $action->set("qid", $qid);

                if ($res->get("info.http_code") >= 500) {
                    $error = $res->get("content") ?: "The transaction could not be inserted to transaction table";
                }
            } catch (\Exception $e) {
                $error = $e->getMessage();
            }

            if ($error) {
                $action->set("add_transaction_error_data", new Shape(["data" => $transaction_data ?? []]));
                throw new MiddlewareException("add_transaction_error", $error);
            }
        };
    }

    /**
     * @return callable
     */
    public static function getEnquiryContractorData(): callable
    {
        return function ($action) {
            $items   = $action->get("enquiry")->getItems();
            $project = $items['project'];
            $group_id = $project->get("group_id");
            $author_id = $project->get("project_creator");
            $enquiry_author_id = null;
            $history = [];
            $tid = $action->get("quote.tid", $action->get("boq.tender.id"));
            if (isset($items[$tid])) {
                $subcontractor_aid = $action->get("subcontractor.aid", $action->get("uriArgs.sid"));
                $history = $items[$tid]->get("Enquiry")[$subcontractor_aid] ?? [];
            }
            if (isset($history['history']) && $history['history']) {
                $history_first = end($history['history']);
                $status_sent =  $action->get("types")->filterByField("uid", 'sent')->getFirst();
                $history_sent = (new CollectionClass($history['history'], Shape::class))->filterByField("status_id", (int)$status_sent->get("id"))->getLast();
                if ($history_sent->count()) {
                    $enquiry_author_id = (int)$history_sent->get("author_id");
                } else {
                    $enquiry_author_id = (int)$history_first['author_id'];
                }
            }

            try {
                if ($enquiry_author_id) {
                    $enquiry_users = Manager::getService("account")->fetch("user", ['id' => $enquiry_author_id])->get("data");
                    if ($enquiry_users->get()) {
                        $enquiries_user = $enquiry_users->get();
                        $enquiry_user = array_shift($enquiries_user);
                    }
                }
                if ($author_id) {
                    $users = Manager::getService("account")->fetch("user", ['id' => $author_id])->get("data");
                } else {
                    $users = Manager::getService("account")->fetch("user", ['account_id' => $group_id])->get("data");
                }
                if ($users->get()) {
                    $user_data = $users->get();
                    $user = array_shift($user_data);
                }
            } catch (\Exception $e) {
                $user = [];
                $enquiry_user = [];
            }
            $action->set("contractor", new Shape($user ?? []));
            $action->set("contractor_enquiry_user", new Shape($enquiry_user ?? []));
        };
    }

    /**
     * @return callable
     */
    public static function addContractorNotification(): callable
    {
        return function ($action) {
            $data    = $action->get("quote");
            $tid     = $data->get("tid");
            $items   = $action->get("enquiry")->getItems();
            $tender  = $items[$tid];
            $project = $items['project'];

            try {
                Manager::getService('legacy')->write("addContractorTransactionActivity", new Shape([
                    'data' => [
                        "LEGACY_TOKEN"       => Config::get("legacy.token"),
                        "subcontractor_name" => $action->get("subcontractor.name"),
                        "contractor"         => $project->get("group_id"),
                        "project_id"         => $data->get("pid"),
                        "subcontractor_id"   => $data->get("sid"),
                        "package_name"       => $data->get("label"),
                        "package_custom"     => $tender->get("is_custom"),
                        "packages"           => $tender->get("packages"),
                    ],
                    'headers' => [
                        'Content-Type' => "application/x-www-form-urlencoded"
                    ]
                ]));
            } catch (RestException $e) {
                throw new MiddlewareException(
                    "relayError",
                    $e->getMessage()
                );
            }
        };
    }

    /**
     * @return callable
     */
    public static function addAdminNotification(): callable
    {
        return function ($action) {
            $data    = $action->get("quote");
            $tid     = $data->get("tid");
            $items   = $action->get("enquiry")->getItems();
            $tender  = $items[$tid];
            $project = $items['project'];

            try {
                Manager::getService('legacy')->write("addAdminTransactionActivity", new Shape([
                    'data' => [
                        "LEGACY_TOKEN"       => Config::get("legacy.token"),
                        "subcontractor_name" => $action->get("subcontractor.name"),
                        "contractor"         => $project->get("group_id"),
                        "project_id"         => $data->get("pid"),
                        "project_name"       => $project->get("name"),
                        "subcontractor_id"   => $data->get("sid"),
                        "package_name"       => $data->get("label"),
                        "package_custom"     => $tender->get("is_custom"),
                        "packages"           => $tender->get("packages"),
                    ],
                    'headers' => [
                        'Content-Type' => "application/x-www-form-urlencoded"
                    ]
                ]));
            } catch (RestException $e) {
                throw new MiddlewareException(
                    "relayError",
                    $e->getMessage()
                );
            }
        };
    }

    /**
     * @param string $uidsKey
     * @param string $returnKey
     * @param string $type
     * @param int $status_id
     * @return \Closure
     */
    public static function getHistorySentByAuthorIds(string $uidsKey = 'uids', string $returnKey = 'enquiries', string $type = 'Enquiry', int $status_id = 1)
    {
        return function ($action) use ($uidsKey, $returnKey, $type, $status_id) {
            try {
                $data = Manager::getService('project')->fetch("tender/history", [
                    'tender_history_type' => $type,
                    'status'              => $status_id,
                    'author_ids'          => $action->get($uidsKey)
                ])->getCollection('data');

                if (!$data->count()) {
                    $data = [];
                }
            } catch (\Exception $e) {
                $data = [];
            }
            $action->set($returnKey, $data);
        };
    }

    /**
     * @param string $uidsKey
     * @param string $returnKey
     * @return \Closure
     */
    public static function getTransactionsByTenderIds(string $uidsKey = 'tender_ids', string $returnKey = 'transactions')
    {
        return function ($action) use ($uidsKey, $returnKey) {
            $ids = '[' . implode(",", $action->get($uidsKey)) . ']';
            $data = [];
            if (!empty($ids)) {
                try {
                    $data = Manager::getService('project')->fetch("transaction/tender/$ids")->getCollection('data');
                } catch (\Exception $e) {
                    $data = [];
                }
            }
            $action->set($returnKey, $data);
        };
    }

    /**
     * @param string $dataKey
     * @param string $returnKey
     * @return \Closure
     */
    public static function processEnquiriesContractor(string $dataKey = 'enquiries', string $returnKey = 'enquiries')
    {
        return function ($action) use ($dataKey, $returnKey) {
            $accounts    = new CollectionClass($action->get("accounts"), Shape::class);
            $contractors = new CollectionClass($action->get("contractors"), Shape::class);

            $enquiries_data = [];
            if ($action->get($dataKey)) {
                $action->get($dataKey)->map(function ($history) use (&$enquiries_data, $accounts, $contractors) {

                    $contractor =  $contractors->filterByStringField("id", $history->get("author_id"));
                    $contractor_name = "";
                    if ($contractor->count()) {
                        $contractor_name = $contractor->getFirst()->get("display_name");
                    }

                    $subcontractor =  $accounts->filterByStringField("id", $history->get("specialist_id"));
                    $subcontractor_name = "";
                    if ($subcontractor->count()) {
                        $subcontractor_name = $subcontractor->getFirst()->get("name");
                    }

                    $enquiries_data[] = [
                        'name'          => $history->get("name"),
                        'tender'        => $history->get("label"),
                        'date'          => $history->get("created_at"),
                        'contractor'    => $contractor_name    ?? null,
                        'subcontractor' => $subcontractor_name ?? null
                    ];
                });
            }

            $action->set($returnKey, $enquiries_data);
        };
    }

    /**
     * @param string $dataKey
     * @param string $returnKey
     * @return \Closure
     */
    public static function processTransactionsContractor(string $dataKey = 'transactions', string $returnKey = 'transactions')
    {
        return function ($action) use ($dataKey, $returnKey) {
            $transactions_data = [];
            $accounts       = new CollectionClass($action->get("accounts"), Shape::class);
            $contractors    = new CollectionClass($action->get("contractors"), Shape::class);
            $projects       = $action->get("projects");
            $contractor_aid = $action->get("uriArgs.aid");

            if ($action->get($dataKey)) {
                $action->get($dataKey)->map(function ($transaction) use (&$transactions_data, $accounts, $contractors, $projects, $contractor_aid) {
                    $project =  $projects->filterByStringField("id", $transaction->get("tender.project_id"));
                    if ($project->count()) {
                        $project_name = $project->getFirst()->get("name");

                        $contractor = $contractors->filterByStringField("id", $project->getFirst()->get("author"));
                        $contractor_name = "";
                        if ($contractor->count()) {
                            $contractor_name = $contractor->getFirst()->get("display_name");
                        } else {
                            //fallback the contractor name to the company name
                            $contractor =  $accounts->filterByStringField("id", $contractor_aid);
                            if ($contractor->count()) {
                                $contractor_name = $contractor->getFirst()->get("name");
                            }
                        }
                    }
                    $subcontractor =  $accounts->filterByStringField("id", $transaction->get("subcontractor_id"));
                    $subcontractor_name = "";
                    if ($subcontractor->count()) {
                        $subcontractor_name = $subcontractor->getFirst()->get("name");
                    }

                    $transactions_data[] = [
                        'name'          => $project_name ?? null,
                        'tender'        => $transaction->get("tender.label"),
                        'date'          => $transaction->get("quote_created"),
                        'contractor'    => $contractor_name    ?? null,
                        'subcontractor' => $subcontractor_name ?? null,
                    ];
                });
            }
            $action->set($returnKey, $transactions_data);
        };
    }
}
