<?php

namespace Core\Middleware;

use Core\Layer\IncomingAbstract;
use Core\Middleware\Exception as MiddlewareException;
use Core\Router\Route\Action;
use Core\Data\Shape;
use Core\Data\Validator;
use Core\Service\Manager;
use Core\Service\RestService;

class Generic
{
    /**
     * @param callable $f
     * @return Callable
     */
    public static function wrapper(Callable $f) : Callable {
        return $f;
    }

    /**
     * @param string $location
     * @return Callable
     */
    public static function redirect(string $location) : Callable {
        return function () use ($location) : void {
            header("Location: $location");
            exit();
        };
    }

    /**
     * @param array<string, array<string,bool>|int|string|true|null> $config
     * @return Callable
     */
    public static function collectUrlArguments(array $config) : Callable
    {
        return function (Action $action) use($config) {
            $data = $action->getRoute()->getRequest()->getArgs()->toArray();
            $args = [];
            foreach($config as $k => $arg) {
                if(is_string($k)) {
                    $value = $data[$k] ?? $arg;
                    if(is_array($arg)) {
                        $required = $arg["required"] ?? false;
                        $value    = $data[$k] ?? $arg["default"] ?? null;
                        if($required && !$value) {
                            $json = json_encode(["missing_args" => $k]);
                            throw new MiddlewareException(
                                "missingUriArguments", is_string($json) ? $json : ""
                            );
                        }
                    }
                    if(!is_null($value)) {
                        $args[$k] = $value;
                    }
                }
            }
            $action->set("args", $args);
        };
    }

    /**
     * @param array<string,string> $keys
     * @return Callable
     */
    public static function hasArguments(array $keys) : Callable
    {
        return function (Action $action) use($keys) {
            $args    = $action->getRoute()->getRequest()->getArgs()->toArray();
            $missing   = [];
            $validated = [];
            foreach ($keys as $k => $v) {
                $key = $v;
                if(is_string($k)) {$key = $k;}
                if(!isset($args[$key])) {
                    $missing[] = $key;
                }
                else {
                    $validated[$key] = $args[$key];
                }
            }

            if(count($missing)) {
                $json = json_encode(["missing_args" => $missing]);
                throw new MiddlewareException(
                    "missingUriArguments", is_string($json) ? $json : ""
                );
            }
            $action->set("validated_args", $validated);
        };
    }

    /**
     * @param string $subject
     * @param int $idx
     * @return Callable
     */
    public static function pathIndexEq(string $subject, int $idx) : Callable {
        return function ($shape) use($subject, $idx) : bool {
            if(is_a($shape, IncomingAbstract::class)) {
                $index = $shape->getPathByIndex($idx);
                return ($index === $subject);
            }
            return false;
        };
    }

    /**
     * @return Callable
     */
    public static function set(string $k, callable $cb) : Callable {
        return function(Action $shape) use ($k, $cb) {
            $shape->set($k, $cb($shape));
        };
    }

    /**
     * @param string $value
     * @return bool
     */
    public static function isJson($value) {
        json_decode($value);
        return (json_last_error() == JSON_ERROR_NONE);
    }

    /**
     * @return Callable
     */
    public static function notAuthorised() : Callable {
        return function(MiddlewareException $ex, Action $action) {
            $action->set("headers", [
                "HTTP/1.0 401 Unauthorised" => ""
            ]);

            $action->set("json", json_encode([
                "error" => "Unauthorised",
                "message" => "Your session has expired. Please log in again.",
            ]));
        };
    }

    /**
     * @return Callable
     */
    public static function badRequest() : Callable {
        return function(MiddlewareException $ex, Action $action) {
            $action->set("headers", [
                "HTTP/1.0 400 Bad Request" => ""
            ]);
        };
    }

    /**
     * @return Callable
     */
    public static function tooManyRequests() : Callable {
        return function(MiddlewareException $ex, Action $action) {
            $action->set("headers", [
                "HTTP/1.0 429 Too Many Requests" => ""
            ]);
        };
    }

    /**
     * @return Callable
     */
    public static function noRoute() : Callable {
        return function(MiddlewareException $ex, Action $action) {
            $action->set("headers", [
                "HTTP/1.0 404 Not Found" => ""
            ]);
        };
    }

    /**
     * @return Callable
     */
    public static function noContent() : Callable {
        return function(Action $action) {
            $action->set("headers", [
                "HTTP/1.0 203 No Content" => ""
            ]);
        };
    }

