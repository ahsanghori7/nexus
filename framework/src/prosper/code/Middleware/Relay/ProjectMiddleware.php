<?php

namespace Prosper\Middleware\Relay;

use Core\Config;
use Core\Data\Collection;
use Core\Data\Collection as CollectionClass;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Generic;

class ProjectMiddleware
{

    /**
     * @param bool $filterUnpublishedTenders
     * @return callable
     */
    public static function loadProject(int $filteredTenderState = null): callable
    {
        return function ($action) use ($filteredTenderState) {
            $pid =  (int)$action->get("uriArgs.id");
            $project = Manager::getService('project')->fetch("project/$pid/tender/history")
                ->getCollection("data")->first();

            $packages     = [];
            foreach ($project->extract("tender") as $tid => $package) {
                if (is_int($filteredTenderState) && (int) $package["state"] !== $filteredTenderState) {
                    continue;
                }
                $package["id"] = $tid;
                $packages[] = $package;
            }
            $action->set("packages", new Collection($packages, Shape::class));

            $project->set(
                "region_label",
                $action->get("regions")->filterByField("id", $project->get("region"), cast: 'int')->first()->get("label")
            );

            $action->set("project", $project->set("id", $pid));
        };
    }

    /**
     * @param string $projectsKey
     * @return callable
     */
    public static function loadProjects(string $projectsKey): callable
    {
        return function ($action) use ($projectsKey) {
            $ids = $action->get($projectsKey);
            $ids = (is_array($ids)) ? $ids : [$ids];
            try {
                $data = Manager::getService('project')->fetch("project", ['id' => sprintf("[%s]", implode(",", $ids))])->getCollection('data');
            } catch (\Exception $e) {
                $data = [];
            }
            $action->set("projects", $data);
        };
    }

    /**
     * @return callable
     */
    public static function calculateDistances(): callable
    {
        return function ($action) {
            $distances = $action->get("distances", ['destination' => []]);
            $destinations = [];
            $distance = [];
            $projects = [];
            $action->get("projects")->map(function ($project) use (&$destinations, &$distance, $distances, &$projects) {
                $site_address = $project->get("site_address_one");
                if (!$site_address) {
                    $site_address = $project->get("site_address_two");
                }
                $site_address .= ", " . $project->get("site_address_city") . ", " . $project->get("site_address_postcode");
                if (!in_array($site_address, $distances['destination'], true)) {
                    $destinations[] = $site_address;
                    $projects[] = $project->get("id");
                } else {
                    $distance_key = array_search($site_address, $distances['destination'], true);
                    $distance[] = [
                        'origin'      => $distances['origin'][$distance_key],
                        'destination' => $distances['destination'][$distance_key],
                        'distance'    => $distances['distance'][$distance_key],
                        'project_id'  => $project->get("id")
                    ];
                }
            });
            $action->setItems([
                'distance'     => $distance,
                'destinations' => $destinations,
                'projects'     => $projects
            ]);
        };
    }

    /**
     * @param string $filterKey
     * @return callable
     */
    public static function loadRegions(string $filterKey = ''): callable
    {
        return function ($action) use ($filterKey) {
            $filter = [];
            if ($filterKey) {
                $filter[$filterKey] = $action->get($filterKey);
            }
            $data = Manager::getService('account')->fetch("region", $filter)->getCollection('data');
            $action->set("regions", $data);
        };
    }

    /**
     * @return callable
     */
    public static function loadConstants(): callable
    {
        return function ($action) {
            $data = Manager::getService('project')->fetch('project/constants')->getCollection('data');
            $action->set("constants", $data);
        };
    }

    /**
     * @return callable
     */
    public static function loadTrades(): callable
    {
        return function ($action) {
            $data = Manager::getService('account')->fetch('trade')->getCollection('data');
            $action->set("trades", $data);
        };
    }

    /**
     * @param string $collectionKey
     * @param array $label_keys
     * @param string $shapeKey
     * @return callable
     */
    public static function updateProjectsLabels(string $collectionKey = '', array $label_keys = [], string $shapeKey = ''): callable
    {
        return function ($action) use ($collectionKey, $label_keys, $shapeKey) {
            $action->getCollection($collectionKey)->update(function ($item) use ($action, $label_keys, $shapeKey) {
                if ($shapeKey) {
                    $item = $action->getShape($shapeKey);
                }
                foreach ($label_keys as $label_key) {
                    $labels = $action->get("constants")->getItems()['project']->get($label_key);
                    $label = $labels[$item->get($label_key)] ?? null;
                    if ($label) {
                        $item->set($label_key, $label);
                    }
                }
                return $item;
            });
        };
    }

