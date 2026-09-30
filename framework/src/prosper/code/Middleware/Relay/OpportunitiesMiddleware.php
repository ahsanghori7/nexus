<?php

namespace Prosper\Middleware\Relay;

use Core\Data\Collection;
use Core\Data\Shape;
use Core\Middleware\Generic;
use Core\Middleware\Service\AccountMiddleware;
use Core\Service\Manager;
use Core\Middleware\Collection as CollectionMiddleware;
use Prosper\Model\Opportunity;
use Prosper\Model\Activity;

class OpportunitiesMiddleware
{

    public const TENDER_STATE_SUGGESTION = 0;
    public const TENDER_STATE_PUBLISHED = 2;

    /**
     * @return callable
     */
    public static function loadCollection(): callable
    {
        return function ($action) {
            $data = Manager::getService('project')->fetch("tender", ['status' => 1])->getCollection('data');
            $action->set("collection", $data);
        };
    }

    /**
     * @return callable
     */
    public static function loadProjectTenderData(): callable
    {
        return function ($action) {
            $action->get("trades")->map(function($item) use (&$trades){
                $trades[$item->get("id")] = $item->get("label");
            });
            $action->getCollection("collection")->update(function ($project) use ($trades) {
                $project = new Shape($project);
                $projectTenders = $project->get("tender");
                if (is_array($projectTenders)) {
                    $tenders = array_map(function ($tender, $tid) use ($trades) {
                        $tender['id'] = $tid;
                        foreach ($tender['packages'] ?? [] as $package_id) {
                            if(isset($trades[$package_id])){
                                $tender['packages'][]     = $trades[$package_id];
                                $tender['packages_ids'][] = $package_id;
                            }
                        }
                        $tender['history'] = $tender["Interest"] ?? [];
                        unset($tender["Interest"]);
                        return $tender;
                    }, $projectTenders, array_keys($projectTenders));

                    $project->set("packages", $tenders, true);
                }

                return $project;
            });
        };
    }

    /**
     * @return callable
     */
    public static function loadLiveTenders(): callable
    {
        return function ($action) {
            $unlockedProjects = $action->get("unlocked_projects") ?? [];
            $action->getCollection("collection")->update(function ($project) use ($unlockedProjects) {
                $project = new Shape($project);
                $projectId = $project->get("pid");
                if (in_array($projectId, $unlockedProjects)) {
                    $project->set("tenders", array_values((array)$project->get("packages")));
                    return $project;
                }
                $packages = $project->get("packages");
                $today = date("Y-m-d");
                $tenders = array_filter(array_map(function ($tender) use ($today) {
                $tender = (array)$tender;
                $returnDate = isset($tender['tender_return']) && strtotime($tender['tender_return']) !== false
                    ? date("Y-m-d", strtotime($tender['tender_return']))
                    : null;
                $startOnSite = isset($tender['start_on_site']) && strtotime($tender['start_on_site']) !== false
                    ? date("Y-m-d", strtotime($tender['start_on_site']))
                    : null;
                if (intval($tender['state']) === self::TENDER_STATE_PUBLISHED &&
                    $returnDate >= $today) {
                    return [
                            'id'            => $tender['id'],
                            'label'         => $tender['label'],
                            'service'       => $tender['service'],
                            'size'          => $tender['size'],
                            'tender_return' => $returnDate,
                            'start_on_site' => $startOnSite,
                            'awarded'       => (bool)$tender['awarded'],
                            "registered"    => (bool)$tender['registered'],
                            "can_register"  => (bool)$tender['can_register'],
                            "can_register_message"  => $tender['can_register_message'] ?? '',
                            'packages'      => $tender['packages'] ?? [],
                            'history'       => $tender['history'] ?? [],
                            'Enquiry'       => $tender['Enquiry'] ?? [],
                        ];
                    }
                    return false;
                }, (array)$packages));

                $project->set("tenders", array_values($tenders));
                return $project;
            });
        };
    }

