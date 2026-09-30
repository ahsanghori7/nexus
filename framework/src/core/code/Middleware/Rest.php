<?php

namespace Core\Middleware;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Service\RestService;
use Core\Middleware\Generic;
use Core\Service\Exception\RestException;
use Core\Middleware\Exception as MiddlewareException;

class Rest
{

    const PAYLOAD_KEY = "payload";

    /**
     * @param string $resource
     * @param string $serviceId
     * @param array<int|string, string> $paramMap
     * @param string $saveKey
     * @param string $errorKey
     * @return Callable
     * @throws \Exception
     */
    public static function fetch(
        string $resource, string $serviceId, array $paramMap = [], string $saveKey="", string $errorKey="", callable $postProcessor = null
    ) : Callable {
        $service = self::getService($serviceId);
        return function(Shape $shape) use ($resource, $service, $paramMap, $serviceId, $saveKey, $errorKey, $postProcessor) {
            $params = [];
            if($paramMap) {
                $params = self::processParams($shape, $paramMap);
            }
            try {
                $res = $service->fetch($resource, $params);
                $key = empty($saveKey) ? $serviceId . "_" . str_replace("/", "_", $resource) : $saveKey;
                $shape->set($key,
                    $res->get("data")
                );
                if($postProcessor) {
                    $res = $postProcessor($res, $shape);
                }
                return $res;
            }
            catch(RestException $e) {
                if($errorKey) {
                    $shape->set($errorKey, $e);
                }
                else {
                    throw new MiddlewareException("restFetchError", $e->getMessage());
                }
            }
        };
    }

    /**
     * Process and Typecast the params from the shape
     * @param Shape $shape
     * @param array $paramMap
     * @return array
     */
    public static function processParams(Shape $shape, array $paramMap) {
        $params = [];
        foreach($paramMap as $key => $param) {
            $type = "string";
            if ($param instanceof Shape) {

                $type = $param->get("type", "string");
                $paramValue = $shape->value($key)->cast($type);
                if($paramValue !== null) {
                    $params[$param->get("key", $key)] = $paramValue;
                }
            } else {
                if(is_array($param)) {
                    $paramKey = $param["key"] ?? $key;
                    $type = $param["type"] ?? "string";
                }
                else {
                    $paramKey = $key;
                }
                $value = $shape->value($key)->cast($type);
                if($value !== null) {
                    $params[$paramKey] = $value;
                }
            }
        }
        return $params;
    }

    /**
     * Dynamically generate the url by exporting the keys from the resource and loading them from the action
     * @param string $serviceId
     * @param string $resource
     * @param array<int|string, string> $paramMap
     * @param string $saveKey
     * @param string $errorKey
     * @return Callable
     */
    public static function fetchDynamic(
        string $serviceId, string $resource, array $paramMap = [], string $saveKey="", string $errorKey="", callable $postProcessor = null
    ) : Callable {

        return function(Shape $a) use($serviceId, $resource, $paramMap, $saveKey, $errorKey, $postProcessor) {
            $keys = preg_match_all("/{([^}]+)}/", $resource, $matches);
            if($keys) {
                foreach($matches[1] as $key) {
                    $val = $a->get($key);
                    if($val) {
                        $resource = str_replace("{" . $key . "}", $val, $resource);
                    }
                    else {
                        throw new MiddlewareException("restFetchError", "Key $key not found in action");
                    }
                }
            }
            return self::fetch($resource, $serviceId, $paramMap, $saveKey, $errorKey, $postProcessor)($a);
        };
    }


    /**
     * Dynamically generate the url by exporting the keys from the resource and loading them from the action
     * @param string $serviceId
     * @param string $resource
     * @param array<int|string, string> $paramMap
     * @param string $saveKey
     * @param string $errorKey
     * @return Callable
     */
    public static function write(
        string $serviceId, string $resource, callable $preProcessor = null, $dataKey = self::PAYLOAD_KEY, callable $postProcessor = null
    ) : Callable {
        return function(Shape $a) use($serviceId, $resource, $dataKey, $preProcessor, $postProcessor) {
            $keys = preg_match_all("/{([^}]+)}/", $resource, $matches);
            if($keys) {
                foreach($matches[1] as $key) {
                    $val = $a->get($key);
                    if($val) {
                        $resource = str_replace("{" . $key . "}", $val, $resource);
                    }
                    else {
                        throw new MiddlewareException("restError", "Url Key $key not found in action");
                    }
                }
            }

            $payload = $a->get($dataKey);
            if($preProcessor) {
                $payload = $preProcessor($payload, $a);
            }
            $service = self::getService($serviceId);
            $res = $service->write($resource, new Shape(
                [
                    "data"    => $payload->toArray(),
                    "params"  => $a->getArray("params"),
                    "headers" => $a->getArray("headers")
                ]
            ));
            if($postProcessor) {
                $res = $postProcessor($res, $a, $res->get("json"));
            }
            return $res;
        };
    }


