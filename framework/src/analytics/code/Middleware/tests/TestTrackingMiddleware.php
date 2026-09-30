<?php

namespace Analytics\Middleware\tests;

use Analytics\Middleware\TrackingMiddleware;
use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;

class TestTrackingMiddleware extends TestCase
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
            TrackingMiddleware::$method($params)($route, $collection);
        } else {
            TrackingMiddleware::$method()($route, $collection);
        }
        return $route->get("collection")->count();
    }

    public function testSum()
    {

        $action = $this->setAction([
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.test'
                    ]
                ]
            ]
        ]);
        $this->middleware($action, 'sum', 'supply_chain');
        $sum = $action->get("sum");
        $this->assertEquals(['invite' => 2], $sum);



        $action = $this->setAction([
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.activate'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.test'
                    ]
                ]
            ]
        ]);
        $this->middleware($action, 'sum', 'supply_chain');
        $sum = $action->get("sum");
        $this->assertEquals(['invite' => 2, 'activate' => 1], $sum);




        $action = $this->setAction([
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.activate'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.test'
                    ]
                ]
            ]
        ]);
        $this->middleware($action, 'sum', 'test');
        $sum = $action->get("sum");
        $this->assertEquals([], $sum);



        $action = $this->setAction([
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.activate'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.test'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.abc'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.def'
                    ]
                ]
            ]
        ]);
        $this->middleware($action, 'sum', 'history');
        $sum = $action->get("sum");
        $this->assertEquals(['test' => 1, 'abc' => 1, 'def' => 1], $sum);



        $action = $this->setAction([
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.activate'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.test'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.abc'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.def'
                    ]
                ]
            ]
        ]);

        $action->set("uriArgs", ['action' => 'invite']);
        $this->middleware($action, 'sum', 'supply_chain');
        $sum = $action->get("sum");
        $this->assertEquals(['invite' => 2], $sum);



        $action = $this->setAction([
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.activate'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.test'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.abc'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.def'
                    ]
                ]
            ]
        ]);

        $action->set("uriArgs", ['action' => 'def']);
        $this->middleware($action, 'sum', 'history');
        $sum = $action->get("sum");
        $this->assertEquals(['def' => 1], $sum);



        $action = $this->setAction([
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.activate'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.test'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.abc'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.def'
                    ]
                ]
            ]
        ]);

        $action->set("uriArgs", ['action' => 'def']);
        $this->middleware($action, 'sum', 'supply_chain');
        $sum = $action->get("sum");
        $this->assertEquals([], $sum);



        $action = $this->setAction([
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.invite'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'supply_chain.activate'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.test'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.abc'
                    ]
                ]
            ],
            [
                'action' => [
                    'type' => [
                        'label' => 'history.def'
                    ]
                ]
            ]
        ]);

        $action->set("uriArgs", ['action' => 'def']);
        $this->middleware($action, 'sum', 'testnotype');
        $sum = $action->get("sum");
        $this->assertEquals([], $sum);



        $action = $this->setAction([]);
        $action->set("uriArgs", ['action' => 'def']);
        $this->middleware($action, 'sum', 'supply_chain');
        $sum = $action->get("sum");
        $this->assertEquals([], $sum);
    }
}
