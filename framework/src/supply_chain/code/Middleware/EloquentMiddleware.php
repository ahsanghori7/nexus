<?php

namespace SupplyChain\Middleware;

use Core\Service\Manager;
use Core\Data\Shape;
use SupplyChain\EloquentService;

class EloquentMiddleware
{
    /**
     * @return EloquentService
     * @throws \Exception
     */
    public static function getService(): EloquentService
    {
        $service = Manager::getService("eloquent");
        if ($service instanceof EloquentService) {
            return $service;
        }
        throw new \Exception("Invalid service class for Eloquence Service");
    }

    /**
     * @param string $model
     * @param string|null $key
     * @return callable
     */
    public static function loadModelAll(string $model, string $key = null): callable
    {
        if (!$key) {
            $key = $model;
        }
        return function (Shape $a) use ($model, $key) {
            $a->set(
                $key,
                self::getService()->getModel($model)->all()->toArray()
            );
        };
    }

    /**
     * @param array<array<int, string>|string> $models
     * @return callable
     */
    public static function loadModelsAll(array $models): callable
    {
        return function ($a) use ($models) {
            foreach ($models as $model) {
                if (is_array($model)) {
                    self::loadModelAll($model[0], $model[1] ?? null)($a);
                } else {
                    self::loadModelAll($model)($a);
                }
            }
        };
    }

    /**
     * @param string $model
     * @param string $dataKey
     * @param string $idField
     * @param string|null $saveKey
     * @return callable
     */
    public static function loadOneById(string $model, string $dataKey, string $idField = "id", string $saveKey = null): callable
    {
        if (!$saveKey) {
            $saveKey = $model;
        }
        return function (Shape $a) use ($model, $idField, $dataKey, $saveKey) {
            $model = self::getService()->getModel($model)->where($idField, $a->get($dataKey));
            $a->set($saveKey, $model);
            $a->set($saveKey . "_exists", $model->exists());
        };
    }

    /**
     * @param string $model
     * @param array<string, string> $where
     * @param callable|null $cb
     * @param string|null $key
     * @return callable
     */
    public static function loadWhere(string $model, array $where, callable $cb = null, string $key = null): callable
    {
        if (!$key) {
            $key = $model;
        }
        return function (Shape $a) use ($model, $where, $cb, $key) {
            $query = self::getService()->getModel($model);
            foreach ($where as $k => $ak) {
                $query = $query->where($k, $a->get($ak));
            }
            if ($cb) {
                $cb($query, $a);
            } else {
                $a->set($key, $query->all());
            }
        };
    }

    /**
     * @param string $model
     * @param array<string, string> $where
     * @return callable
     */
    public static function deleteWhere(string $model, array $where = [], callable $cb = null): callable
    {
        return function ($a) use ($model, $where, $cb) {
            $query = self::getService()->getModel($model);
            foreach ($where as $k => $ak) {
                $query = $query->where($k, $a->get($ak));
            }
            if ($cb) {
                $query = $cb($query, $a);
            }
            $query->delete();
        };
    }
}
