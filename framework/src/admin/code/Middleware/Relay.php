<?php

namespace Admin\Middleware;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Generic;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Exception\RestException;

class Relay
{
    /**
     * @param int $v
     * @return Callable
     */
    public static function isResource(string $resource, int $v = 1): callable
    {
        return function ($shape) use ($resource, $v): bool {
            $isVersion  = Generic::pathIndexEq("v$v", 1)($shape);
            $isResource = Generic::pathIndexEq($resource, 2)($shape);
            return $isVersion && $isResource;
        };
    }

    /**
     * @param string $serviceId
     * @param Shape $config
     * @param string $key
     * @return Callable
     */
    public static function resourceByKey(string $serviceId, Shape $config, string $key = "id"): callable
    {
        $resource = strval($config->get("resource", ""));
        return function ($shape) use ($serviceId, $key, $resource, $config) {
            $key = $shape->get("uriArgs." . $key);
            $config->set("resource", "$resource/$key");
            return self::passthru($serviceId, $config)($shape);
        };
    }

    /**
     * @param string $serviceId
     * @param Shape $config
     * @return Callable
     * @throws \Exception
     */
    public static function passthru(string $serviceId, Shape $config): callable
    {
        $service  = Manager::getService($serviceId);
        $resource = strval($config->get("resource", ""));
        $method   = strval($config->get("method", "fetch"));

        return function ($shape) use ($service, $resource, $method, $config) {
            if (method_exists($service, $method)) {
                $args = array_merge(
                    $shape->getShape("args")->toArray(),
                    $config->getShape("args")->toArray()
                );
                try {
                    if (in_array($method, ["fetch", "delete"])) {
                        $res = $service->$method($resource, $args);
                    } else {
                        $data = $shape->getShape("data")->toArray();
                        $res = $service->$method($resource, $data, $args);
                    }
                } catch (RestException $e) {
                    throw new MiddlewareException(
                        "relayError",
                        $e->getMessage()
                    );
                }
                $shape->set("json", $res->get("content"));
            }
        };
    }

    /**
     * @param string $serviceId
     * @param Shape $config
     * @return Callable
     */
    public static function load(string $serviceId, Shape $config): callable
    {
        return function (Shape $shape) use ($serviceId, $config) {
            self::passthru($serviceId, $config)($shape);
            $shape->set("relay", $shape->jsonDecode("json"));
        };
    }

    /**
     * @param callable $callback
     * @return Callable
     */
    public static function flattenData(callable $callback): callable
    {
        return function ($shape) use ($callback) {
            $relay = $shape->getShape("relay");
            $data  = $relay->getShape("data")->toArray();
            $set  = [];
            foreach ($data as $row) {
                $reduced = $callback($row);
                if (!is_array($reduced)) {
                    throw new MiddlewareException("RouteException", "Flatten Data callback must return array");
                }
                foreach ($reduced as $newRow) {
                    $set[] = $newRow;
                }
            }

            $shape->set("relay", $relay->set("data", $set));
        };
    }

    /**
     * @param string $key
     * @param array<int|string,string> $map
     * @param string|null $newKey
     * @return Callable
     */
    public static function map(string $key, array $map, string $newKey = null): callable
    {
        return function ($action) use ($key, $map, $newKey) {
            $relay = $action->getShape("relay");
            Generic::map($key, $map, $newKey)($relay);
            $action->set("relay", $relay);
        };
    }

    /**
     * @param array<string> $keys
     * @return Callable
     */
    public static function setJsonResponse(array $keys = ['data']): callable
    {
        return function (Shape $shape) use ($keys) {
            $json = [];
            foreach ($keys as $key) {
                $json[$key] = $shape->getShape("relay")->get($key);
            }
            $shape->set("json", json_encode($json));
        };
    }
}
