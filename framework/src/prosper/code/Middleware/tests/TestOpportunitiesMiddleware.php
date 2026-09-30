<?php

use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Prosper\Middleware\Relay\OpportunitiesMiddleware;

class TestOpportunitiesMiddleware extends TestCase
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
            OpportunitiesMiddleware::$method($params)($route, $collection);
        }else{
            OpportunitiesMiddleware::$method()($route, $collection);
        }
        return $route->get("collection")->count();
    }

    public function testCanReduceByAccountTrades()
    {

        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["packages" => [35,36,37]], ["packages" => [38]]]],
            ["name" => "Super Project 2", "tender" => [["packages" => [35,36,37]], ["packages" => [38]]]],
            ["name" => "Super Project 3", "tender" => [["packages" => [35,36,37]], ["packages" => [38]]]],
        ]);
        $action->set("subcontractor", ['trades' => [37]]);
        $this->assertEquals(3, $this->middleware($action, 'reduceByAccountTrades'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["awarded"  => 1, "packages" => [35,36,37]], ["packages" => [38]]]],
            ["name" => "Super Project 2", "tender" => [["packages" => [35,36,37]], ["packages" => [38]]]],
            ["name" => "Super Project 3", "tender" => [["packages" => [35,36,37]], ["packages" => [38]]]],
        ]);
        $action->set("subcontractor", ['trades' => [38]]);
        $this->assertEquals(3, $this->middleware($action, 'reduceByAccountTrades'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["awarded"  => 1, "packages" => [35,36,37]], ["awarded"  => 1, "packages" => [38]]]],
            ["name" => "Super Project 2", "tender" => [["packages" => [35,36,37]], ["awarded"  => 0, "packages" => [38]]]],
            ["name" => "Super Project 3", "tender" => [["packages" => [35,36,37]], ["awarded"  => 1, "packages" => [38]]]],
        ]);
        $action->set("subcontractor", ['trades' => [38]]);
        $this->assertEquals(1, $this->middleware($action, 'reduceByAccountTrades'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["awarded"  => 1, "packages" => [35,36,37]], ["awarded"  => 1, "packages" => [38]]]],
            ["name" => "Super Project 2", "tender" => [["awarded"  => 1, "packages" => [35,36,37]], ["awarded"  => 1, "packages" => [38]]]],
            ["name" => "Super Project 3", "tender" => [["awarded"  => 1, "packages" => [35,36,37]], ["awarded"  => 1, "packages" => [38]]]],
        ]);
        $action->set("subcontractor", ['trades' => [35,36,37,38]]);
        $this->assertEquals(0, $this->middleware($action, 'reduceByAccountTrades'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["packages" => [35,36,37]], ["awarded"  => 1, "packages" => [38]]]],
            ["name" => "Super Project 2", "tender" => [["packages" => [35,36,37]], ["awarded"  => 1, "packages" => [38]]]],
            ["name" => "Super Project 3", "tender" => [["packages" => [35,36,37]], ["awarded"  => 1, "packages" => [38]]]],
        ]);
        $action->set("subcontractor", ['trades' => [38]]);
        $this->assertEquals(0, $this->middleware($action, 'reduceByAccountTrades'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["packages" => [35,36,37]], ["packages" => [38]]]],
            ["name" => "Super Project 2", "tender" => [["packages" => [44]], ["packages" => [44,45]]]],
            ["name" => "Super Project 3", "tender" => [["packages" => []], ["packages" => [45]]]],
        ]);
        $action->set("subcontractor", ['trades' => [44]]);
        $this->assertEquals(1, $this->middleware($action, 'reduceByAccountTrades'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["packages" => [35,36,37]], ["packages" => [38]]]],
            ["name" => "Super Project 2", "tender" => [["packages" => [44]], ["packages" => [44,45]]]],
            ["name" => "Super Project 3", "tender" => [["packages" => []], ["packages" => [45]]]],
        ]);
        $action->set("subcontractor", ['trades' => [45]]);
        $this->assertEquals(2, $this->middleware($action, 'reduceByAccountTrades'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["packages" => [35,36,37]], ["packages" => [38]]]],
            ["name" => "Super Project 2", "tender" => [["packages" => [44]], ["packages" => [44,45]]]],
            ["name" => "Super Project 3", "tender" => [["packages" => []], ["packages" => [45]], ["packages" => [34]]]],
        ]);
        $action->set("subcontractor", ['trades' => [34,35]]);
        $this->assertEquals(2, $this->middleware($action, 'reduceByAccountTrades'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["packages" => [35,36,37]], ["packages" => [38]]]],
            ["name" => "Super Project 2", "tender" => [["packages" => [44]], ["packages" => [44,45]]]],
            ["name" => "Super Project 3", "tender" => [["packages" => []], ["packages" => [45]]]],
        ]);
        $action->set("subcontractor", ['trades' => []]);
        $this->assertEquals(0, $this->middleware($action, 'reduceByAccountTrades'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "tender" => [["packages" => []], ["packages" => []]]],
            ["name" => "Super Project 2", "tender" => [["packages" => []], ["packages" => []]]],
            ["name" => "Super Project 3", "tender" => [["packages" => []], ["packages" => []]]],
        ]);
        $action->set("subcontractor", ['trades' => []]);
        $this->assertEquals(0, $this->middleware($action, 'reduceByAccountTrades'));
    }

    public function testCanReduceByAccountRegion()
    {

        $action = $this->setAction([
            ["name" => "Super Project 1", "region" => 2],
            ["name" => "Super Project 2", "region" => 2],
            ["name" => "Super Project 3", "region" => 3],
            ["name" => "Super Project 4", "region" => 4],
        ]);
        $action->set("subcontractor", ['regions' => [2]]);
        $this->assertEquals(2, $this->middleware($action, 'reduceByAccountRegion'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "region" => 2],
            ["name" => "Super Project 2", "region" => 2],
            ["name" => "Super Project 3", "region" => 2],
            ["name" => "Super Project 4", "region" => 2],
            ["name" => "Super Project 5", "region" => 2],
            ["name" => "Super Project 6", "region" => 2],
        ]);
        $action->set("subcontractor", ['regions' => [2]]);
        $this->assertEquals(6, $this->middleware($action, 'reduceByAccountRegion'));


        $action = $this->setAction([
            ["name" => "Super Project 1",   "region" => 2],
            ["name" => "Super Project 2", "region" => 2],
            ["name" => "Super Project 3", "region" => 3],
            ["name" => "Super Project 4", "region" => 4],
        ]);
        $action->set("subcontractor", ['regions' => [3]]);
        $this->assertEquals(1, $this->middleware($action, 'reduceByAccountRegion'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "region" => 2],
            ["name" => "Super Project 2", "region" => 2],
            ["name" => "Super Project 3", "region" => 3],
            ["name" => "Super Project 4", "region" => 4],
        ]);
        $action->set("subcontractor", ['regions' => [2,3]]);
        $this->assertEquals(3, $this->middleware($action, 'reduceByAccountRegion'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "region" => 2],
            ["name" => "Super Project 2", "region" => 2],
            ["name" => "Super Project 3", "region" => 3],
            ["name" => "Super Project 4", "region" => 4],
            ["name" => "Super Project 5", "region" => 4],
            ["name" => "Super Project 6", "region" => 4],
            ["name" => "Super Project 7", "region" => 4],
        ]);
        $action->set("subcontractor", ['regions' => [2,3,4]]);
        $this->assertEquals(7, $this->middleware($action, 'reduceByAccountRegion'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "region" => 12],
            ["name" => "Super Project 2", "region" => 13],
        ]);
        $action->set("subcontractor", ['regions' => [2,3,4]]);
        $this->assertEquals(0, $this->middleware($action, 'reduceByAccountRegion'));


        $action = $this->setAction([
            ["name" => "Super Project 1", "region" => 1],
            ["name" => "Super Project 2", "region" => 2],
        ]);
        $action->set("subcontractor", ['regions' => []]);
        $this->assertEquals(0, $this->middleware($action, 'reduceByAccountRegion'));
    }

    public function testCanReduceByTenderHistory()
    {
        $action = $this->setAction([
            ["name" => "Super Project 1",   "tender" => [["Interest" => [63 => [], 2345 => [], 3157 => []]]]],
            ["name" => "Super Project 2", "tender" => [["Interest" => [166 => [], 3312 => []]]]],
        ]);
        $action->set("subcontractor", ['aid' => 63]);
        $this->assertEquals(1, $this->middleware($action, 'reduceByTenderHistory'));


        $action = $this->setAction([
            ["name" => "Super Project 1",   "tender" => [["Interest" => [63 => [], 2345 => [], 3157 => []]]]],
            ["name" => "Super Project 2", "tender" => [["Interest" => [166 => [], 3312 => []]]]],
        ]);
        $action->set("subcontractor", ['aid' => 63]);
        $this->assertEquals(1, $this->middleware($action, 'reduceByTenderHistory'));


        $action = $this->setAction([
            ["name" => "Super Project 1",   "tender" => [["Interest" => [63 => [], 2345 => [], 3157 => []]]]],
            ["name" => "Super Project 2", "tender" => [["Interest" => [166 => [], 3312 => []]]]],
            ["name" => "Super Project 3", "tender" => [["Interest" => [55 => [], 77 => []]]]],
        ]);
        $action->set("subcontractor", ['aid' => 1]);
        $this->assertEquals(3, $this->middleware($action, 'reduceByTenderHistory'));


        $action = $this->setAction([
            ["name" => "Super Project 1",   "tender" => [["Interest" => [63 => [], 2345 => [], 3157 => []]]]],
            ["name" => "Super Project 2", "tender" => [["Interest" => [166 => [], 3157 => []]]]],
            ["name" => "Super Project 3", "tender" => [["Interest" => [55 => [], 3157 => []]]]],
        ]);
        $action->set("subcontractor", ['aid' => 3157]);
        $this->assertEquals(0, $this->middleware($action, 'reduceByTenderHistory'));
    }

    public function testCanRestrictByIndex()
    {

       $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => true]]);
        $this->middleware($action, 'restrictByIndex', 0);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(4, $how_many_should_be_restricted);


        $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => true]]);
        $this->middleware($action, 'restrictByIndex', 1);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(3, $how_many_should_be_restricted);


        $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => true]]);
        $this->middleware($action, 'restrictByIndex', 2);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(2, $how_many_should_be_restricted);


        $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => true]]);
        $this->middleware($action, 'restrictByIndex', 3);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(1, $how_many_should_be_restricted);


        $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => true]]);
        $this->middleware($action, 'restrictByIndex', 4);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(0, $how_many_should_be_restricted);


        $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
            new Shape(["name" => "Super Project 5"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => true]]);
        $this->middleware($action, 'restrictByIndex', 4);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(1, $how_many_should_be_restricted);


        $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => true]]);
        $this->middleware($action, 'restrictByIndex', 100);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(0, $how_many_should_be_restricted);



        $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => false]]);
        $this->middleware($action, 'restrictByIndex', 3);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(0, $how_many_should_be_restricted);


        $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
            new Shape(["name" => "Super Project 5"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => false]]);
        $this->middleware($action, 'restrictByIndex', 0);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(0, $how_many_should_be_restricted);


        $action = $this->setAction([
            new Shape(["name" => "Super Project 1"]),
            new Shape(["name" => "Super Project 2"]),
            new Shape(["name" => "Super Project 3"]),
            new Shape(["name" => "Super Project 4"]),
            new Shape(["name" => "Super Project 5"]),
            new Shape(["name" => "Super Project 6"]),
        ]);
        $action->set("subcontractor", ['membership' => ["trial" => false]]);
        $this->middleware($action, 'restrictByIndex', 100);
        $restricted = $action->getCollection('collection')->values('restricted');
        $how_many_should_be_restricted = array_sum($restricted);
        $this->assertEquals(0, $how_many_should_be_restricted);
    }

    public function testGetLoadOpportunitiesTotal()
    {

        $action = $this->setAction([
            new Shape([
                "name" => "Super Project 1",
                'region' => 4,
                'tenders' => [
                    [
                        'name'       => 'Tender',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ]
                ]
            ]),
        ]);

        $action->set("subcontractor", [
            'regions' => [4],
            'trades'  => [456]
        ]);
        $this->middleware($action, 'loadOpportunitiesTotal', 'opportunities');
        $this->assertEquals(1, $action->get("opportunities", 0));



        $action = $this->setAction([
            new Shape([
                "name" => "Super Project 1",
                'region' => 4,
                'tenders' => [
                    [
                        'name'       => 'Tender',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ]
                ]
            ]),
        ]);

        $action->set("subcontractor", [
            'regions' => [5],
            'trades'  => [456]
        ]);
        $this->middleware($action, 'loadOpportunitiesTotal', 'opportunities');
        $this->assertEquals(0, $action->get("opportunities", 0));



        $action = $this->setAction([
            new Shape([
                "name" => "Super Project 1",
                'region' => 4,
                'tenders' => [
                    [
                        'name'       => 'Tender',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ]
                ]
            ]),
        ]);

        $action->set("subcontractor", [
            'regions' => [5],
            'trades'  => [3]
        ]);
        $this->middleware($action, 'loadOpportunitiesTotal', 'opportunities');
        $this->assertEquals(0, $action->get("opportunities", 0));



        $action = $this->setAction([
            new Shape([
                "name" => "Super Project 1",
                'region' => 4,
                'tenders' => [
                    [
                        'name'       => 'Tender',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ]
                ]
            ]),
        ]);

        $action->set("subcontractor", [
            'regions' => [],
            'trades'  => []
        ]);
        $this->middleware($action, 'loadOpportunitiesTotal', 'opportunities');
        $this->assertEquals(0, $action->get("opportunities", 0));



        $action = $this->setAction([
            new Shape([
                "name" => "Super Project 1",
                'region' => 7,
                'tenders' => [
                    [
                        'name'       => 'Tender',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ],
                    [
                        'name'       => 'Tender 1',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [44,77]
                    ]
                ]
            ]),
            new Shape([
                "name" => "Super Project 2",
                'region' => 7,
                'tenders' => [
                    [
                        'name'       => 'Tender 2',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ]
                ]
            ]),
        ]);

        $action->set("subcontractor", [
            'regions' => [7],
            'trades'  => [35]
        ]);
        $this->middleware($action, 'loadOpportunitiesTotal', 'opportunities');
        $this->assertEquals(2, $action->get("opportunities", 0));



        $action = $this->setAction([
            new Shape([
                "name" => "Super Project 1",
                'region' => 7,
                'tenders' => [
                    [
                        'name'       => 'Tender',
                        'awarded'    => 1,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ],
                    [
                        'name'       => 'Tender 1',
                        'awarded'    => 1,
                        'registered' => 0,
                        'packages'   => [44,77]
                    ]
                ]
            ]),
            new Shape([
                "name" => "Super Project 2",
                'region' => 7,
                'tenders' => [
                    [
                        'name'       => 'Tender 2',
                        'awarded'    => 1,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ]
                ]
            ]),
        ]);

        $action->set("subcontractor", [
            'regions' => [7],
            'trades'  => [35]
        ]);
        $this->middleware($action, 'loadOpportunitiesTotal', 'opportunities');
        $this->assertEquals(0, $action->get("opportunities", 0));



        $action = $this->setAction([
            new Shape([
                "name" => "Super Project 1",
                'region' => 7,
                'tenders' => [
                    [
                        'name'       => 'Tender',
                        'awarded'    => 0,
                        'registered' => 1,
                        'packages'   => [456,35]
                    ],
                    [
                        'name'       => 'Tender 1',
                        'awarded'    => 0,
                        'registered' => 1,
                        'packages'   => [44,77]
                    ]
                ]
            ]),
            new Shape([
                "name" => "Super Project 2",
                'region' => 7,
                'tenders' => [
                    [
                        'name'       => 'Tender 2',
                        'awarded'    => 0,
                        'registered' => 1,
                        'packages'   => [456,35]
                    ]
                ]
            ]),
        ]);

        $action->set("subcontractor", [
            'regions' => [7],
            'trades'  => [35]
        ]);
        $this->middleware($action, 'loadOpportunitiesTotal', 'opportunities');
        $this->assertEquals(0, $action->get("opportunities", 0));




        $action = $this->setAction([
            new Shape([
                "name" => "Super Project 1",
                'region' => 7,
                'tenders' => [
                    [
                        'name'       => 'Tender',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ],
                    [
                        'name'       => 'Tender 1',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [44,77]
                    ]
                ]
            ]),
            new Shape([
                "name" => "Super Project 2",
                'region' => 7,
                'tenders' => [
                    [
                        'name'       => 'Tender 2',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ]
                ]
            ]),
        ]);

        $action->set("subcontractor", [
            'regions' => [7],
            'trades'  => [35, 77]
        ]);
        $this->middleware($action, 'loadOpportunitiesTotal', 'opportunities');
        $this->assertEquals(3, $action->get("opportunities", 0));



        $action = $this->setAction([
            new Shape([
                "name" => "Super Project 1",
                'region' => 7,
                'tenders' => []
            ]),
            new Shape([
                "name" => "Super Project 2",
                'region' => 7,
                'tenders' => [
                    [
                        'name'       => 'Tender 2',
                        'awarded'    => 0,
                        'registered' => 0,
                        'packages'   => [456,35]
                    ]
                ]
            ]),
        ]);

        $action->set("subcontractor", [
            'regions' => [7],
            'trades'  => [35, 77]
        ]);
        $this->middleware($action, 'loadOpportunitiesTotal', 'opportunities');
        $this->assertEquals(1, $action->get("opportunities", 0));

    }

}