    /**
     * @return callable
     */
    public static function reduceBySpecialist(): callable
    {
        return function ($a) {
            $a->getCollection("packages")->update(function ($package) use ($a) {
                $user = $a->getShape("session")->getShape("user");
                $aid = $a->get("uriArgs.aid", $user->get("account_id"));

                $enquiries = [];
                if (isset($package['Enquiry'])) {
                    $enquiries = array_filter($package['Enquiry'], function ($sid) use ($aid) {
                        return intval($sid) === intval($aid);
                    }, ARRAY_FILTER_USE_KEY);

                    if (!count($enquiries)) {
                        unset($package['Enquiry']);
                    } else {
                        $package['Enquiry'] = $enquiries;
                    }
                }

                $interests = [];
                if (isset($package['Interest'])) {
                    $interests = array_filter($package['Interest'], function ($sid) use ($aid) {
                        return intval($sid) === intval($aid);
                    }, ARRAY_FILTER_USE_KEY);
                    $package['Interest'] = $interests;

                    if (!count($interests)) {
                        unset($package['Interest']);
                    }else {
                        $package['Interest'] = $interests;
                    }
                }

                $orders = [];
                if (isset($package['Order'])) {
                    $orders = array_filter($package['Order'], function ($sid) use ($aid) {
                        return intval($sid) === intval($aid);
                    }, ARRAY_FILTER_USE_KEY);
                    $package['Order'] = $orders;

                    if (!count($orders)) {
                        unset($package['Order']);
                    }else {
                        $package['Order'] = $orders;
                    }
                }

                return $package;
            });
        };
    }

