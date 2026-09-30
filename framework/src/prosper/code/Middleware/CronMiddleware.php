<?php

namespace Prosper\Middleware;

use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Manager;

class CronMiddleware
{

    public CONST EMAIL_BLACKLIST_NEW_TENDER_ID = 1;

    /**
     * @return callable
     */
    public static function loadSubcontractorEmailBlacklist (): callable
    {
        return function ($action) {
            $blacklist = Manager::getService('account')->fetch("email/blacklist", ['email_id' => self::EMAIL_BLACKLIST_NEW_TENDER_ID])->getCollection('data');
            $action->set("email_blacklist", $blacklist->values("user_id"));
        };
    }

    /**
     * @param int $daysInterval
     * @return callable
     */
    public static function loadLiveTenders(int $daysInterval = 1): callable
    {
        return function ($action) use ($daysInterval) {
            $live_tenders = [];
            $offerings_ids = [
                'region' => [],
                'trade'  => []
            ];
            $data = [];

            try{
                $tender_data = [
                    'awarded' => 0, //not awarded
                    "state"   => 2, //tender publish state
                    "status"  => 1  //project publish
                ];
                if($daysInterval){
                    $tender_data['published_at'] = date('Y-m-d',strtotime("-$daysInterval days"));
                }
                $data = Manager::getService('project')->fetch("tender", $tender_data)->getCollection('data');
            }
            catch (\Exception $e){
                new MiddlewareException(
                    "cron_process_failure", $e->getMessage()
                );
            }

            $contractors = [];
            foreach($data as $project) {
                foreach($project->getShapeArray("tender") as $id => $tender) {
                    $region = $project->get("region");
                    $live_tenders[$id] = [
                        'region'   => $region,
                        'packages' => $tender->get("packages"),
                        'history'  => array_keys($tender->getShape('Interest')->toArray()),
                        'project'  => [
                            'id'   => $project->get("pid"),
                            'name' => $project->get("name"),
                            'lgoo' => $project->get("logo"),
                            'type' => $project->get("type"),
                            'gia'  => $project->get("gia"),
                            'group_id' => $project->get("group_id"),
                        ],
                        'tender' => [
                            'label'         => $tender->get("label"),
                            'return_date'   => $tender->get("tender_return"),
                            'decision_date' => $tender->get("decision_date"),
                            'size'          => $tender->get("size"),
                        ]
                    ];
                    $group_id = $project->get("group_id");
                    $contractors[$group_id] = $group_id;

                    if(!in_array($region, $offerings_ids['region'])) {
                        $offerings_ids['region'][] = $region;
                    }
                    $offerings_ids['trade']  = array_unique(
                        array_merge(
                            array_values($tender->get("packages")),
                            $offerings_ids['trade']
                        )
                    );
                }
            }

            $action->setItems([
                "live_tenders"  => $live_tenders,
                "offerings_ids" => $offerings_ids,
                "contractors"   => $contractors
            ]);
        };
    }

    /**
     * @return callable
     */
    public static function filterByActiveContractors(): callable
    {
        return function ($action){
            $tenders = $action->get("live_tenders");
            foreach($tenders as $key => $tender){
                if(!in_array($tender['project']['group_id'], $action->get("contractors"))){
                    unset($tenders[$key]);
                }
            }
            $action->set("live_tenders", $tenders);
        };
    }

