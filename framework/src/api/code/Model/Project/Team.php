<?php

namespace Api\Model\Project;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Service\AccountMiddleware;

class Team
{

    CONST TEAM_MEMBER_LABEL = "project_team_member";

    /**
     * @throws \Exception
     */
    public static function fetchTeamByProjectId(int $id)
    {
        return Manager::getService("project")->fetch("project/$id/team")->getCollection('data');
    }

    /**
     * @param int $pid
     * @param int $user_id
     * @param int $role_id
     * @return void
     * @throws \Exception
     */
    public static function addTeamMember(int $pid, int $user_id, int $role_id)
    {
        try {
            $res = Manager::getService("project")->write("project/$pid/add_team_member", new Shape(["data" => [
                'user_id' => $user_id,
                'role_id' => $role_id
            ]]));
            if ( $res->get("info.http_code") === 200 ) {
                $json = $res->json("content");
                if ( is_array($json) && isset($json["data"]) ) {
                    $id = $json['data']['id'];
                }
            }
        } catch (\Exception $e) {
            $id = 0;
        }

        return $id ?? 0;
    }

    /**
     * @param int $pid
     * @param int $user_id
     * @param int $role_id
     * @return void
     * @throws \Exception
     */
    public static function updateTeamMember(int $pid, int $user_id, int $role_id)
    {
        Manager::getService("project")->update("project/$pid/team_member/$user_id", new Shape(["data" => [
            'role_id'    => $role_id
        ]]));
    }

    /**
     * @return \Closure
     */
    public static function getUserTeamRoleId(): \Closure
    {
        return function ($a){
            AccountMiddleware::load("user/type","", "user_types")($a);
            $type = $a->get("user_types")->filterByField("label", self::TEAM_MEMBER_LABEL);
            return $type->first()->get("id");
        };
    }

    /**
     * @param int $pid
     * @param int $user_id
     * @param string $searchKey
     * @return bool
     */
    public static function memberIsInTeam(int $pid, int $user_id, string $searchKey = "id"): bool
    {
        try{
            $team = self::fetchTeamByProjectId($pid);
        }catch (\Exception $e){
            error_log("Team member $user_id not in team for project $pid: " . $e->getMessage());
            return false;
        }
        return $team->filterByField($searchKey, $user_id)->count() > 0;
    }

    /**
     * @param int $pid
     * @param int $user_id
     * @return bool
     * @throws \Exception
     */
    public static function removeTeamMemberById(int $pid, int $user_id): bool
    {
        if(self::memberIsInTeam($pid, $user_id)) {
            try{
                Manager::getService("project")->delete("project/$pid/team_member/$user_id");
            }catch (\Exception $e){
                error_log("Error removing team member: " . $e->getMessage());
                return false;
            }
            return true;
        }
        return false;
    }


}
