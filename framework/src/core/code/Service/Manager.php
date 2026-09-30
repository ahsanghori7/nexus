<?php

namespace Core\Service;

class Manager {

    /**
     * @var array<string, ServiceAbstract>
     */
    protected static array $services = [];

    /**
     * @param string $name
     * @param ServiceAbstract $service
     * @return void
     */
    public static function addService(string $name, ServiceAbstract $service) {
        self::$services[$name] = $service;
    }

    /**
     * @param array<string, ServiceAbstract> $services
     * @return void
     */
    public static function addServices(array $services) : void {
        foreach($services as $name => $service) {
            self::addService($name, $service);
        }
    }

    /**
     * @param string $name
     * @return ServiceAbstract
     * @throws \Exception
     */
    public static function getService(string $name) : ServiceAbstract
    {
        if(isset(self::$services[$name])) {
            return self::$services[$name];
        }
        throw new \Exception("Invalid Service $name");
    }
}
