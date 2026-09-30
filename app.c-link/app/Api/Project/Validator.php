<?php

namespace App\Api\Project;

use App\Api\Project as ProjectApi;
use App\Models\Project as ProjectModel;
use App\Api\Client\Response\JsonException;
use App\core\Request;
use App\Models\User;

class Validator {
    /**
     * @var Retain one project context
     */
    protected static $projectContext;

    /**
     * @param int $pid
     * @return Retain|mixed
     * @throws \Exception
     */
    public static function getProjectContext(int $pid) {
        if(!self::$projectContext) {
            if(is_numeric($pid)) {
                $project = ProjectApi::getProject($pid);
            }
            else {
                $project = ProjectApi::getProjectBySlug($pid);
            }
            if(!$project) {
                throw new JsonException("Invalid Project Id");
            }

            self::$projectContext = new ProjectModel($project, $pid);
        }

        return self::$projectContext;
    }

    /**
     * @param ProjectModel $project
     * @return void
     */
    public static function setProjectContext(ProjectModel $project) {
        self::$projectContext = $project;
    }

    /**
     * @param Request $request
     * @param User $user
     * @throws Exception
     */
    public static function isOwner(Request $request, User $user, array &$args) {
        $pid = (int) $request->getQueryValue("pid");
        $project = self::getProjectContext($pid);
        try{
            if(!$project->isOwner($user)){
                throw new JsonException("You don't have access to this project");
            }
        }
        catch(\Exception $e) {
            throw new JsonException($e->getMessage());
        }

        $args["project"] = $project;
    }
}
