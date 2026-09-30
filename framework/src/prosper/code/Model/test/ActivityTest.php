<?php


use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Prosper\Middleware\AccountMiddleware;
use Core\Data\Collection as CollectionClass;


class ActivityTest extends TestCase
{
    public function setAction(array $array)
    {
        $collection = new Collection($array, Shape::class);
        $action = new Route("default", []);
        $action->set("collection", $collection);
        return $action;
    }

    public function middleware(Route $route, string $method, $params = null)
    {
        $collection = $route->get("collection");
        if ( !is_null($params) ) {
            AccountMiddleware::$method($params)($route, $collection);
        } else {
            AccountMiddleware::$method()($route, $collection);
        }
        return $route->get("collection")->count();
    }

    public function testGetData()
    {

        print_r(\Prosper\Model\Activity::getData(17446));
        die;

    }


}
