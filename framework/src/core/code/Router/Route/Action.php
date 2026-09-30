<?php

namespace Core\Router\Route;

use Core\Data\Shape;
use Core\Router\Route;

class Action extends Shape
{
    /**
     * @var Route
     */
    protected Route $route;

    /**
     * @param Route $route
     * @return Action
     */
    public function setRoute(Route $route) : Action
    {
        $this->route = $route;
        return $this;
    }

    /**
     * @return Route
     */
    public function getRoute() : Route {
        return $this->route;
    }

    public function exec() : Action {
        foreach($this->getMiddleware() as $middleware) {
            if(is_callable($middleware)) {
                $middleware($this);
            }
        }

        $handler = $this->get("handler");
        if(is_callable($handler)) {
            $handler($this);
        }
        return $this;
    }

    /**
     * @return array<Callable>
     */
    public function getMiddleware() : array {
        $routeMiddleware  = $this->getRoute()->get("middleware", []);
        $actionMiddleware = $this->get("middleware", []);
        return array_merge(
            is_array($routeMiddleware) ? $routeMiddleware : [],
            is_array($actionMiddleware) ? $actionMiddleware : [],
        );
    }

    /**
     * @return array<Callable>
     */
    public function getExceptionHandlers() : array {
        $routeException  = $this->getRoute()->get("onError");
        $actionException = $this->get("onError");
        return array_merge(
            is_array($routeException) ? $routeException : [],
            is_array($actionException) ? $actionException : [],
        );
    }

    /**
     * @param string $type
     * @param mixed $catchAll
     * @return Callable|null
     */
    public function getExceptionHandler(string $type, mixed $catchAll = "*") : Callable|null {
        $handlers = $this->getExceptionHandlers();
        if(isset($handlers[$type])) {
            return $handlers[$type];
        }

        if(is_string($catchAll)) {
            return $handlers[$catchAll] ?? null;
        }

        return null;
    }
}
