<?php

use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Prosper\Middleware\Relay\TokenHistoryMiddleWare;

class TestTokenHistoryMiddleware extends TestCase
{

  public function middleware(Route $route, string $method, $params = null)
  {
    $collection = $route->get("collection");
    if(!is_null($params)){
      return TokenHistoryMiddleWare::$method($params)($route, $collection);
    }else{
      return TokenHistoryMiddleWare::$method()($route, $collection);
    }
  }

  public function testGetTokenHistoryType()
  {
    $collection = new Collection([], Shape::class);
    $action = new Route("default",[]);
    $action->set("collection", $collection);

    $action->setItems([
      "token_free_issued" => 2,
      "token_free_used"   => 1,
    ]);
    $this->assertEquals("free", $this->middleware($action, 'getTokenHistoryType'));


    $action->setItems([
      "token_free_issued" => 1,
      "token_free_used"   => 0,
    ]);
    $this->assertEquals("free", $this->middleware($action, 'getTokenHistoryType'));


    $action->setItems([
      "token_free_issued" => 6,
      "token_free_used"   => 6,
    ]);
    $this->assertEquals("paid", $this->middleware($action, 'getTokenHistoryType'));


    $action->setItems([
      "token_free_issued" => 0,
      "token_free_used"   => 0,
    ]);
    $this->assertEquals("paid", $this->middleware($action, 'getTokenHistoryType'));


    $action->setItems([
      "token_free_issued" => 6,
      "token_free_used"   => 12,
    ]);
    $this->assertEquals("paid", $this->middleware($action, 'getTokenHistoryType'));
  }

}
