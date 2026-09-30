<?php

use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Prosper\Middleware\Relay\EnquiriesMiddleware;

class TestEnquiriesMiddleware extends TestCase
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
            EnquiriesMiddleware::$method($params)($route, $collection);
        }else{
            EnquiriesMiddleware::$method()($route, $collection);
        }
        return $route->get("collection")->count();
    }

    public function testConvertToPenny()
    {

        $action = $this->setAction([]);
        $action->set("quote", new Shape(["form" => new Shape(
            [
                'price' => 0,
                'work' => -1,
                'prelims' => +1,
            ]
        )]));
        $this->middleware($action, 'convertPriceToPenny');
        $prices = $action->get("prices");
        $this->assertEquals($prices, [
            'price' => 0,
            'work' => 100,
            'prelims' => 100,
        ]);



        $action = $this->setAction([]);
        $action->set("quote", new Shape(["form" => new Shape(
            [
                'price' => 1,
                'work' => 23,
                'prelims' => 456,
                'programme' => 7890,
                'other' => 12345
            ]
        )]));
        $this->middleware($action, 'convertPriceToPenny');
        $prices = $action->get("prices");
        $this->assertEquals($prices, [
            'price' => 100,
            'work' => 2300,
            'prelims' => 45600,
            'programme' => 789000,
            'other' => 1234500
        ]);



        $action = $this->setAction([]);
        $action->set("quote", new Shape(["form" => new Shape(
            [
                'price' => 123,
                'work' => 1234,
                'prelims' => 12345,
                'programme' => 123456,
                'other' => 1234567
            ]
        )]));
        $this->middleware($action, 'convertPriceToPenny');
        $prices = $action->get("prices");
        $this->assertEquals($prices, [
            'price' => 12300,
            'work' => 123400,
            'prelims' => 1234500,
            'programme' => 12345600,
            'other' => 123456700
        ]);



        $action = $this->setAction([]);
        $action->set("quote", new Shape(["form" => new Shape(
            [
                'price' => '£123',
                'work' => '£1234',
                'prelims' => '£12345',
                'programme' => '£123456',
                'other' => '£1234567'
            ]
        )]));
        $this->middleware($action, 'convertPriceToPenny');
        $prices = $action->get("prices");
        $this->assertEquals($prices, [
            'price' => 12300,
            'work' => 123400,
            'prelims' => 1234500,
            'programme' => 12345600,
            'other' => 123456700
        ]);



        $action = $this->setAction([]);
        $action->set("quote", new Shape(["form" => new Shape(
            [
                'price' => '£123.45',
                'work' => '£1234.77',
                'prelims' => '£12345.90',
                'programme' => '£123456.00',
                'other' => '£1234567.50'
            ]
        )]));
        $this->middleware($action, 'convertPriceToPenny');
        $prices = $action->get("prices");
        $this->assertEquals($prices, [
            'price' => 12345,
            'work' => 123477,
            'prelims' => 1234590,
            'programme' => 12345600,
            'other' => 123456750
        ]);



        $action = $this->setAction([]);
        $action->set("quote", new Shape(["form" => new Shape(
            [
                'price' => '123.45',
                'work' => '1234.77',
                'prelims' => '12345.90',
                'programme' => '123456.00',
                'other' => '1234567.50'
            ]
        )]));
        $this->middleware($action, 'convertPriceToPenny');
        $prices = $action->get("prices");
        $this->assertEquals($prices, [
            'price' => 12345,
            'work' => 123477,
            'prelims' => 1234590,
            'programme' => 12345600,
            'other' => 123456750
        ]);

    }

}
