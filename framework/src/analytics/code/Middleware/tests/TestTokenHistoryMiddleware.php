<?php

use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Analytics\Middleware\TokenHistoryMiddleware;

class TestTokenHistoryMiddleware extends TestCase
{

  public function setAction(array $array)
  {
    $collection = new Collection($array, Shape::class);
    $action = new Route("default",[]);
    $action->set("collection", $collection);
    return $action;
  }

  public function middleware(Route $route, string $method, $params = null)
  {
    $collection = $route->get("collection");
    if(!is_null($params)){
      TokenHistoryMiddleware::$method($params)($route, $collection);
    }else{
      TokenHistoryMiddleware::$method()($route, $collection);
    }
    return $route->get("collection")->count();
  }

  public function testGenerateDatesInterval()
  {

    $action = $this->setAction([]);

    $this->middleware($action, 'generateDatesInterval', implode(",", ['2022-11-11', '2022-12-12', 'day']));
    $interval = $action->get("interval");

    print_r($interval);die;

    $this->assertEquals($prices, [
      'price' => 0,
      'work' => 100,
      'prelims' => 100,
    ]);



  }

}