    /**
     * @param string $totalOpportunitiesKey
     * @return callable
     */
    public static function loadOpportunitiesTotal(string $totalOpportunitiesKey): callable
    {
        return function ($action) use ($totalOpportunitiesKey) {
            $regions       = $action->get("subcontractor.regions", []);
            $trades        = $action->get("subcontractor.trades",  []);
            $opportunities = 0;

            $action->getCollection("collection")->mapChild("tenders", function ($parent, $child) use ($trades, $regions, &$opportunities) {
                if (Opportunity::canRegister($child += [
                    'has_trade'  => array_intersect((array)$child["packages"], $trades),
                    'has_region' => Opportunity::hasRegion(intval($parent->get("region")), $regions),
                ])) {
                    $opportunities++;
                }
                return $child;
            });

            $action->set($totalOpportunitiesKey, $opportunities);
        };
    }
    /**
     * @return Callable
     */
    public static function loadOpportunities(): callable
    {

        return function ($action) {
            $history_statuses = Manager::getService('project')->fetch('tender/history/type')->getCollection('data');
            $sent_status = $history_statuses->filterByField('uid', 'sent')->getFirst();
            $opportunities = [];
            $contractors = [];
            $projects = $action->getCollection("collection")->getItemsAsArray();
            foreach ($projects as $project) {
                $project = new Shape($project);
                $has_region = Opportunity::hasRegion(intval($project->get("region")), $action->get("subcontractor.regions", []));
                $accountTrades = $action->get("subcontractor.trades", []);
                $packages = (array)$project->get("tenders");
                foreach ($packages as $package) {
                    $package = (array)$package;
                    $package["has_trade"]  = array_intersect((array)$package["packages"], $accountTrades);
                    $package["has_region"] = $has_region;
                    $project_author = $project->get("group_id", $project->get("author_id"));
                    Opportunity::addContractor($package, $sent_status, $contractors, intval($project_author));

                    if (Opportunity::canRegister($package)) {
                        $opportunities[] = array_merge($package, [
                            "pid" => $project->get("id"),
                            "tid" => $package["id"],
                            "name" => $project->get("name"),
                        ]);
                    }
                }
            }

            $accountsData = Opportunity::getAccountsData($contractors);

            $types = $action->get("history");
            $action->set(
              "opportunities",
              Opportunity::formatOpportunities($opportunities, $accountsData, $types)
            );
      };
    }

    /**
     * @return Callable
     */
    public static function loadActivities(): callable
    {
      return function ($action) {
        $aid = $action->get("uriArgs.aid");
        $history_statuses = Manager::getService('project')->fetch('tender/history/type')->getCollection('data');

        $interests = [];
        $enquiries = [];
        $orders = [];
        $data = Activity::getData($aid);
        foreach ($data as $i) {
          $projectName = $i["name"];
          $pid = $i["pid"];
          $projectHistory = Manager::getService('project')->fetch("project/$pid/tender/history")->getCollection('data')->getItems();
          $projectHistory = end($projectHistory);

          $tenders = array_filter((array)$projectHistory->get("tender"), function ($tender) {
            return isset($tender["Order"]);
          });

          $latest_history_date[$pid] = null;
          foreach ($i["tender"] as $tid => $t) {
            $interests[$pid][$tid] = Activity::processInterests($t, $pid, $tid, $latest_history_date);
            $interests[$pid][$tid]["id"] = $pid . $tid;
            $interests[$pid][$tid]["project"] = $projectName;

            $enquiries[$pid][$tid] = Activity::processEnquiries($t, $history_statuses);
            $enquiries[$pid][$tid]["id"] = $pid . $tid;
            $enquiries[$pid][$tid]["project"] = $projectName;

            $orders[$pid][$tid] = Activity::processOrders($t, (int)$aid, $pid, $tid, $tenders, $latest_history_date, $history_statuses);
            $orders[$pid][$tid]["id"] = $pid . $tid;
            $orders[$pid][$tid]["project"] = $projectName;
          }
        }

        $transactions =  (array)Activity::processTransaction((array)Activity::getTransactions($aid));
        $action->set("activities", Activity::formatActivities(array_merge_recursive($interests, $enquiries, $orders, $transactions)));
      };
    }

    /**
     * @return Callable
     */
    public static function reduceByAccountRegion(): callable
    {
        return function ($action) {
            CollectionMiddleware::reduce(function ($project, $collection, $action) {
                return ((in_array($project->get("region"), $action->get("subcontractor.regions"), false)));
            })($action);
        };
    }

    /**
     * @return callable
     */
    public static function reduceByActiveContractors(): callable
    {
        return function ($action) {
            $contractors = [];
            $action->getCollection("collection")->map(function ($project) use (&$contractors) {
                $project = new Shape($project);
                $project_author = $project->get("group_id", $project->get("author_id"));
                $contractors[$project_author] = $project_author;
                return $project;
            });
            $action->set("contractors", $contractors);
            AccountMiddleware::loadAccountsByIdArray("contractors")($action);
            $accounts = (new Collection($action->get("accounts"), Shape::class))->filterByField("status", 0, "!=", cast: 'int');
            $accounts_ids = $accounts->values("id");
            $unlocked_projects = $action->get("unlocked_projects", []);
            $unlocked_projects_str = array_map('strval', $unlocked_projects);
            CollectionMiddleware::reduce(function ($project) use ($accounts_ids, $unlocked_projects_str)  {
                $project_id = (string) $project->get("pid");
                $contractor_id = $project->get("group_id");
                if (in_array($project_id, $unlocked_projects_str, true)) {
                    return true;
                }
                return in_array($contractor_id, $accounts_ids, false);

            })($action);
        };
    }

