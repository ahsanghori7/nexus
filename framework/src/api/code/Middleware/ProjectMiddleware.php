<?php

namespace Api\Middleware;

use Api\Model\Project\Statuses;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Service\AccountMiddleware;
use Api\Middleware\Relay\BoqMiddleware;

class ProjectMiddleware
{

    const PROJECT_STATUS_COLLECTION_KEY= "project_statuses";

    const PROJECT_STATUS_KEY = "status";

    const BOQ_UNITS_KEY = "boq_units";

    /**
     * @param string $projectFieldKey
     * @param string $projectValueKey
     * @param bool $returnAsList
     * @return \Closure
     */
    public static function fetchProject(string $projectFieldKey = 'id', string $projectValueKey = '', bool $returnAsList = false): \Closure
    {
        return function (Shape $action) use ($projectFieldKey, $projectValueKey, $returnAsList) {
            try {
                $projects = Manager::getService("project")->fetch("project", [
                    $projectFieldKey => $action->get($projectValueKey)
                ])->getCollection('data');
                if ($projects->count()) {
                    return $action->set("project", $returnAsList ? $projects : $projects->first());
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("projectNotFoundError", $e->getMessage());
            }

            throw new MiddlewareException("projectNotFoundError", "The project with " . $projectFieldKey . "=" . $action->get($projectValueKey) . " has not been found");
        };
    }

    /**
     * @param string $projectFieldKey
     * @param string $type
     * @param string $saveKey
     * @return \Closure
     */
    public static function getTendersWithHistory(string $projectFieldKey = 'project.id', string $type = 'Enquiry', string $saveKey = 'tender_history'): \Closure
    {
        return function (Shape $action) use ($projectFieldKey, $saveKey, $type) {
            try {
                $pid = $action->int($projectFieldKey);
                $history = Manager::getService("project")->fetch("project/$pid/tender/history", ['tender_history_type' => $type])->getCollection('data');
                if ($history->count()) {
                    $history = $history->getFirst()->get('tender');
                    $history_statuses = $action->get("history");
                    $tidHistory = [];
                    foreach ($history as $tid => $h) {
                        if (isset($h['Enquiry'])) {
                            $enquiry = end($h['Enquiry']);
                            if (!in_array((int)$enquiry['last_status'], $history_statuses->filterByField('uid', 'added')->values("id"), true)) {
                                $tidHistory[] = $tid;
                            }
                        }
                    }

                    return $action->set($saveKey, [$type => array_flip($tidHistory)]);
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("projectNotFoundError", $e->getMessage());
            }
        };
    }

    /**
     * @param string $projectIdKey
     * @param string $testKey
     * @return \Closure
     */
    public static function checkProjectOwnershipById(string $projectIdKey = "project.group_id", string $testKey="account.id"): \Closure
    {
        return function (Shape $action) use ($projectIdKey, $testKey) {
            if ($projectIdKey) {
                if ($action->int($testKey) === $action->int($projectIdKey)) {
                    return true;
                }
                throw new MiddlewareException("projectOwnershipError", "You don't have access to the project.");
            }
        };
    }

    /**
     * Project access rule composed the same way as the boqCheckProjectOwnerShip
     * procedure: administrators bypass the ownership equality, main contractors
     * must own the project, and every other account type is denied.
     *
     * checkProjectOwnershipById() alone is NOT a complete access rule — the bare
     * equality also denies administrators, who have blanket access elsewhere.
     *
     * @param string $projectIdKey
     * @param string $testKey
     * @return \Closure
     * @throws MiddlewareException projectOwnershipError when access is denied
     */
    public static function checkProjectAccessById(string $projectIdKey = "project.group_id", string $testKey = "account.id"): \Closure
    {
        return function (Shape $action) use ($projectIdKey, $testKey) {
            $allowed = false;

            AccountMiddleware::ifIsATypeOf(AccountMiddleware::ADMIN_TYPE, function () use (&$allowed) {
                $allowed = true;
            }, onlyCallbackOnTrue: true)($action);

            if (!$allowed) {
                AccountMiddleware::ifIsATypeOf(AccountMiddleware::MAIN_CONTRACTOR_TYPE, function (Shape $a) use ($projectIdKey, $testKey, &$allowed) {
                    self::checkProjectOwnershipById($projectIdKey, $testKey)($a);
                    $allowed = true;
                }, onlyCallbackOnTrue: true)($action);
            }

            if (!$allowed) {
                throw new MiddlewareException("projectOwnershipError", "You don't have access to the project.");
            }
        };
    }

    /**
     * @return \Closure
     */
    public static function fetchProjectStatuses(string $statusCollectionKey = self::PROJECT_STATUS_COLLECTION_KEY): \Closure
    {
        return function (Shape $action) use($statusCollectionKey) {
            $action->set($statusCollectionKey, Statuses::fetchStatuses());
        };
    }

    /**
     * @param string $statusComparisonKey
     * @param string $statusCollectionKey
     * @param string $statusSaveKey
     * @param string $filterKey
     * @return \Closure
     */
    public static function setProjectEntityStatus(
        string $statusComparisonKey, string $statusCollectionKey = self::PROJECT_STATUS_COLLECTION_KEY,
        string $statusSaveKey = self::PROJECT_STATUS_KEY, string $filterKey = "label"
    ): \Closure
    {
        return function($a) use($statusComparisonKey, $statusCollectionKey, $statusSaveKey, $filterKey) {
            if(!$a->has($statusCollectionKey)) {
                self::fetchProjectStatuses($statusCollectionKey)($a);
            }
            $status = $a->getCollection($statusCollectionKey)->filterByField($filterKey, $a->get($statusComparisonKey))->first();
            if(!$status->has("id")) {
                throw new MiddlewareException("badRequest", "invalid status provided");
            }
            $a->set($statusSaveKey, $status);
        };

    }

    /**
     * @return \Closure
     */
    public static function fetchBOQUnits(string $unitCollectionKey = self::BOQ_UNITS_KEY, callable $callback = null): \Closure
    {
        return function(Shape $action) use($unitCollectionKey, $callback)  {
            $units = Manager::getService("project")->fetch("boq/unit")->getCollection("data");
            $action->set($unitCollectionKey, $units);
            if($callback) {
                $callback($action, $units, $unitCollectionKey);
            }
        };
    }

    /**
     * @return \Closure
     */
    public static function fetchProjectProcurement($saveKey = 'procurement'): \Closure
    {
        return function(Shape $action) use($saveKey)  {
            $collection = Manager::getService("project")->fetch(sprintf("project/%s/procurement", $action->get("uriArgs.project_id")))->getShape('data')->get();
            $action->set($saveKey, $collection);
        };
    }

    /**
     * @param array $sids
     * @param array $status
     * @return array
     */
    public static function filterIdsByStatus(array $sids, array $statusList, $boolFilter = true)
    {
        return array_keys(array_filter($sids, function ($v) use ($statusList, $boolFilter) {
            $check = [];
            foreach ($v as $tid => $status) {

                if (in_array($status, $statusList) === $boolFilter) {
                    $check[] = $status;
                }
            }
            return !empty($check);
        }));
    }

    /**
     * @param array $itemHistory
     * @return array
     */
    public static function getLastItem(array $itemHistory): array
    {
        $last = [];
        foreach ($itemHistory as $item) {
            if (!$last || strtotime($item["created_at"]) > strtotime($last["created_at"])) {
                $last = $item;
                $last["created_at"] = (new \DateTime($item["created_at"]))->format("jS M o");
                $last["meta"] = json_decode($item["meta"]);
            }
        }
        return $last;
    }

    /**
     * @return array
     * @throws Exception
     */
    public static function getConstants(): array
    {
        $constants =  Manager::getService("project")->fetch("project/constants")->getShape('data')->get();
        $constants['project']['team_role'] = self::getProjectTeamRoles();
        return $constants;
    }

    /**
     * @return array
     * @throws \Exception
     */
    public static function getProjectTeamRoles(): array
    {
        $data = Manager::getService("project")->fetch("project/team/role")->getShape('data')->get();
        $teamRoles = [];
        foreach ($data as $value) {
            $teamRoles[] = [
                'id'    => $value['id'],
                'label' => $value['label']
            ];
        }
        return $teamRoles;
    }

    public static function generatePSOResponse($saveKey = 'procurement'): \Closure
    {
        return function(Shape $a) use($saveKey) {
            $data = $a->get($saveKey);
            $response = [];
            if($data) {
                $project_id = $a->get("project.id");
                $procurement = $data[$project_id];
                $sids = ProjectMiddleware::filterIdsByStatus($procurement["sids"], TenderMiddleware::getTenderHistoryTypeIds(["dismissed", "deleted"]), false);
                $a->set("sids", $sids);
                AccountMiddleware::loadAccountsByIdArray("sids")($a);
                $accountsArray = ($sids) ? $a->get("accounts") : [];
                $accounts = array_column($accountsArray, null, 'id');
                TenderMiddleware::fetchTenderByProject("project.id", returnAsList:true)($a);
                $tenders = $a->get('tender')->getItemsAsArray();

                // Include service and size names
                $tenderConstants = ProjectMiddleware::getConstants()['tender'] ?? [];
                $services = $tenderConstants["service"] ?? [];
                $sizes = $tenderConstants["size"] ?? [];

                $boq_tenders = [];
                try {
                    BoqMiddleware::fetchByProjectId("project.id")($a);
                    BoqMiddleware::parseEntitiesEntries("boq", saveKey:"boqCollection")($a);
                    $boq = $a->get("boqCollection")->getItemsAsArray();
                    if ($boq) {
                        foreach ($boq as $item) {
                            $boq_tenders[$item['tender']['id']] = $item['status'];
                        }
                    }
                } catch(MiddlewareException $e) {
                    // continue normal execution in case of Exception
                }

                $categories = Manager::getService("document")->fetch("category", ['entity_type' => 'order_template', 'parent_id' => $project_id])->getShape('data')->get();
                $a->set('category', $categories);
                DocumentMiddleware::extractDataFromOrder('category')($a);
                $order_data = $a->get('order_data');
                $order_tids = $order_data['tids'] ?? [];
                $awardedHistoryType = TenderMiddleware::getTenderHistoryTypeId("awarded");

                $quotes = Manager::getService("project")->fetch(
                    "project/{$project_id}/tender/transaction", [
                    "type_id" => 1
                    ]
                )->getShape("data")->get();

                $quotesData = $quotes[$project_id] ?? [];

                try {
                    $transactions = Manager::getService("project")->fetch("transaction/tender/[".implode(",", $order_tids)."]")->getShape('data')->get();
                } catch (\Throwable $th) {
                    $transactions = [];
                }

                $orders = [];
                foreach($transactions as $t){
                    $orders[$t['tender_id']] = $t;
                }

                $orderDate = null;

                $enquirySentStatus = TenderMiddleware::getTenderHistoryTypeIds(["sent"]);
                $enquiryReceivedStatus = TenderMiddleware::getTenderHistoryTypeIds(["tender_returned"]);

                foreach ($tenders as $tender) {
                    if (TenderMiddleware::isState($tender['state'], TenderMiddleware::SUGGESTED_STATE_LABEL)) {
                        continue;
                    }
                    $tid = $tender["id"];
                    $trades = [];
                    foreach ($tender["packages"] as $package) {
                        $trades[] = $package["package_id"];
                    }

                    $value = 0;
                    $selectedPrice = null;
                    $lowestPrice = null;

                    $quoteTransactions = $quotesData["tender"][$tid]["Quote"] ?? [];
                    if(isset($quoteTransactions["transactions"])) {
                        foreach ($quoteTransactions["transactions"] as $sid => $data) {
                            foreach ($data['transaction'] as $transaction) {
                                $price = $transaction['price'];
                                $priceSelected = $transaction['price_selected'];

                                if ($priceSelected) {
                                    $selectedPrice = $price;
                                    break;
                                }

                                if ($lowestPrice === null || $price < $lowestPrice) {
                                    $lowestPrice = $price;
                                }
                            }
                        }
                    }

                    if($tender["awarded"]) {
                        $value = ($orders[$tid]['order_price'] !== 0) ? $orders[$tid]['order_price'] : $orders[$tid]['price'];
                    } else {
                        $value = $selectedPrice ?? $lowestPrice ?? 0;
                    }

                    $actual_price = intval($value);
                    $budget = intval($tender['budget']);
                    $variance = $budget - $actual_price;
                    $varianceType = $variance > 0 ? "positive" : ($variance < 0 ? "negative" : null);
                    $variancePercent = $variance === 0 ? 0 : ($budget ? round((($variance) / $budget) * 100, 2) : -100);

                    $orderDate = !empty($orders[$tid]['order_created']) ? new \DateTime($orders[$tid]['order_created']) : null;

                    $packageMilestones = Manager::getService("project")
                    ->fetch(sprintf("milestones/package-milestones/packages/%s", $tid))
                    ->getCollection('data')->getItemsAsArray();

                    $milestone = [
                        "current" => [],
                        "next" => [],
                        "completed" => []
                    ];

                    if($packageMilestones) {
                        $pendingMilestones = array_values(array_filter($packageMilestones, fn($milestone) => $milestone['status'] !== 'Completed'));

                        $milestone["completed"] = array_values(array_filter($packageMilestones, fn($milestone) => $milestone['status'] === 'Completed'));

                        if(empty($pendingMilestones)) {
                            $milestone["current"] = $packageMilestones[count($packageMilestones) - 1];
                        } else {
                            $current = $pendingMilestones[0];
                            $milestone["current"] = $current;

                            // Find the next milestone by sort_order, regardless of status
                            $nextMilestones = array_values(array_filter(
                                $packageMilestones,
                                fn($m) => $m['sort_order'] > $current['sort_order']
                            ));

                            $milestone["next"] = $nextMilestones[0] ?? [];
                        }

                        $today = new \DateTime();
                        foreach($milestone as &$m) {
                            if(isset($m['id'])) {
                                $planned_end_date = new \DateTime($m["planned_end_date"]);
                                $interval = $today->diff($planned_end_date);
                                $days_difference = (int)$interval->format('%R%a');

                                if($milestone["next"] && $milestone["next"] !== 'Completed') {
                                    if ($days_difference < 0) {
                                        $m['lead_time_status'] = 'Overdue';
                                    } elseif ($days_difference <= 14) {
                                        $m['lead_time_status'] = 'Approaching';
                                    } else {
                                        $m['lead_time_status'] = 'On Track';
                                    }
                                }

                                $m['days_overdue'] = $m['lead_time_status'] === 'Overdue' ? abs($days_difference) : 0;
                                $m['days_remaining'] = $days_difference;
                            }
                        }
                    }

                    try {
                    $shortlistedResponse = Manager::getService("project")
                        ->fetch("project/{$project_id}/tender/{$tid}/shortlisted-subcontractors")
                        ->getShape('data')
                        ->get();
                    } catch (\Throwable $th) {
                        $shortlistedResponse = [];
                    }

                    $shortlisted = [];
                    if ($shortlistedResponse) {
                        foreach ($shortlistedResponse as $item) {
                            if (strtolower($item['status'] ?? '') === 'approved') {
                                continue;
                            }
                            $name = $item["name"] ?? "";
                            $approverName = null;

                            // Load account name if account_id exists
                            if (!empty($item["account_id"])) {

                                $accountData = Manager::getService('account')->fetch("account/" . $item["account_id"])->getShape('data');
                                $name = $accountData->get("name") ?? $name;

                            }

                            // Submitted By
                            $submittedBy = null;
                            if (!empty($item['author_id'])) {
                                try {
                                    $authorAccountShape = Manager::getService('account')->fetch("user/{$item['author_id']}/profile")->getShape('data');
                                    $submittedBy = [
                                        "id" => $authorAccountShape->get('id'),
                                        "display_name" => $authorAccountShape->get('display_name') ?? null
                                    ];

                                } catch (\Throwable $e) {
                                }
                            }

                            // Approver
                            if (!empty($item['approver_user_id'])) {
                                try {
                                    $approverData = Manager::getService('project')
                                    ->fetch("approvals/{$item['approver_user_id']}")
                                    ->getShape('data');
                                    $approverShape = Manager::getService('account')
                                    ->fetch("user/{$item['approver_user_id']}/profile")
                                    ->getShape('data');
                                    $approverName = $approverShape->get('display_name') ?? null;

                                } catch (\Throwable $e) {
                                    $approverName = null; // fallback
                                }
                            }


                            $shortlisted[] = [
                                "id" => $item["id"],
                                "subcontractor_id" => $item["account_id"] ?? null,
                                "name" => $name,
                                "submitted_by" => $submittedBy,
                                "status" => $item["status"] ?? "",
                                "approver_id" => $item["approver_id"] ?? null,
                                "approver_user_id" => $item["approver_user_id"] ?? null,
                                "approver_name" => $approverName,
                                "approver_notes" => $item["approver_notes"] ?? ""
                            ];
                        }
                    }

                    $response[$tid] = [
                        "id" => $tid,
                        "label"   => $tender["label"],
                        "reference_no" => $tender["reference_no"] ?? null,
                        "awarded" => $tender["awarded"],
                        "state" => $tender['state'],
                        "is_custom" => $tender['is_custom'],
                        "size_label" => $sizes[intval($tender["size"])] ?? "",
                        "service_label" => $services[intval($tender["service"])] ?? "",
                        "has_document" => $tender['has_document'],
                        "has_tender_addendum" => $tender['has_tender_addendum'] ?? "",
                        "has_boq" => isset($boq_tenders[$tid]),
                        "budget" => $budget,
                        "order_value" => $actual_price,
                        "variance" => $variance,
                        "variance_type" => $varianceType,
                        "variance_percent" => $variancePercent,
                        "order_issue_date" => $orderDate?->format("d-m-Y") ?? "-",
                        "start_on_site" => $tender['start_on_site'],
                        "tender_return" => $tender['tender_return'],
                        "packages" => $trades,
                        "milestones" => $milestone,
                        "procurement" => [],
                    ];

                    $response[$tid]['shortlisted_subcontractors'] = $shortlisted;

                    /**
                     * If the awarded is for older tenders we dont know to whom the tender was awarded
                     */
                    if ($tender["awarded"]) {
                        $response[$tid]['awarded_to'] = [
                            'name' => 'Non C-Link Subcontractor',
                            'id' => null
                        ];
                    }

                    if (!isset($procurement["tender"][$tid])) {
                        continue;
                    }

                    $excludeStatus = [];
                    $excludeStatus["Interest"] = TenderMiddleware::getTenderHistoryTypeIds(["dismissed", "sent"]);
                    $excludeStatus["Enquiry"]  = TenderMiddleware::getTenderHistoryTypeIds(["deleted"]);

                    $types = [
                        "Interest" => $procurement["tender"][$tid]["Interest"] ?? [],
                        "Enquiry"  => $procurement["tender"][$tid]["Enquiry"]  ?? []
                    ];

                    foreach ($types as $k => $type) {
                        foreach ($type as $sid => $schedule) {
                            if (in_array($schedule["last_status"], $excludeStatus[$k])) {
                                continue;
                            }
                            //Account may have been deleted
                            $account = $accounts[$sid] ?? [];
                            if ($k == 'Enquiry') {
                                if ($schedule["last_status"] == $awardedHistoryType) {
                                    $lastItem = ProjectMiddleware::getLastItem($schedule["history"]);
                                    $name = $lastItem['meta']->subcontractor ?? $lastItem['meta']->contact_name;
                                    if (!$sid) {
                                        $sid = $lastItem['meta']->user_id ?? null;
                                    }
                                    $response[$tid]['awarded_to'] = [
                                        'name' => $name,
                                        'id' => $sid
                                    ];
                                }
                            }

                            if (!$account) {
                                continue;
                            }

                            $lastStatusId = (int) $schedule["last_status"];
                            $lastStatusShape = Manager::getService('project')
                                ->fetch("tender/history/type")
                                ->getShape('data')->toArray();
                            $lastStatus;
                            foreach ($lastStatusShape as $type) {
                                if ($lastStatusId === (int) $type["id"]) {
                                    $lastStatus =  $type;
                                }
                            }

                            $currentUserAccountId = $a->get('account.id') ?? 0;
                            try {
                                $featuresShape = Manager::getService('account')
                                    ->fetch(sprintf('feature/accounts/%s', $currentUserAccountId))
                                    ->getShape('data');
                                $features = $featuresShape ? $featuresShape->toArray() : [];
                            } catch (\Throwable $e) {
                                $features = [];
                            }

                            $isSubcontractorListApprovalFeature = in_array(
                                'SUBCONTRACTOR_LIST_APPROVAL',
                                array_column($features, 'feature')
                            );

                            if ($isSubcontractorListApprovalFeature && ($lastStatus['uid'] ?? null) === 'added') {
                                $lastStatus['clink_label'] = 'Approved & Added';
                            }
                            $response[$tid]["procurement"][$sid] = [
                                'id' => $sid,
                                'name'   => $account["name"],
                                'email' => $account['email'],
                                'type_id' => $account['type_id'],
                                'type'   => $k,
                                'subscription_id' => $account['membership']['subscription_id'] ?? 0,
                                'sub_id' => $sid,
                                'logo'   => str_replace("logo.png", "company.png", $account["logo"]),
                                "status" => $lastStatus,
                                "last_action" => ProjectMiddleware::getLastItem($schedule["history"]),
                                "procurement_history" => $schedule["history"] ?? "",
                            ];
                        }
                    }

                    // Filter subcontractors for tender issued for coverage
                    $enquirySentSubcontractors = $tenderReceivedSubcontractors = 0;
                    foreach ($response[$tid]["procurement"] as $subContractorData) {
                        if(!empty($subContractorData['type']) && $subContractorData['type'] == "Enquiry"){
                            foreach($subContractorData['procurement_history'] as $history){
                                if(in_array((int)$history['status_id'], $enquirySentStatus)){
                                    $enquirySentSubcontractors++;
                                }

                                if(in_array((int)$history['status_id'], $enquiryReceivedStatus)){
                                    $tenderReceivedSubcontractors++;
                                }
                            }
                        }
                    }

                    $response[$tid]["tender_coverage"] = sprintf("%s/%s", $tenderReceivedSubcontractors, $enquirySentSubcontractors);
                }
            }
            //Alphabetically sort the packages by label
            usort($response, function ($a, $b) {
                return strcmp($a["label"], $b["label"]);
            });
            $a->set('response', $response);

        };
    }

}