    /**
     * @return callable
     */
    public static function processTenders(): callable
    {
        return function ($a) {
            $project = $a->get("project")->toArray();
            $history_statuses = $a->get("history");
            $orders       = $a->get("orders");
            $transactions = $a->get("transactions");
            $enquiries = [];
            foreach ($a->get("packages")->getItemsAsArray() as $tender) {
                if (!isset($enquiries[$tender["id"]])) {
                    $enquiries[$tender["id"]] = new Shape([]);
                }

                $sent_status = $history_statuses->filterByField('uid', 'sent')->getFirst();

                $dataToShow = null;
                $history = [];
                $interest = null;
                $enquiry = null;
                $order = null;
                $type = "";
                if (isset($tender['Enquiry'])) {
                    $enquiry = end($tender['Enquiry']);
                    if (in_array((int)$enquiry['last_status'], $history_statuses->filterByField('uid', 'added')->values("id"), true)) {
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
                if ($tender['awarded']) {
                    if ($orders) {
                        if ($orders->filterByStringField("tender_id", $tender["id"])->count()) {
                            $order_found = $orders->filterByStringField("tender_id", $tender["id"])->getLast();
                            $awarded_externally = $order_found->get("specialist_id") != $a->get("subcontractor.aid");
                        }

                        if ($transactions) {
                            if ($transactions->filterByStringField("tender_id", $tender["id"])->count()) {
                                $transactions_items = $transactions->filterByStringField("tender_id", $tender["id"])->getItemsAsArray();
                                uasort($transactions_items, function ($a, $b) {
                                    return $b['order_updated'] <=> $a['order_updated'];
                                });
                                $transaction_found = array_shift($transactions_items);
                                $transaction_found = new Shape($transaction_found);
                                if ($transaction_found->get("price")) {

                                    if (!isset($order_found) || (strtotime($transaction_found->get("order_updated")) > strtotime($order_found->get("created_at")))) {

                                        $awarded_externally = $transaction_found->get("subcontractor_id") != $a->get("subcontractor.aid");
                                    }
                                }
                            }
                        }
                    }
                }

                if (is_null($dataToShow) || !count($history)) {
                    unset($enquiries[$tender["id"]]);
                    continue;
                }

                $history_first = new Shape([]);
                if (!is_null($enquiry)) {
                    (new CollectionClass($enquiry['history'], Shape::class))->map(function ($item) use (&$history_first, $sent_status) {
                        if ((int)$item->get("status_id") === $sent_status->get("id")) {
                            $history_first = $item;
                        }
                    });
                }

                $insurances = $a->get("constants")->getItems()['project']->get("insurances");
                $insurance = $insurances[intval($project['employer_liabilty_insurance'])] ?? "";
                $projectStatuses = $a->get("constants")->getItems()['project']->get("phase");
                $projectStatus = $projectStatuses[intval($project['phase'])] ?? "";
                $types = $a->get("constants")->getItems()['project']->get("type");
                $projectType = $types[intval($project['type'])] ?? "";
                $region = $a->get("regions")->filterByField('id', strval($project['region']))->getFirst();

                $status = $history_statuses->filterByField('id', $dataToShow['last_status'])->getFirst();
                $statusLabel = $status->get("prosper_label");
                $statusLabel = $statusLabel ? $statusLabel : $status->get("label");
                $createdAt = $history_first->get('created_at', date("Y-m-d H:i:s"));
                if (!isset($updatedAt)) {
                    $updatedAt = $createdAt;
                }
                $history_first->set("created_at", date('Y-m-d H:i:s', strtotime(strval($createdAt) . " UTC") ?: null));
                $enquiries[$tender["id"]]->setItems(
                    [
                        'name'          => $project['name'],
                        "tid"           => $tender["id"],
                        'slug'          => $project['slug'],
                        'label'         => $tender['label'],
                        'project_id'    => $tender['project_id'],
                        'group_id'      => $project['group_id'],
                        'author_id'     => $project['project_creator'],
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
                        'project_start' => $project['start'],
                        'project_completion' => $project['end'],
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
            $a->get("packages")->map(function ($pack) use ($enquiries) {
                $tid = $pack->get("id");
                if (isset($enquiries[$tid])) {
                    $pack = new Shape(array_merge($enquiries[$tid]->toArray(), $pack->toArray()));
                }
                return $pack->toArray();
            });
        };
    }

    /**
     * @param array $label_keys
     * @return callable
     */
    public static function updateTenderLabels(array $label_keys): callable
    {
        return function ($action) use ($label_keys) {
            $action->getCollection("packages")->update(function ($package) use ($action, $label_keys) {
                foreach ($label_keys as $label_key) {
                    $labels = $action->get("constants")->getItems()['tender']->toArray()[$label_key] ?? [];
                    $package[$label_key] = $labels[$package[$label_key]] ?? "";
                }
                return $package;
            });
        };
    }

    /**
     * @param string $replace_with
     * @return callable
     */
    public static function replaceValuesByMembership(string $replace_with = '*****'): callable
    {
        return function ($action) use ($replace_with) {
            $action->getCollection("packages")->update(function ($item) use ($replace_with, $action) {
                $item = new Shape($item);
                if ($action->get("subcontractor.membership.trial")) {
                    $item->set("name", $replace_with);
                    $item->set("slug", $replace_with);
                }
                return $item;
            });
        };
    }

    /**
     * @return callable
     */
    public static function checkByRegionAndTrade(): callable
    {
        return function ($action) {
            $has_region = in_array(
                $action->get("project.region"),
                $action->get("subcontractor.regions", []),
                false
            );

            $action->getCollection("packages")->update(function ($package) use ($action, $has_region) {
                $accountTrades = $action->get("subcontractor.trades", []);
                $packageTrades = $package["packages"] ?? [];
                $package["has_trade"]  = array_intersect($packageTrades, $accountTrades);
                $package["has_region"] = $has_region;
                return $package;
            });
        };
    }


    /**
     * @return callable
     * Here we check if the subcontractor has register an interest in one of the tender for a project
     * if he has register interest we remove the project from the list
     */
    public static function checkByTenderHistory(): callable
    {
        return function ($action) {
            $action->getCollection("packages")->update(function ($package) use ($action) {
                $package['registered'] = in_array(
                    $action->get("subcontractor.aid"),
                    array_keys($package["Interest"] ?? []),
                    false
                );
                $package['can_register'] = $package['registered'] === false;
                return $package;
            });
        };
    }

    /**
     * @return callable
     */
    public static function countRegisteredInterests(): callable
    {
        return function ($action) {
            $types    = $action->get("history");
            $allowed_statuses = [
                $types->filterByField("uid", "accepted")->first()->get("id"),
                $types->filterByField("uid", "sent")->first()->get("id")
            ];
            $action->getCollection("packages")->update(function ($package) use ($allowed_statuses) {
                $interests = 0;
                $enquiries  = $package["Enquiry"] ?? [];
                foreach ($package["Interest"] ?? [] as $sid => $interest) {
                    if (in_array($interest["last_status"], $allowed_statuses, true)) {
                        $interests++;
                    }
                    //Unset and registered interest IDs so enquiries is only added from supply chain
                    unset($enquiries[$sid]);
                }
                $package["interest_count"] = count(array_keys($enquiries)) + $interests;
                return $package;
            });
        };
    }


    /**
     * @return callable
     */
    public static function checkPrequalification(): callable
    {
        return function ($action) {
            $aid = (int)$action->get("subcontractor.aid");
            try {
                $prequal = Manager::getService('account')->fetch("prequalification/$aid")->getShape('data');
                $status = ($action->get("sections")->count() === count($prequal->get("statuses")));
                array_map(function ($section) use (&$status) {
                    if (!$section['status']) {
                        $status = false;
                    }
                }, $prequal->get("statuses"));
            } catch (\Exception $e) {
                $status = false;
            }

            $action->set("subcontractor", ['prequalification' => $status], true);
        };
    }

    /**
     * @return callable
     */
    public static function canRegisterMessages(): callable
    {
        return function ($action) {

            $messages         = Config::get("site_messages.register_interest");
            $membership       = $action->get("subcontractor.membership");
            $tokens           = $membership->get("meta")['tokens'] ?? 0;
            $prequalification = $action->get("subcontractor.prequalification");

            $action->getCollection("packages")->update(function ($package) use ($membership, $messages, $tokens, $prequalification) {

                /*
                 * If the user has both region and trades we will set the matched key as true
                */
                $package['matched'] = ($package['has_region'] && $package['has_trade']);

                /*
                 * If the user has a flexi membership or a trial membership and have no tokens left
                 */
                if ($tokens <= 0) {
                    $package['can_register_message'] = $messages[($membership->get("flexi")) ? 'no_tokens_left' : 'trial'];
                    return $package;
                }

                /*
                 * If the user doesn't have their prequalification approved
                 */
                if (!$prequalification) {
                    $package['can_register_message'] = $messages['prequalification_not_approved'];
                    return $package;
                }

                /*
                 * If the user didn't have the correct region or trades in his account
                 */
                if (!$package['has_region'] || !$package['has_trade']) {
                    $package['can_register_message'] = $messages['no_trade_no_region'];
                    return $package;
                }

                return $package;
            });
        };
    }

    /**
     * @return callable
     */
    public static function canRegister(): callable
    {
        return function ($action) {
            $action->getCollection("packages")->update(function ($package) use ($action) {
                $membership = $action->get("subcontractor.membership");
                $tokens = $membership->get("meta")['tokens'] ?? 0;
                $prequalification = $action->get("subcontractor.prequalification");
                $package['can_register'] = ($package['has_trade'] &&
                    $package['has_region']    &&
                    !$package['awarded']      &&
                    !$package['registered']   &&
                    $prequalification         &&
                    (
                        //if the membership is flexi we need to check for tokens remaining
                        ($tokens > 0 && $membership->get("flexi")) || !$membership->get("flexi")
                    ) &&
                    (
                        //if the membership is trial we need to check for tokens remaining
                        ($tokens > 0 && $membership->get("trial")) || !$membership->get("trial")
                    )
                );
                return $package;
            });
        };
    }

    /**
     * @return callable
     */
    public static function formatTenders(): callable
    {
        return function ($action) {
            $action->getCollection("packages")->update(function ($package) use ($action) {
                $package['awarded']       = (bool)$package['awarded'];
                $package["registered"]    = (bool)$package['registered'];
                $package["can_register"]  = (bool)$package['can_register'];
                $package["matched"]       = (bool)$package['matched'];
                return $package;
            });
        };
    }

    /**
     * @param string $uidsKey
     * @param string $returnKey
     * @param int $status_id
     * @return callable
     */
    public static function loadProjectsTenderIdsByContractor(string $uidsKey = 'uids', string $returnKey = 'project_tenders', int $status_id = 1): callable
    {
        return function ($action) use ($uidsKey, $returnKey, $status_id) {
            try {
                $data = Manager::getService('project')->fetch("project", [
                    'status'              => $status_id,
                    'author_ids'          => $action->get($uidsKey)
                ])->getCollection('data');
                $result = [];
                $data->map(function ($project) use (&$result) {
                    $tenders = new Collection($project->get("tender"), Shape::class);
                    $result = array_merge($result, [
                        'tender_ids' => array_merge($result['tender_ids'] ?? [], $tenders->values("id")),
                        'project' => array_merge($result['project'] ?? [], [[
                            'id'     => $project->get("id"),
                            'name'   => $project->get("name"),
                            'author' => $project->get("author_id")
                        ]]),
                    ]);
                });
            } catch (\Exception $e) {
                $result = [];
            }
            $action->set($returnKey, $result);
        };
    }
}