    /**
     * @return Callable
     */
    public static function reduceByAccountTrades(): callable
    {
        return function ($action) {
            CollectionMiddleware::reduce(function ($project, $collection, $action) {
                foreach ($project->get("tender") as $tender) {
                    if (isset($tender['awarded']) && $tender['awarded']) {
                        continue;
                    }
                    /*
                     * Ignore tenders that are not published
                     */
                    if (intval($tender['state']) !== self::TENDER_STATE_PUBLISHED) {
                        continue;
                    }
                    if ((is_array($action->get("subcontractor.trades")) &&
                        array_intersect($tender['packages'], $action->get("subcontractor.trades"))
                    )) {
                        return true;
                    }
                }
            })($action);
        };
    }

    /**
     * @return callable
     * Here we check if the subcontractor has register an interest in one of the tender for a project
     * if he has register interest we remove the project from the list
     */
    public static function reduceByTenderHistory(): callable
    {
        return function ($action) {
            CollectionMiddleware::reduce(function ($project, $collection, $action) {
                $has_interest = false;
                foreach ($project->get("tender") as $tender) {
                    $interest_sids = array_keys($tender['Interest'] ?? []);
                    if (in_array($action->get("subcontractor.aid"), $interest_sids, false)) {
                        $has_interest = true;
                    }
                }
                return !$has_interest;
            })($action);
        };
    }

    /**
     * @return callable
     */
    public static function reduceBySupplyChainContractor(): callable
    {
        return function ($action) {
            $account = $action->getShape("session")->getShape("account");
            $accountId = $account->get('id');

            $contractors = Manager::getService('account_v2')->fetch(sprintf("account/%s/supply-chain/main-contractors", $accountId))->getShape('data')->toArray();

            CollectionMiddleware::reduce(function ($project) use ($contractors) {
                return !(
                    in_array($project->get("group_id"),  $contractors) ||
                    in_array($project->get("author_id"), $contractors)
                );
            })($action);
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
            $action->getCollection("collection")->update(function ($project) use ($action) {
                $project = new Shape($project);

                $tenders = array_map(function ($tender) use ($action) {
                    $tender = (array)$tender;
                    $interest_sids = array_keys((array)$tender['history'] ?: []);
                    $tender['registered'] = in_array(
                      $action->get("subcontractor.aid"),
                      $interest_sids,
                      false
                    );
                    $tender['can_register'] = $tender['registered'] === false;
                    return $tender;
                }, (array)$project->get("packages"));

                $project->set("packages", $tenders);

                return $project;
            });
        };
    }

    /**
     * @return callable
     */
    public static function reduceByNoTenders(): callable
    {
        return function ($action) {
            $unlockedProjects = $action->get("unlocked_projects") ?? [];

            CollectionMiddleware::reduce(function ($project) use ($unlockedProjects) {
                $pid = $project->get("pid");
                if (in_array($pid, $unlockedProjects)) {
                    return true;
                }
                return !empty($project->get("tender"));
            })($action);
        };
    }

    /**
     * @param int $limit
     * @return callable
     */
    public static function restrictByIndex(int $limit): callable
    {
        return function ($action) use ($limit) {
            $action->getCollection("collection")->update(function ($item, $index) use ($limit, $action) {
                $item->set("restricted", (($index > $limit - 1) && $action->get("subcontractor.membership.trial")));
                return $item;
            });
        };
    }

    /**
     * @return callable
     */
    public static function updateRegionLabel(): callable
    {
        return function ($action) {
            $action->getCollection("collection")->update(function ($item) use ($action) {
                $filter = $action->get("regions")->filterByField("id", $item->get("region"), cast: 'int');
                if ($filter->count()) {
                    $item->set("region", $filter->getFirst()->get("label"));
                }
                return $item;
            });
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
     * @param string $replace_with
     * @return callable
     */
    public static function replaceValuesByMembership(string $replace_with = '*****'): callable
    {
        return function ($action) use ($replace_with) {
            $action->getCollection("collection")->update(function ($item) use ($replace_with, $action) {
                if ($action->get("subcontractor.membership.trial")) {
                    $item->set("name", $replace_with);
                    $item->set("slug", $replace_with);
                }
                return $item;
            });
        };
    }
}
