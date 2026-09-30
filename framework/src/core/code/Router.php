<?php

namespace Core;

use Core\Layer\ResponseAbstract;
use Core\Router\Route;
use Core\Layer\IncomingInterface;
use Core\System\Control;
use Core\Middleware\Exception as MiddlewareException;

class Router
{
    /**
     * @var array<string, array<Route>>
     */
    protected static array $routes = [];

    /**
     * @return Route
     */
    public static function getDefaultRoute(): Route
    {
        return new Route(
            "default",
            self::$routes["_default"] ?? []
        );
    }

    /**
     * @return Router\Route[][]
     */
    public static function getRoutes(): array
    {
        return self::$routes;
    }

    /**
     * @param IncomingInterface $request
     * @return Route
     * @throws \Exception
     */
    public static function matchRoute(IncomingInterface $request): Route
    {
        $matches = [];
        foreach (self::$routes as $group) {
            foreach ($group as $route) {
                if ($request->isType($route->string("type", ""))) {
                    if ($route->match($request)) {
                        $matches[] = $route;
                    }
                }
            }
        }

        if (count($matches) > 1) {
            throw new \Exception("Route Conflict");
        }

        $route = $matches[0] ?? self::getDefaultRoute();
        $route->set("request", $request);
        return $route;
    }

    /**
     * @param IncomingInterface $request
     * @return ResponseAbstract
     * @throws \Exception
     */
    public static function exec(IncomingInterface $request): ResponseAbstract
    {

        Control::callHandler("PreRoute", $request);
        $action = self::matchRoute($request)->matchAction();
        try {
            $action->exec();
        } catch (MiddlewareException $me) {
            $type = $me->getId();

            $handler = $action->getExceptionHandler($type);
            if ($handler) {
                $handler($me, $action);
            } else {

                throw new \Exception(
                    $me->getMessage() .
                    " in " . $me->getFile() . " on line " . $me->getLine()
                );
            }
        } catch (\Throwable | \Exception $t) {
            $action->set("routeException", $t);
            Control::callHandler("RouteException", $action);
            Control::callHandler(ucwords($request->getType()) . "RouteException", $action);
        }
        Control::callHandler("PostActionMiddleware", $action);
        return $request->respond($action);
    }

    /**
     * @param array<string, mixed> $routes
     * @return void
     */
    public static function setRoutes(array $routes)
    {
        foreach ($routes as $key => $data) {
            if (is_array($data)) {
                self::$routes[$key][] = new Route($key, $data);
            }
        }
    }
}