    /**
     * @param int $reminderDaysBefore
     * @return callable
     */
    public static function loadSubcontractorTenderHistory(int $reminderDaysBefore = 3): callable
    {
        return function ($action) use ($reminderDaysBefore) {
            $reminders = [];
            $projects = [];
            $history = [];
            $main_contractors_aid = [];
            $reminderDaysBefore_prefix = $reminderDaysBefore > 0 ? '+' : '-';
            $reminderDaysBefore = abs($reminderDaysBefore);
            try{
                $tender_data = [
                    "awarded"        => 0, //not awarded
                    "state"          => 2, //tender publish state
                    "status"         => 1,  //project publish
                    "tender_return"  => date('d-m-Y',strtotime("$reminderDaysBefore_prefix$reminderDaysBefore days")),  //tender return date
                ];
                $projects = Manager::getService('project')->fetch("tender", $tender_data)->getCollection('data');
                $history = Manager::getService('project')->fetch("transaction")->getShape('data')->toArray();
            }
            catch (\Exception $e){
                new MiddlewareException(
                    "cron_process_failure", $e->getMessage()
                );
            }

            /*
             * Store subcontractors transactions
             */
            $subcontractor_history = [];
            array_map(function ($item) use (&$subcontractor_history) {
                $subcontractor_history[$item['subcontractor_id']][$item['tender_id']] = true;
                return $item;
            }, $history);

            /*
             * Tender accepted status id
             */
            $accepted_status = $action->get("history")->filterByStringField("uid", "accepted")->getFirst();

            /*
             * Loop through all projects
             */
            foreach($projects as $project) {
                /*
                 * Loop through all tenders
                 */
                foreach($project->getShapeArray("tender") as $tid => $tender) {
                    /*
                     * Loop through all tender history enquiries
                     */
                    if($tender->getShape('Enquiry')->hasData()) {
                        array_map(function ($item) use (&$reminders, &$main_contractors_aid, $project, $subcontractor_history, $tid, $accepted_status, $tender) {
                            $history = end($item['history']);
                            $sid = $history['specialist_id'];
                            $author_id = null;
                            //get the contractor author id from the history
                            array_map(function($item) use ($sid, &$author_id) {
                                if($item['author_id'] && ( (int)$item['author_id'] !== (int)$sid)){
                                    $author_id = $item['author_id'];
                                }
                                return $item;
                            }, $item['history']);

                            /*
                             * If the subcontractor have accepted the enquiry but didn't sent a quote
                             */
                            if (!isset($subcontractor_history[$sid][$tid]) && (int)$item['last_status'] === $accepted_status->get("id")) {
                                $main_contractor = $project->get("group_id");
                                $reminders[$sid][] = [
                                    'pid'                 => $project->get("pid"),
                                    'tid'                 => $tid,
                                    'sid'                 => $sid,
                                    'project_name'        => $project->get("name"),
                                    'tender_label'        => $tender->get("label"),
                                    'main_contractor_aid' => $main_contractor,
                                    'main_contractor_uid' => $author_id ?? $main_contractor,
                                ];
                                $main_contractors_aid[$main_contractor] = $main_contractor;
                            }
                            return $item;
                        }, $tender->getShape('Enquiry')->toArray());
                    }
                }
            }

            $action->setItems([
                "quote_reminders" => $reminders,
                "sids" => array_keys($reminders),
                "main_contractors_aids" => array_keys($main_contractors_aid)
            ]);
        };
    }

    /**
     * @return callable
     */
    public static function loadSubcontractorsOfferings(): callable
    {
        return function ($action) {

            $offerings_ids = $action->get("offerings_ids");
            $region_ids = implode(",", array_unique($offerings_ids['region']));
            $trade_ids = implode(",", array_unique($offerings_ids['trade']));

            $data = Manager::getService('account')->fetch("account/offerings", [
                'region' => "[$region_ids]",
                'trade'  => "[$trade_ids]"]
            )->getCollection('data');

            $action->set("subcontractors", $data);
        };
    }

    /**
     * @return callable
     */
    public static function matchSubcontractors (): callable
    {
        return function ($action) {
            $matches = [];
            $blacklist = $action->get("email_blacklist", []);
            $subcontractors = $action->getCollection("subcontractors")->filter(function($s) use($blacklist) {
                 return !in_array($s->get("account_id"), $blacklist);
            });

            foreach($subcontractors as $subcontractor){
                $sid           = $subcontractor->get("account_id");
                foreach ($action->get("live_tenders") as $tender) {
                    $tender_region   = $tender['region'] ?? [];
                    $tender_packages = $tender['packages'] ?? [];
                    if(!in_array($sid, $tender['history'], true) !== false) {
                        $subRegions = $subcontractor->getArray("offerings.region");
                        $subTrade   = $subcontractor->getArray("offerings.trade");
                        if (in_array($tender_region, $subRegions) && array_intersect($subTrade, $tender_packages)) {
                            $matches[$tender['project']['id']] = [
                                "sid" => $sid,
                                "date" => date("Y-m-d H:i:s"),
                                "tender" => json_encode($tender)
                            ];
                        }
                    }
                }
            }

            $action->setItems([
                'matches' => $matches,
                'sids'    => array_keys($matches)
            ]);
        };
    }
}
