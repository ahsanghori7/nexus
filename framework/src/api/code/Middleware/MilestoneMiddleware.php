<?php

namespace Api\Middleware;

use App\Domain\Account\Manage;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;

class MilestoneMiddleware {

    const MILESTONE_NOT_STARTED_STATUS = "Not Started";
    const MILESTONE_IN_PROGRESS_STATUS = "In Progress";
    const MILESTONE_COMPLETED_STATUS = "Completed";
    const PACKAGE_MILESTONE_ENTITY_TYPE = "package_milestone";

    /**
     * @param int $tenderIdKey
     * @param string $milestoneLabel
     * @param string $userKey
     * @return void
     */
    public static function milestoneInProgress(string $tenderIdKey, string $milestoneLabel, string $userKey = 'user') : \Closure
    {
        return function (Shape $action) use ($tenderIdKey, $milestoneLabel, $userKey) {
            $tenderId = $action->get($tenderIdKey);

            $packageMilestone = Manager::getService("project")
            ->fetch(sprintf("milestones/package-milestones/packages/%s", $tenderId))
            ->getCollection("data")->filterByField("default_label", $milestoneLabel)->first();

            $packageMilestoneId = $packageMilestone->get("id");

            if($packageMilestoneId && $packageMilestone->get("status") === self::MILESTONE_NOT_STARTED_STATUS && !$packageMilestone->get("actual_start_date")) {
                $date = date("Y-m-d");
                $payload = ["actual_start_date" => $date];

                $res = Manager::getService('project')->write(
                    sprintf("milestones/package-milestones/%s/start", $packageMilestoneId),
                    new Shape(["data" => $payload])
                );

                $json = $res->get('json');

                if($json->has("error")){
                    throw new MiddlewareException("updateMilestoneFailed", "failed to update the milestone because ".$json->get("error.friendly"));
                }
                if ($json->get("data.success")) {
                    $action->set('logData', [
                        'user_id'     => $action->get("{$userKey}.id") ?? 0,
                        'entity_id'   => $packageMilestoneId,
                        'entity_type' => self::PACKAGE_MILESTONE_ENTITY_TYPE,
                        'type'        => sprintf("%s Started", $packageMilestone->get("label")),
                        'meta'        => json_encode([
                            'message'   => sprintf("Milestone %s Started", $packageMilestone->get("label")),
                            'user' => $action->get("{$userKey}.display_name") ?? 'system',
                            'data' => [
                                'previous' => [
                                    'planned_start_date' => $packageMilestone->get("planned_start_date"),
                                    'planned_end_date' => $packageMilestone->get("planned_end_date"),
                                    'actual_start_date' => $packageMilestone->get("actual_start_date"),
                                    'status' => self::MILESTONE_NOT_STARTED_STATUS,
                                ],
                                'current' => [
                                    'actual_start_date' => $date,
                                    'status' => self::MILESTONE_IN_PROGRESS_STATUS
                                ]
                            ]
                        ]),
                    ]);
                    LogsMiddleware::createLogs('logData')($action);
                }
            }
        };
    }

    /**
     * @param string $tenderIdKey
     * @param string $milestoneLabel
     * @param string $userKey
     * @return void
     */
    public static function milestoneComplete(string $tenderIdKey, string $milestoneLabel, string $userKey = 'user') : \Closure
    {
        return function (Shape $action) use ($tenderIdKey, $milestoneLabel, $userKey) {
            $tenderId = $action->get($tenderIdKey);

            $packageMilestone = Manager::getService("project")
                ->fetch(sprintf("milestones/package-milestones/packages/%s", $tenderId))
                ->getCollection("data")->filterByField("default_label", $milestoneLabel)->first();

            $packageMilestoneId = $packageMilestone->get("id");

            if($packageMilestoneId && $packageMilestone->get("status") === self::MILESTONE_IN_PROGRESS_STATUS && !$packageMilestone->get("actual_end_date")) {
                $date = date("Y-m-d");
                $payload = ["actual_end_date" => $date];

                $res = Manager::getService('project')->write(
                    sprintf("milestones/package-milestones/%s/complete", $packageMilestoneId),
                    new Shape(["data" => $payload])
                );

                $json = $res->get('json');

                if($json->has("error")){
                    throw new MiddlewareException("updateMilestoneFailed", "failed to update the milestone because ".$json->get("error.friendly"));
                }
                if ($json->get("data.success")) {
                    $action->set('logData', [
                        'user_id'     => $action->get("{$userKey}.id") ?? 0,
                        'entity_id'   => $packageMilestoneId,
                        'entity_type' => self::PACKAGE_MILESTONE_ENTITY_TYPE,
                        'type'        => sprintf("%s Completed", $packageMilestone->get("label")),
                        'meta'        => json_encode([
                            'message'   => sprintf("Milestone %s Completed", $packageMilestone->get("label")),
                            'user' => $action->get("{$userKey}.display_name") ?? 'system',
                            'data' => [
                                'previous' => [
                                    'planned_start_date' => $packageMilestone->get("planned_start_date"),
                                    'planned_end_date' => $packageMilestone->get("planned_end_date"),
                                    'actual_start_date' => $packageMilestone->get("actual_start_date"),
                                    'actual_end_date' => $packageMilestone->get("actual_end_date"),
                                    'status' => self::MILESTONE_IN_PROGRESS_STATUS,
                                ],
                                'current' => [
                                    'actual_end_date' => $date,
                                    'status' => self::MILESTONE_COMPLETED_STATUS
                                ]
                            ]
                        ]),
                    ]);
                    LogsMiddleware::createLogs('logData')($action);
                }
            }
        };
    }

}
