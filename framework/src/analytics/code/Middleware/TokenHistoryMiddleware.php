<?php

namespace Analytics\Middleware;

use Core\Data\Shape;
use Core\Service\Manager;
use DateInterval;
use DatePeriod;
use DateTime;

class TokenHistoryMiddleware
{

  /**
   * @param string $routeKey
   * @param string $argsKey
   * @return callable
   */
  public static function getCollection(string $routeKey, string $argsKey) : callable {
    return function(Shape $a) use ($argsKey, $routeKey){
      $a->set("collection", Manager::getService('account')->fetch("token_history/$routeKey", $a->get($argsKey))->getCollection('data'));
    };
  }

  /**
   * @param string $dateKey
   * @param string $intervalKey
   * @return callable
   */
  public static function aggregateData(string $dateKey, string $intervalKey) : callable {
    return function(Shape $a) use ($intervalKey,$dateKey){
      $date_key = $a->get($intervalKey);
      $intervals = [];

      array_map(function ($item) use (&$intervals, $date_key, $dateKey) {
        $time = (new DateTime($item[$dateKey]));
        $key = $time->format($date_key);
        $intervals[$key]['total'] = [
          'cost'   => $intervals[$key]['total']['cost'] ?? 0,
          'tokens' => $intervals[$key]['total']['tokens'] ?? 0,
        ];
        $intervals[$key]['total']['cost']   += $item['cost'] ?? 0;
        $intervals[$key]['total']['tokens'] += $item['token_amount'] ?? 1;

        $intervals[$key]['date'] = [
          'year'  => $time->format("Y"),
          'month' => $time->format("m"),
          'day'   => $time->format("d"),
          'week'  => $time->format("W"),
        ];

        $intervals[$key]['data'][] = $item;
        $item['interval'] = $intervals;
        return $item;
      }, $a->getCollection("collection")->getItemsAsArray());

      $intervals += $a->get("interval", []);
      ksort($intervals);
      $a->set("relay", ['data' => $intervals]);
    };
  }

  /**
   * @return callable
   */
  public static function getHistoryTenderData() : callable {
    return function(Shape $a){
      $history_ids = $a->get("collection")->values("tender_history_id");
      $tenders = Manager::getService("project")->fetch("tender/history",['id' => implode(",",$history_ids)])->getCollection('data');
      $a->getCollection("collection")->update(function ($item) use($tenders){
        $item['tender'] = $tenders->filterByField("id", $item['tender_history_id'], cast: true)->first()->get();
        return $item;
      });
    };
  }

  /**
   * @param string $interval
   * @param string $dataKey
   * @return callable
   */
  public static function setDateIntervalKey(string $interval = 'day', string $dataKey = 'interval_date_key') : callable {
    return function (Shape $a) use ($interval, $dataKey) {
      $interval = $a->get($interval) ?: 'day';
      $a->set($dataKey, match($interval){
        "day"   => 'Y-m-d',
        "week"  => 'Y-W',
        "month" => 'Y-m',
        "year"  => 'Y',
        default => 'Y-m-d'
      });
    };
  }

  /**
   * @param string $start
   * @param string $end
   * @param string $interval
   * @return callable
   */
  public static function generateDatesInterval(string $start = null, string $end = null, string $interval = 'day') : callable {
    return function(Shape $a) use ($start, $end, $interval){
      $interval = $a->get($interval) ?: 'day';
      $keys = [];
      $start = $a->get($start) ?: date("Y-m-d");
      $end   = $a->get($end)   ?: date("Y-m-d");
      $start_datetime = new DateTime($start);
      $end_datetime   = new DateTime($end);
      if($a->get($start)) {
        $start_datetime->modify('first day of this month');
      }
      if($a->get($end)) {
        $end_datetime->modify('first day of next month');
      }
      $end_interval = DateInterval::createFromDateString("1 $interval");
      $period  = new DatePeriod($start_datetime, $end_interval, $end_datetime);
      foreach ($period as $date) {
        $keys[$date->format($a->get("interval_date_key"))] = null;
      }
      $a->set("interval", $keys);
    };
  }

  /**
   * @param string $subcontractorKey
   * @return callable
   */
  public static function getHistorySubcontractorData(string $subcontractorKey) : callable
  {
    return function (Shape $a) use ($subcontractorKey){
      $ids = $a->get("collection")->values($subcontractorKey);
      if($ids = array_filter($ids)) {
        $subcontractors_ids = "[" . implode(",", $ids) . "]";
        $subcontractors = Manager::getService("account")->fetch("account/$subcontractors_ids")->getCollection('data');
        $a->getCollection("collection")->update(function ($item) use ($subcontractors, $subcontractorKey) {
          $item = new Shape($item);
          $subcontractor = $subcontractors->filterByStringField("id", $item->get($subcontractorKey))->first();
          if ($subcontractor->hasData()) {
            $subcontractor_data = [
              'id'   => $subcontractor->get("id"),
              'name' => $subcontractor->get("name"),
            ];
          }
          $item->set("subcontractor", $subcontractor_data ?? []);
          return $item;
        });
      }
    };
  }

    /**
     * @param string $projectKeys
     * @return callable
     */
    public static function getHistoryProjectData(string $projectKeys) : callable
    {
        return function (Shape $a) use ($projectKeys){
            $ids = $a->get("collection")->values($projectKeys);
            if($ids = array_unique(array_filter($ids))) {
                $project_ids = "[" . implode(",", $ids) . "]";
                $projects = Manager::getService("project")->fetch("project", ['id' => $project_ids])->getCollection('data');
                $a->getCollection("collection")->update(function ($item) use ($projects, $projectKeys) {
                    $item = new Shape($item);
                    $project = $projects->filterByStringField("id", $item->get($projectKeys))->first();
                    if ($project->hasData()) {
                        $project_name = $project->get("name");
                    }

                    $item->set("project_name", $project_name ?? null);
                    return $item;
                });
            }
        };
    }

}
