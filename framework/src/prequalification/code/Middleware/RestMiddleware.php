<?php

namespace Prequalification\Middleware;

use Core\Layer\Http\Incoming as IncomingHttp;

use Core\Middleware\Exception;
use Core\Service\Manager;
use Core\Router\Route\Action;

class RestMiddleware
{
    /**
     * @return callable
     */
    public static function hasJsonBody(string $storageKey = "body") : callable {
        return function (Action $action) use($storageKey) {
            $req = $action->getRoute()->getRequest();
            if($req instanceof IncomingHttp) {
                $json = $req->getJson();
                if(!$json->hasData()) {
                    throw new Exception("bad_request", "No Json Provided", 400);
                }
                $action->set($storageKey, $json);
            }
        };
    }

    /**
     * @param string $entity
     * @param array<string, mixed> $arguments
     * @return callable
     */
    public static function loadCollection(string $entity, array $arguments = []) : callable {
        return function($action) use ($entity, $arguments) {
            $action->set("collection",
                Manager::getService("eloquent")
                    ->fetch($entity, $arguments)
                    ->getCollection("results")
            );
        };
    }

    /**
     * @param string $key
     * @return callable
     */
    public static function collectionToJson(string $key = 'data')  : callable {
        return function($action) use ($key) {
            $collection = $action->getCollection("collection");
            $result = ($key) ? [$key => $collection ?? []] : $collection ?? [];
            $action->set("json",
                json_encode($result)
            );
        };
    }

    /**
     * @param int $maxLimit
     * @param int $defaultLimit
     * @return callable
     */
    public static function getLimitOffset(int $maxLimit, int $defaultLimit) : callable {
        return function(Action $action) use($maxLimit, $defaultLimit) : array {
            $args     = $action->getRoute()->getRequest()->getArgs();
            $limit    = intval($args->get("limit", $defaultLimit));
            $offset   = intval($args->get("offset", 0));
            if($limit > $maxLimit) { $limit = $maxLimit;}

            return [$limit, $offset];
        };
    }

    /**
     * @param callable $cb
     * @return callable
     */
    public static function setJsonDataResponse(callable $cb) : callable {
        return function($a) use($cb) {
            $a->set("json", json_encode(['data' => $cb($a)]));
        };
    }

}
