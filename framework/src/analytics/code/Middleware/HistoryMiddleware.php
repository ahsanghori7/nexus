<?php


namespace Analytics\Middleware;


use Analytics\EloquentService;
use Core\Data\Shape;
use Core\Service\Manager;

class HistoryMiddleware
{


    /**
     * @return EloquentService
     * @throws \Exception
     */
    public static function getEloquent(): EloquentService
    {
        $service = Manager::getService("eloquent");
        if ($service instanceof EloquentService) {
            return $service;
        }
        throw new \Exception("Invalid service class for Eloquence Service");
    }

    /**
     * @return callable
     */
    public static function loadHistoryStatuses(): callable
    {
        return function ($action) {
            $action->set("types", self::getEloquent()->getModel("tenderHistoryStatus")->getAll());
        };
    }

    /**
     * @param string $historyType
     * @param string $startDateKey
     * @return \Closure
     */
    public static function loadCollection(string $historyType = "interest", string $startDateKey = "args.start_date"): \Closure
    {
        return function ($action) use ($historyType, $startDateKey)  {
            $model = self::getEloquent()->getModel("tenderHistory")->where("tender_history_type", $historyType);
            if($action->get($startDateKey)){
                $model = $model->whereDate("created_at", ">=", $action->get($startDateKey));
            }
            $action->set("collection", $model->get()->toArray());
        };
    }

    /**
     * @param string $type_uid
     * @return \Closure
     */
    public static function groupHistoryByType(string $type_uid = 'sent'): \Closure
    {
        return function ($action) use ($type_uid){
            $collection = $action->getCollection("collection");
            $allow_statuses_ids = $action->get("types")->filterByExistInArray('uid', [$type_uid])->getIds();
            if ($collection->count()) {
                foreach ($collection->getItemsAsArray() as $item) {
                    $item       = new Shape($item);
                    $tid        = $item->get("tender_id");
                    $sid        = $item->get("specialist_id");
                    $status_id  = $item->get("status_id");
                    $created_at = $item->get("created_at");
                    $history[$tid][$sid]['interaction'] = !in_array($status_id, $allow_statuses_ids, true);
                    $history[$tid][$sid]['created_at']  = $created_at;
                }
            }
            $action->set("history", $history ?? []);
        };
    }

    /**
     * @return \Closure
     */
    public static function parseHistory(): \Closure
    {
        return function ($action){
            $group = [];
            $has_history = false;
            foreach($action->get("history", []) as $items){
                foreach($items as $item){
                    $item = new Shape($item);
                    $date = $item->get("created_at");
                    $y    = date("Y", strtotime($date));
                    $m    = date("m", strtotime($date));
                    $d    = date("d", strtotime($date));
                    $key  = ($item->get("interaction") === true) ? 'interacted' : 'not_interacted';
                    $group['years'][$y]['months'][$m]['days'][$key][$d]++;
                    $group['total'][$key]++;
                    $group['years'][$y][$key]['total']++;
                    $group['years'][$y]['months'][$m][$key]['total']++;
                    $has_history = true;
                }
            }

            $percentages = [];
            if($has_history) {
                $total = $group['total']['interacted'] + $group['total']['not_interacted'];
                $percentages['years']['total'] = [
                    'percentage' => [
                        'interacted' => number_format(($group['total']['interacted'] / $total) * 100, 2) . "%",
                        'not_interacted' => number_format(($group['total']['not_interacted'] / $total) * 100, 2) . "%"
                    ],
                    'total' => [
                        'interacted' => $group['total']['interacted'],
                        'not_interacted' => $group['total']['not_interacted']
                    ]
                ];

                foreach ($group['years'] as $year_key => $years) {
                    $percentages['years'][$year_key]['total'] = self::percentages($years);
                    foreach ($years['months'] as $month_key => $months) {
                        $percentages['years'][$year_key]['month'][$month_key] = self::percentages($months);
                    }
                }
            }

            $action->set("history", $percentages);
        };
    }

    /**
     * @param array $data
     * @return array
     */
    public static function percentages(array $data): array
    {
        $interacted     = $data['interacted']['total']     ?? 0;
        $not_interacted = $data['not_interacted']['total'] ?? 0;
        $total          = $interacted + $not_interacted;
        foreach(['interacted', 'not_interacted'] as $type){
            $percentages['percentage'][$type] = $$type ? number_format(($$type / $total) * 100, 2) . "%" : '0%';
            $percentages['total'][$type]      = $$type ?: 0;
        }
        return $percentages ?? [];
    }
}
