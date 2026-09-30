<?php

namespace Admin\Middleware\Relay;

use Admin\Middleware\Relay;
use Core\Service\Manager;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Exception\RestException;

class Project
{
    /**
     * @return Callable
     */
    public static function flatten(): callable
    {
        $users_all = Manager::getService('account')->fetch('user/all')->getCollection('data');
        $regions   = Manager::getService('account')->fetch('region')->getCollection('data');
        $constants = Manager::getService('project')->fetch('project/constants')->get('data.project.status');

        //Load all users and mapped them to the user id in order to later retrieve it by the project author id
        $users = [];
        $users_all->map(function($user) use (&$users){
            $users[$user->get("id")] = $user;
        });

        return Relay::flattenData(function (array $project) use ($regions, $constants, $users): array {
            $data = [];
            $status = "";
            if (is_array($constants) && is_array($project)) {
                $status = $constants[$project['status'] ?? ""] ?? "";
            }
            try {
                $region = $regions->filterByField('id', (int)$project['region'], cast: 'int')->getFirst()->get('label');
            } catch (\Exception $e) {
                $region = 'N/A';
            }

            $author_display_name = '';
            $project_author = $users[(int)$project['author_id']] ?? null;
            if($project_author){
                $author_display_name = $project_author->get("display_name");
            }

            $data[] = [
                "id"                => (int) $project['id'],
                "name"              => $project['name'],
                "slug"              => $project['slug'],
                "gia"               => (int) $project['gia'],
                "author_id"         => (int) $project['author_id'],
                "author_name"       => $author_display_name,
                "region"            => $region,
                "status"            => $status,
                "created_at"        => $project['created_at'],
                "status_updated_at" => $project['status_updated_at'] ?? $project['created_at']
            ];
            return $data;
        });
    }
}
