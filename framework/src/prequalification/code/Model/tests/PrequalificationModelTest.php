<?php

use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Prequalification\Middleware\PrequalificationMiddleware;
use Prequalification\Model\PrequalificationModel;

class PrequalificationModelTest extends TestCase
{
    public function setAction (array $array)
    {
        $collection = new Collection($array, Shape::class);
        $action = new Route("default", []);
        $action->set("collection", $collection);
        return $action;
    }

    public function middleware (Route $route, string $method, $params = null)
    {
        $collection = $route->get("collection");
        if ( !is_null($params) ) {
            PrequalificationModel::$method($params)($route, $collection);
        } else {
            PrequalificationModel::$method()($route, $collection);
        }
        return $route->get("collection")->count();
    }

    public function testGetCanRequestCertificate()
    {
        //TEST
        $data = [
            [
                'request_fullfilled_at' => null
            ]
        ];
        self::assertTrue(PrequalificationModel::canRequestCertificate($data));


        //TEST
        $data = [
            [
                'request_fullfilled_at' => null
            ],
            [
                'request_fullfilled_at' => null
            ],
            [
                'request_fullfilled_at' => date("Y-m-d H:i:s")
            ]
        ];
        self::assertTrue(PrequalificationModel::canRequestCertificate($data));


        //TEST
        $data = [
            [
                'request_fullfilled_at' => date("Y-m-d H:i:s")
            ]
        ];
        self::assertFalse(PrequalificationModel::canRequestCertificate($data));
    }
}