    /**
     * @param string $resource
     * @param string $idKey
     * @param string $saveKey
     * @param string $serviceId
     * @return Callable
     */
    public static function loadById(
        string $resource, string $idKey, string $saveKey, string $serviceId=""
    ) : Callable {
        return function($a) use($serviceId, $resource, $idKey, $saveKey) {
            if(!$serviceId) {
                $serviceId = $resource;
            }

            $service = self::getService($serviceId);
            $id      = $a->get($idKey);
            if(!$id) {
                throw new MiddlewareException(
                    "restUpdateError",
                    "Load Resource requires valid id, none found with key $idKey"
                );
            }

            $res  = $service->fetch($resource . "/" . $id);
            $code = $res->get("info.http_code");
            if($code === 200) {
                $a->set($saveKey, $res->getShape("data"));
            }
            else {
                throw new MiddlewareException(
                    "restFetchError",
                    "Failed to fetch resource $res with key $idKey, status $code returned"
                );
            }
        };
    }

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
     * @param string $resource
     * @param string $idKey
     * @param array $dataMap
     * @return callable
     */
    public static function updateResourceById
    (string $serviceId, string $resource, string $idKey, array|callable $dataMap
    ) : callable
    {
        return function(Shape $a) use($serviceId, $resource, $idKey, $dataMap) {
            $service = self::getService($serviceId);
            $id      = $a->get($idKey);
            if(!$id) {
                throw new MiddlewareException(
                    "restUpdateError",
                    "Update Resource requires valid id, none found with key $idKey"
                );
            }
            try {
                $data = is_callable($dataMap) ? $dataMap($a) : $a->keys($dataMap)->toArray();
                if(!is_array($data)) {
                    throw new MiddlewareException("restUpdateError",
                        "Resource update data must be array " . gettype($data) . " Supplied"
                    );
                }

                $res = $service->update($resource . "/" . $id, new Shape(
                    ["data" => $data])
                );
                $a->set("update_response", $res);
            } catch (RestException $e) {
                throw new MiddlewareException(
                    "restError",
                    $e->getMessage()
                );
            }
        };
    }

    /**
     * @param string $serviceId
     * @param callable $urlGenerator
     * @param array $dataMap
     * @return callable
     */
    public static function updateResourceByUrl(string $serviceId, callable $urlGenerator, array $dataMap) : callable
    {
        return function(Shape $a) use($serviceId, $urlGenerator, $dataMap) {
            $service = self::getService($serviceId);
            $url     = $urlGenerator($a);
            if(!is_string($url)) {
                throw new MiddlewareException("restUpdateError",
                    "Resource url must be string"
                );
            }
            $data = $a->keys($dataMap)->toArray();
            $res = $service->update($url, new Shape(
                    ["data" => $data])
            );
            $a->set($serviceId . "_update_response", $res);
        };
    }

    /**
     * @param string $serviceId
     * @param string $resource
     * @return callable
     */
    public static function delete(string $serviceId, string $resource, $responseKey = "delete_response") : callable
    {
        return function(Shape $a) use($serviceId, $resource, $responseKey) {
            $service = self::getService($serviceId);
            $resource = self::formatUrl($resource, $a);
            $res = $service->delete($resource);
            $a->set($responseKey, $res);
        };
    }

    /**
     * @param string $serviceId
     * @param string $resource
     * @param string $payloadKey
     * @param callable $preProcessor
     * @param callable $postProcessor
     * @param string $responseKey
     * @return callable
     */
    public static function update(
        string $serviceId, string $resource, $payloadKey = self::PAYLOAD_KEY, $preProcessor = null, $postProcessor = null, $responseKey = "update_response"
    ) : callable
    {
        return function(Shape $a) use($serviceId, $resource, $payloadKey, $preProcessor, $postProcessor, $responseKey) {
            $keys = preg_match_all("/{([^}]+)}/", $resource, $matches);
            if($keys) {
                foreach($matches[1] as $key) {
                    $val = $a->get($key);
                    if($val) {
                        $resource = str_replace("{" . $key . "}", $val, $resource);
                    }
                    else {
                        throw new MiddlewareException("restError", "Url Key $key not found in action");
                    }
                }
            }
            $service = self::getService($serviceId);
            $resource = self::formatUrl($resource, $a);
            $payload = $a->getShape($payloadKey);
            if($preProcessor) {
                $payload = $preProcessor($payload, $a);
            }
            $res = $service->update($resource, new Shape(["data" => $payload->toArray()]));
            if($postProcessor) {
                $res = $postProcessor($res, $a, $res->get("json"));
            }
            $a->set($responseKey, $res);
        };
    }

    /**
     * @param string $serviceId
     * @return RestService
     * @throws \Exception
     */
    public static function getService(string $serviceId) : RestService {
        $service = Manager::getService($serviceId);
        if($service instanceof RestService) {
            return $service;
        }

        throw new \Exception("Invalid rest service $serviceId");
    }

    /**
     * @param string $resource
     * @param Shape $shape
     * @return string
     */
    public static function formatUrl(string $resource, Shape $shape) : string
    {
        $keys = preg_match_all("/{([^}]+)}/", $resource, $matches);
        if($keys) {
            foreach($matches[1] as $key) {
                $val = $shape->get($key);
                if($val) {
                    $resource = str_replace("{" . $key . "}", $val, $resource);
                }
                else {
                    throw new MiddlewareException("restError", "Url Key $key not found in action");
                }
            }
        }
        return $resource;
    }
}