    /**
     * @param Shape $shape
     * @param array<mixed, mixed> $allowed_types
     * @param string $type_filter_key
     * @return bool
     * @throws MiddlewareException
     */
    public static function isAccountType(Shape $shape, array $allowed_types, string $type_filter_key = 'label') : bool {
        $account = Manager::getService("account");
        if(is_a($account, RestService::class)) {
            $types = $account->fetchTypes("account")->filterByExistInArray($type_filter_key, $allowed_types)->getIds();
            $account = $shape->getShape("user")->getShape("account");
            if(!$account->get("id")){
                $account = $shape->getShape("session")->getShape("user");
            }
            return $account->value("type_id")->isInArray($types);
        }
        throw new MiddlewareException("ServiceError", "Account Service should be of type RestService");
    }

    /**
     * @param Shape $shape
     * @param array $allowed_types
     * @param string $type_filter_key
     * @return bool
     * @throws Exception
     * @throws \Core\Service\Exception\RestException
     */
    public static function isAccountMembershipType(Shape $shape, array $allowed_types, string $type_filter_key = 'uid') : bool {
        $account = Manager::getService("account");
        if(is_a($account, RestService::class)) {
            $types = $account->fetch('account/subscription')->getCollection("data")->filterByExistInArray($type_filter_key, $allowed_types)->getIds();
            $account = $shape->getShape("user")->getShape("account");
            return $account->value("membership.subscription_id")->isInArray($types);
        }

        throw new MiddlewareException("ServiceError", "Account Service should be of type RestService");
    }

    /**
     * @param string $key
     * @param array<int|string,string> $map
     * @param string|null $newKey
     * @return Callable
     */
    public static function map(string $key, array $map, string $newKey = null) : Callable
    {
        return function(Shape $shape) use($key, $map, $newKey) {
            $data = $shape->get($key);
            $dataIsShape = Validator::isShape($data);
            if($dataIsShape) {
                /** php stan isnt smart enough to work out this is only true if data is a Shape, not mixed */
                /** @phpstan-ignore-next-line */
                $data = $data->toArray();
            }
            elseif (!is_array($data)) {
                throw new MiddlewareException("RouteException",
                    "function map failed as data key provided was a " . gettype($data) . " not a shape or array");
            }
            $mapped = [];
            foreach($map as $i => $key) {
                if(is_string($key)) {
                    $mapped[is_string($i) ? $i : $key] = $data[$key] ?? null;
                }
            }

            $shape->set($newKey ?? $key, ($dataIsShape) ? new Shape($mapped) : $mapped);
        };
    }

    /**
     * @return callable
     */
    public static function healthCheck() : callable {
        return function($action) { $action->set("html", "OK"); };
    }

    /**
     * @param string $first_date
     * @param string $last_date
     * @return \DateInterval|bool
     * @throws \Exception
     */
    public static function datesDifference(string $first_date, string $last_date): \DateInterval|bool
    {
        $dtNow = new \DateTime($first_date);
        $dtToCompare = new \DateTime($last_date);
        return $dtNow->diff($dtToCompare);
    }

    /**
     * @param string $first_date
     * @param string $last_date
     * @return string
     * @throws \Exception
     */
    public static function timePast(string $first_date, string $last_date): string
    {
        $diff = self::datesDifference($first_date, $last_date);
        if(is_object($diff)) {
            $date = [
                'years'     => $diff->y,
                'months'    => $diff->m,
                'days'      => $diff->d,
                'hours'     => $diff->h,
            ];

            foreach($date as $key => $val) {
                $time_past = ($val > 1) ? $val . " $key" : $val . " " . rtrim($key, "s");
                if ($val) {
                    break;
                }
            }
        }

        return $time_past ?? "";
    }


    /**
     * @param string $first_date
     * @param string $last_date
     * @return string
     * @throws \Exception
     */
    public static function throwException(string $id, string $message = ""): callable
    {
        return function($a) use ($id, $message) {
            throw new MiddlewareException(
                $id, $message

            );
        };
    }

    /**
     * @param string $statusCode
     * @param string $message
     * @return callable
     */
    public static function exceptionResponse(string $statusCode, string $message = ""): callable
    {
        return function(MiddlewareException $e, $a) use ($statusCode, $message) {
            $statusCode = $e->getCode() ? 'HTTP/1.0 ' . $e->getCode(): $statusCode;

            $a->set("headers", ["$statusCode " . $e->getMessage()  => $message]);
            $a->set("json", json_encode(["data" => [], "message" => $message ?: $e->getMessage()]));
        };
    }

    /**
     * @return Callable
     * @TODO restrict if is a subdomain
     */
    public static function corsResponse() : Callable {
        return function(Action $action, MiddlewareException $ex = null) {
            $action->set("headers", [
                "HTTP/1.0 200 OK" => ""
            ]);
        };
    }
}
