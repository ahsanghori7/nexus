<?php


namespace Email\Middleware;


use Core\Data\Collection;
use Email\Service\EloquentService;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class UserSettingsMiddleware
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
     * @param string $aidKey
     * @param string $returnKey
     * @return callable
     */
    public static function loadSettings(string $aidKey, string $returnKey = 'settings'): callable
    {
        return function ($a) use ($aidKey, $returnKey) {

            $id = intval($a->get($aidKey));
            if ($id) {
                $settings = self::getEloquent()
                    ->getModel("userSettings")
                    ->with("settingsKey")
                    ->where("user_id", $id);
                $data = [];
                (new Collection($settings->get()->toArray(), Shape::class))->map(function($item) use (&$data){
                    $group = $item->get("settings_key")['group'];
                    $key = $item->get("settings_key")['label'];
                    $data[$group][$key] = $item->get("settings_value");
                    return $data;
                });
                $a->set($returnKey, $data);
            }
        };
    }
}
