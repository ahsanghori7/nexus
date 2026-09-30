<?php

namespace Prosper\Middleware\Relay;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Data\Collection as CollectionClass;

class InterestsMiddleware
{

    /**
     * @param string $key
     * @return callable
     */
    public static function loadCollection(string $key = "collection"): callable
    {
        return function ($action) use ($key) {
            $user = $action->getShape("session")->getShape("user");
            $aid = $user->get("account_id");
            try{
                $data = Manager::getService('project')->fetch("tender", ["specialist_id" => $aid, "tender_history_type" => "Interest"])->getCollection('data');
            }catch (\Exception $e){
                $data = [];
            }
            $action->set($key, $data);
        };
    }

    /**
     * @return callable
     */
    public static function sortByLatestRegisteredDate(): callable
    {
        return function ($action) {
            $collection = $action->getCollection("collection");
            if ($collection->count()) {
                $collection->sort(function ($a, $b) {
                    return $b->get("latest_history") <=> $a->get("latest_history");
                });
            }
        };
    }

    /**
     * @param string $key
     * @return callable
     */
    public static function processUnlockedProjects(string $key = "collection"): callable
    {
        return function ($action) use ($key) {
            $history_statuses = $action->get("history");
            $unlocked_projects = $action->get("unlocked_projects");
            $user = $action->getShape("session")->getShape("user");
            $collection = $action->getCollection($key);
            if ($collection->count()) {
                foreach ($collection->getItemsAsArray() as $items) {
                    $pid = $items['pid'];
                    $interests[$pid] = new Shape([
                        'id' => $pid,
                        'name' => $items['name'],
                        'packages' => []
                    ]);
                    $packages = [];
                    $latest_history_date[$pid] = $unlocked_projects[$pid] ?? null;
                    foreach ($items['tender'] as $tid => $tender) {
                        if(!isset($tender['Interest']) || !in_array($user->get("account_id"), array_keys($tender['Interest']))){
                            continue;
                        }
                        $tender['Interest'] = $tender['Interest'][$user->get("account_id")] ?? [];
                        if(!$tender['Interest']){
                            $packages[] = [
                                'label'         => $tender['label'],
                                'tender_return' => date("Y-m-d", strtotime($tender['tender_return'])),
                                'start_on_site' => date("Y-m-d", strtotime($tender['start_on_site'])),
                                'created_at'    => null,
                                'status'        => null,
                            ];
                            continue;
                        }
                        $interest = $tender['Interest'];
                        $history = end($interest['history']);
                        $status = $history_statuses ? $history_statuses->filterByField('id', $history['status_id'])->getFirst() : null;
                        $statusLabel = $status ? $status->get("prosper_label") : "";
                        $label = $status ? $status->get("label") : "";
                        $statusLabel = $statusLabel ? $statusLabel : $label;
                        $packages[] = [
                            'label'      => $tender['label'],
                            'tender_return' => date("Y-m-d", strtotime($tender['tender_return'])),
                            'start_on_site' => date("Y-m-d", strtotime($tender['start_on_site'])),
                            'created_at' => $history['created_at'],
                            'status' => $statusLabel,
                            'status_id' => $history['status_id']
                        ];
                    }
                    $interests[$pid]->setItems([
                        'packages'       => $packages,
                        'latest_history' => $latest_history_date[$pid]
                    ]);
                }
                $action->set($key, new CollectionClass($interests ?? [], $collection->getObjectClass()));
            }
        };
    }

    /**
     * @return Callable
     */
    public static function processInterests(string $key = "collection"): callable
    {
        return function ($action) use ($key) {
            $history_statuses = $action->get("history");
            $collection = $action->getCollection($key);
            if ($collection->count()) {
                foreach ($collection->getItemsAsArray() as $items) {
                    $pid = $items['pid'];
                    $interests[$pid] = new Shape([
                        'id' => $pid,
                        'name' => $items['name'],
                        'packages' => []
                    ]);
                    $packages = [];
                    $latest_history_date[$pid] = null;
                    foreach ($items['tender'] as $tid => $tender) {
                        $interest = end($tender['Interest']);
                        $history = end($interest['history']);
                        $status = $history_statuses ? $history_statuses->filterByField('id', $history['status_id'])->getFirst() : null;
                        $statusLabel = $status ? $status->get("prosper_label") : "";
                        $label = $status ? $status->get("label") : "";
                        $statusLabel = $statusLabel ? $statusLabel : $label;
                        $packages[] = [
                            'label'      => $tender['label'],
                            'tender_return' => date("Y-m-d", strtotime($tender['tender_return'])),
                            'start_on_site' => date("Y-m-d", strtotime($tender['start_on_site'])),
                            'created_at' => $history['created_at'],
                            'status' => $statusLabel,
                            'status_id' => $history['status_id']
                        ];

                        if (strtotime($history['created_at']) > $latest_history_date[$pid]) {
                            if ($latest_history = strtotime($history['created_at'])) {
                                $latest_history_date[$pid] = $latest_history;
                            }
                        }
                    }
                    $interests[$pid]->setItems([
                        'packages'       => $packages,
                        'latest_history' => date("Y-m-d H:i:s", $latest_history_date[$pid])
                    ]);
                }
                $action->set($key, new CollectionClass($interests ?? [], $collection->getObjectClass()));
            }
        };
    }
}
