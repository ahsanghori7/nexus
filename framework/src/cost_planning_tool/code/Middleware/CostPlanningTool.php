<?php

namespace CostPlanningTool\Middleware;

use CostPlanningTool\EloquentService;
use Core\Service\Manager;

class CostPlanningTool
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
     * @param string $resultKey
     * @param string $emailKey
     * @return callable
     */
    public static function loadSubmittedByEmail(string $resultKey = 'submitted', string $emailKey = 'email'): callable
    {
        return function ($action) use ($resultKey, $emailKey) {
            $action->set($resultKey, self::getEloquent()->getModel("submitted")
                ->where("email", $action->get($emailKey))->get()->toArray());
        };
    }

    /**
     * @param string $dataKey
     * @return callable
     */
    public static function saveSubmitted(string $dataKey = ''): callable
    {
        return function ($action) use ($dataKey) {
            self::getEloquent()->getModel("submitted")->create($action->get($dataKey));
        };
    }





}
