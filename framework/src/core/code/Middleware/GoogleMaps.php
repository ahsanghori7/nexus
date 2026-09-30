<?php

namespace Core\Middleware;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Service\GoogleMapsService;
use Core\Middleware\Exception as MiddlewareException;


class GoogleMaps
{
    /**
     * @param string $key
     * @return GoogleMapsService
     * @throws \Exception
     */
    public static function getService(string $key = "google_maps") : GoogleMapsService {
        $service = Manager::getService($key);
        if($service instanceof GoogleMapsService) {
            return $service;
        }



        throw new \Exception("Google service must be instance of GoogleMapsService");
    }

    /**
     * @param array $origins
     * @param array $destinations
     * @param string $serviceId
     * @return \Closure
     */
    public static function getDistances(array $origins, array $destinations, string $serviceId = "google_maps")
    {
        return function ($action) use ($origins, $destinations, $serviceId) {
            $service = self::getService();
            return $service::getDistance($service::prepareDistanceAddresses($origins), $service::prepareDistanceAddresses($destinations), $serviceId);
        };
    }
}
