<?php

namespace Prosper\Middleware\Relay;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Hubspot;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Manager;
use Core\Service\Exception\RestException;
use Prosper\Middleware\Relay;
use Prosper\Model\TeamManager;
use Prosper\Middleware\EmailMiddleware;

class TenderMiddleware
{

    public static function loadHistoryTypes(): callable
    {
        return function ($action) {
            $data = Manager::getService('project')->fetch("tender/history/type")->getCollection('data');
            $action->set("history", $data);
        };
    }

    /**
     * @param string $projectIdsKey
     * @param string $resultKey
     * @return \Closure
     */
    public static function loadTendersByProjectIds(string $projectIdsKey = '', string $resultKey = 'collection'): callable
    {
        return function ($action) use ($projectIdsKey) {
            try{
                $data = Manager::getService('project')->fetch("tender", ['ids' => '['.implode(",",$action->get($projectIdsKey)).']'])->getCollection('data');
            }catch (\Exception $e){
                $data = [];
            }
            $action->set("collection", $data);
        };
    }

    /**
     * @return callable
     */
    public static function loadTenderData(): callable
    {
        return function ($action) {

            $data = [];
            $tid = (int)$action->get("uriArgs.tid");

            $user = $action->getShape("session")->getShape("user");
            $sid = $user->get("account_id");

            $tender_data = Manager::getService('project')->fetch("tender/" . $tid)->getCollection('data');
            if ($tender_data->count()) {
                $history_status = $action->get("history")->filterByField("uid", 'sent');
                $contractor_id = $tender_data->getItems()['project']->get("group_id");
                $pid = $tender_data->getFirst()->get("project_id");
                $data = [
                    'pid'           => $pid,
                    'tid'           => $tid,
                    'sid'           => $sid,
                    'status'        => $history_status->getFirst()->get("id"),
                    'contractor_id' => $contractor_id,
                ];
            }
            $action->set("tender", new Shape($data));
        };
    }

    /**
     * @param string $contractorKey
     * @param string $subcontractorKey
     * @param string $setKey
     * @return callable
     */
    public static function hasHistoryRelationship(string $subcontractorKey, string $contractorKey, string $setKey = 'exist'): callable
    {
        return function ($action) use($contractorKey, $subcontractorKey, $setKey) {
            try {
                $history = Manager::getService("project")->fetch("tender", [
                    'specialist_id' => $action->get($subcontractorKey),
                    'group_id'      => $action->get($contractorKey)
                ])->getCollection("data");
                $action->set($setKey, (bool)$history->count());
            } catch (\Exception $e) {
                $action->set($setKey, false);
            }
        };
    }

    /**
     * @return callable
     */
    public static function registerInterest(): callable
    {
        return function ($action) {

            $service  = Manager::getService('project');
            $method   = "update";
            $status = false;

            if (method_exists($service, $method)) {
                try {
                    $tender = $action->get("tender");
                    if ($tender) {
                        $res = $service->write("project/" . $tender->get("pid") . "/tender/" . $tender->get("tid") . "/history", new Shape([
                            'data' => [
                                "specialist_id" => $tender->get("sid"),
                                "tender_history_type" => 'Interest',
                                "author_id" => null,
                                "status_id" => $tender->get("status"),
                                "meta" => []
                            ]
                        ]));
                        $content = $res->get("content");
                        $json    = is_string($content) ? json_decode($content, true) : [];
                        if(is_array($json)) {
                          $action->set("history_id", $json['data']['id'] ?? null);
                        }
                        $status = true;
                    }
                } catch (RestException $e) {
                    throw new MiddlewareException(
                        "relayError",
                        $e->getMessage()
                    );
                }

                $action->set("json", json_encode(['status' => $status]));
            }
        };
    }

    /**
     * @return callable
     */
    public static function processSendInterestEmail(): callable
    {
        return function ($a) {
            $tid = $a->get("uriArgs.tid");
            Relay::passthru("project", new Shape(["resource" => "tender/" . $tid]))($a);
            $res = new Shape(json_decode($a->get("json"), true)["data"]);
            $tender = $res->getShape($tid);
            $project = $res->getShape("project");

            $groupId = $project->get("group_id");
            $mainContractor = Manager::getService('account')->fetch("account", ['id' => $groupId])->getCollection('data')->first();
            $mainContractorUser = Manager::getService('account')->fetch("user", ['account_id' => $groupId])->getCollection('data')->first();
            try {
                $projects = Manager::getService('project')->fetch("project", ["group_id" => $groupId, "status" => 1])->getCollection('data');
                $nProjects = $projects->count();
            } catch (\Exception $e) {
                $nProjects = 0;
            }

            $region = $a->get("regions")->filterByField('id', (int)$project->get("region"), cast: 'int')->getFirst()->get('label');

            $originalCreateDate = $mainContractor->get("created_at", "");
            $createDate = $originalCreateDate ? date("jS F Y", strtotime($originalCreateDate)) : "";

            $originalStartOnSite = $tender->get("start_on_site", "");
            $startOnSite = $originalStartOnSite ? date("jS F Y", strtotime($originalStartOnSite)) : "";

            $mainContractor->set("contractor_address", $mainContractor->get("address", ""));
            EmailMiddleware::send("Register Interest",[
                    "sender"    => $a->getShape("session")->getShape("user"),
                    "tender" => new Shape([
                        'start_on_site' => $startOnSite,
                        'information'   => $tender->get("label", "")
                    ]),
                    "extra" => new Shape([
                        'interest_main_contractor_email'        => $mainContractorUser->get("email", ""),
                        'interest_main_contractor_phone'        => $mainContractorUser->get("contact_number", ""),
                        "interest_main_contractor_contact"      => $mainContractorUser->get("display_name", ""),
                        "interest_main_contractor"              => $mainContractor->get("name", ""),
                        'interest_main_contractor_num_projects' => $nProjects,
                        "interest_main_contractor_create_date"  => $createDate,
                        "interest_main_contractor_type"         => "Main Contractor",
                        "interest_main_contractor_address"      => $mainContractor->get("address", ""),
                    ]),
                    "project"  => new Shape([
                        'name'             => $project->get("name", ""),
                        'state'            => $region ?? "",
                        'address_one'      => $project->get("site_address_one", ""),
                        'address_two'      => $project->get("site_address_two", ""),
                        'address_city'     => $project->get("site_address_city", ""),
                        'address_postcode' => $project->get("site_address_postcode", ""),
                        'description'      => strip_tags(str_replace('<', ' <', $project->get("description", ""))),
                    ]),
                ]
            )($a);
        };
    }
}
