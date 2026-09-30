<?php

namespace Core\Middleware;

use Core\Service\Manager;
use Core\Service\ServiceAbstract;
use Core\Middleware\Exception as MiddlewareException;
use Core\Data\Shape;

class ServiceMiddleware
{

    const SERVICE = '';

    /**
     * @return ServiceAbstract
     * @throws \Exception
     */
    public static function getService (): ServiceAbstract
    {
        try {
            return Manager::getService(static::class::SERVICE);
        }catch (\Throwable $e){
            throw new MiddlewareException('service_failure', $e->getMessage());
        }
    }

    /**
     * @param string $key
     * @param string $path
     * @return callable
     */
    public static function writeAll(string $key, string $path) : callable {
        return function (Shape $action) use($key, $path) {
            foreach($action->getArray($key) as $item) {
                self::getService()->write($path, $item);
            }
        };
    }

    /**
     * @param string $key
     * @param string $path
     * @return callable
     */
    public static function writeOne(string $key, string $path) : callable {
        return function (Shape $action) use($key, $path) {
            self::getService()->write($path, $action->getArray($key));
        };
    }

    /**
     * @param string $path
     * @param string $saveKey
     * @return callable
     */
    public static function fetch(string $path, string $saveKey = "results") : callable {
        return function ($action) use($path, $saveKey) {
            $action->set(
                $saveKey,
                self::getService()->fetch($path)
            );
        };
    }

    /**
     * @param string $path
     * @param string $deleteParamsKey
     * @param string $saveKey
     * @return callable
     */
    public static function delete(string $path, string $deleteParamsKey, string $saveKey="delete_response") : callable
    {
        return function ($action) use ($path, $saveKey, $deleteParamsKey) {
            $params = $action->get($deleteParamsKey, []);
            if(!is_array($params)) {
                $params = [$deleteParamsKey => $params];
            }
            $action->set(
                $saveKey,
                self::getService()->delete($path, $params)
            );
        };
    }
}
