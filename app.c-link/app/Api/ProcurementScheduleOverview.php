<?php

namespace App\Api;

use App\Factory\UserFactory;
use JsonException;

class ProcurementScheduleOverview
{
    const MILESTONE_IN_PROGRESS_STATUS = "In Progress";
    const MILESTONE_COMPLETE_STATUS = "Completed";
    const PACKAGE_MILESTONE_ENTITY_TYPE = "package_milestone";

    /**
     * @param int $tenderId
     * @param string $milestoneLabel
     * @return void
     */
    public static function milestoneInProgress(int $tenderId, string $milestoneLabel) : void
    {
        $packageMilestoneData = Project::get(sprintf("milestones/package-milestones/packages/%s", $tenderId));
        if(!empty($packageMilestoneData)) {
            $packageMilestone = array_filter($packageMilestoneData, function($item) use ($milestoneLabel) {
                return $item['default_label'] === $milestoneLabel;
            });
            $packageMilestone = array_shift($packageMilestone);

            $packageMilestoneId = isset($packageMilestone['id']) ? $packageMilestone['id'] : null;

            //Update the enquiry issue date milestone to "In Progress" if it exists
            if($packageMilestoneId) {
                if ($packageMilestone['status'] !== self::MILESTONE_IN_PROGRESS_STATUS && empty($packageMilestone['actual_start_date'])) {
                    $data = ['actual_start_date' => date('Y-m-d')];
                    Project::post(sprintf("milestones/package-milestones/%s/start", $packageMilestoneId), $data);

                    $milestoneMessage = sprintf('%s Started', $milestoneLabel);
                    self::createLogs($packageMilestoneId, $milestoneMessage);
                }
            }
        }
    }

    /**
     * @param int $tenderId
     * @param string $milestoneLabel
     * @return void
     */
    public static function milestoneComplete(int $tenderId, string $milestoneLabel) : void
    {
        $packageMilestoneData = Project::get(sprintf("milestones/package-milestones/packages/%s", $tenderId));
        if(!empty($packageMilestoneData)) {
            $packageMilestone = array_filter($packageMilestoneData, function($item) use ($milestoneLabel) {
                return $item['default_label'] === $milestoneLabel;
            });
            $packageMilestone = array_shift($packageMilestone);

            $packageMilestoneId = isset($packageMilestone['id']) ? $packageMilestone['id'] : null;

            if($packageMilestoneId) {
                //Only update if the milestone is not already complete and actual end date is not set
                if ($packageMilestone['status'] !== self::MILESTONE_COMPLETE_STATUS && empty($packageMilestone['actual_end_date'])) {
                    //Update the enquiry issue date milestone to "Completed" if it exists

                    $data = ['actual_end_date' => date('Y-m-d') ];
                    $res = Project::post(sprintf("milestones/package-milestones/%s/complete", $packageMilestoneId), $data);
                    $milestoneMessage = sprintf('%s Completed', $milestoneLabel);
                    self::createLogs($packageMilestoneId, $milestoneMessage);
                }
            }
        }
    }

    /**
     * @param int $packageMilestoneId
     * @param string $milestoneMessage
     * @return void
     */
    public static function createLogs(int $packageMilestoneId, string $milestoneMessage) : void
    {
        //Create log entry for milestone transition
        $user = UserFactory::getUser(); //Get current user

        $logData = [
            'user_id'     => $user ? $user->getId() : 0,
            'entity_id'   => $packageMilestoneId,
            'entity_type' => self::PACKAGE_MILESTONE_ENTITY_TYPE,
            'type'        => $milestoneMessage,
            'meta'        => json_encode([
                'message' => sprintf('Milestone %s', $milestoneMessage),
                'user'    => $user ? $user->getData('display_name') : 'system',
                'data'    => [
                    'previous' => [],
                    'current' => []
                ]
            ]),
        ];

        Project::post('logs', $logData);
    }
}
