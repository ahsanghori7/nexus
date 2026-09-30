<?php

use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;

use SupplyChain\Model\v2\SupplyChain;

/**
 * @codeCoverageIgnore
 */
class SupplyChainMiddlewareTest extends TestCase
{

    public function setAction(array $array)
    {
        $collection = new Collection($array, Shape::class);
        $action = new Route("default",[]);
        $action->set("collection", $collection);
        return $action;
    }

    public function middleware(Route $route, string $method, ...$params)
    {
        $collection = $route->get("collection");
        if(!is_null($params)){
            SupplyChain::$method($params)($route, $collection);
        }else{
            SupplyChain::$method()($route, $collection);
        }
        return $route->get("collection")->count();
    }

    public function testMapChainEntitiesToCollection()
    {
        //17446, 20000, 20001 are subcontractor account ids
        $entities = [
            'regions' => [
                17446 => [
                    1,
                    2,
                ],
                20000 => [
                    1,
                    2,
                ],
                20001 => [
                    34
                ]
            ],
            'trades' => [
                17446 => [
                    101,
                    102,
                ],
                20000 => [
                    103
                ],
                20001 => [
                    104
                ]
            ]
        ];

        $results = [
            [
                [
                    'label' => 'Test Label A',
                    'chain' => [
                        [
                            'id' => 17446 //subcontractor id
                        ],
                        [
                            'id' => 20000 //subcontractor id
                        ]
                    ]
                ],
                [
                    'label' => 'Test Label B',
                    'chain' => [
                        [
                            'id' => 20001 //subcontractor id
                        ],
                    ]
                ]
            ]
        ];

        SupplyChain::mapChainEntitiesToCollection($entities, $results);
        $this->assertEquals([
            [
                [
                    'label' => 'Test Label A',
                    'chain' => [
                        [
                            'id' => 17446,
                            'region' => [
                                1,
                                2
                            ],
                            'trades' => [
                                101,
                                102
                            ]
                        ],
                        [
                            'id' => 20000,
                            'region' => [
                                1,
                                2
                            ],
                            'trades' => [
                                103,
                            ]
                        ]
                    ]
                ],
                [
                    'label' => 'Test Label B',
                    'chain' => [
                        [
                            'id' => 20001,
                            'region' => [
                                34,
                            ],
                            'trades' => [
                                104,
                            ]
                        ]
                    ]
                ]
            ]
        ], $results);


    }

    public function testMapChainEntitiesSubcontractors()
    {

        $action = $this->setAction([
            [
                'id' => 35,
                'label' => 'Trade A',
                'category_id' => 32
            ],
            [
                'id' => 36,
                'label' => 'Trade B',
                'category_id' => 32
            ],
            [
                'id' => 37,
                'label' => 'Trade C',
                'category_id' => 33
            ],
            [
                'id' => 38,
                'label' => 'Trade D',
                'category_id' => 34
            ],
            [
                'id' => 39,
                'label' => 'Trade E',
                'category_id' => 34
            ],
        ]);


        //test 1
        $results = [];
        $subcontractors = [
            [
                87 => [
                    'name' => 'Test Name A',
                ],
                102 => [
                    'name' => 'Test Name B',
                ]
            ]
        ];
        $label = 'Trade E';
        $category_parent = $action->get("collection")->filterByStringField("label", $label);
        SupplyChain::mapChainEntitiesSubcontractors($results, $category_parent, $subcontractors, $category_parent->getFirst()->get("id"), $label);
        $this->assertEquals([
            $category_parent->getFirst()->get("category_id") => [
                $category_parent->getFirst()->get("id") => [
                    'label' => $label,
                    'chain' => [
                        [
                            87 => [
                                'name' => 'Test Name A'
                            ],
                            102 => [
                                'name' => 'Test Name B'
                            ]
                        ]
                    ]
                ]
            ]
        ], $results);



        //test 2
        $results = [];
        $subcontractors = [
            [
                87 => [
                    'name' => 'Test Name A',
                ],
                102 => [
                    'name' => 'Test Name B',
                ]
            ]
        ];
        $label = 'Trade D';
        $category_parent = $action->get("collection")->filterByStringField("label", $label);
        SupplyChain::mapChainEntitiesSubcontractors($results, $category_parent, $subcontractors, $category_parent->getFirst()->get("id"), $label);
        $this->assertEquals([
            $category_parent->getFirst()->get("category_id") => [
                $category_parent->getFirst()->get("id") => [
                    'label' => $label,
                    'chain' => [
                        [
                            87 => [
                                'name' => 'Test Name A'
                            ],
                            102 => [
                                'name' => 'Test Name B'
                            ]
                        ]
                    ]
                ]
            ]
        ], $results);



        //test 3
        $results = [];
        $subcontractors = [
            [
                87 => [
                    'name' => 'Test Name A',
                ],
                102 => [
                    'name' => 'Test Name B',
                ],
                103 => [
                    'name' => 'Test Name C',
                ]
            ]
        ];
        $label = 'Trade a';
        $category_parent = $action->get("collection")->filterByStringField("label", $label);
        SupplyChain::mapChainEntitiesSubcontractors($results, $category_parent, $subcontractors, $category_parent->getFirst()->get("id"), $label);
        $this->assertEquals([
            $category_parent->getFirst()->get("category_id") => [
                $category_parent->getFirst()->get("id") => [
                    'label' => $label,
                    'chain' => [
                        [
                            87 => [
                                'name' => 'Test Name A'
                            ],
                            102 => [
                                'name' => 'Test Name B'
                            ],
                            103 => [
                                'name' => 'Test Name C'
                            ]
                        ]
                    ]
                ]
            ]
        ], $results);



        //test 4
        $results = [];
        $subcontractors = [
            [

            ]
        ];
        $label = 'Trade A';
        $category_parent = $action->get("collection")->filterByStringField("label", $label);
        SupplyChain::mapChainEntitiesSubcontractors($results, $category_parent, $subcontractors, $category_parent->getFirst()->get("id"), $label);
        $this->assertEquals([
            $category_parent->getFirst()->get("category_id") => [
                $category_parent->getFirst()->get("id") => [
                    'label' => $label,
                    'chain' => [
                        []
                    ]
                ]
            ]
        ], $results);
    }

    public function testMapEntitiesTypeByAccount()
    {

        $action = $this->setAction([
            [
                'id' => 1,
                'label' => 'trades'
            ],
            [
                'id' => 2,
                'label' => 'regions'
            ]
        ]);


        //test 1
        $entities = [];
        $account = [
            'id'       => 166,
            'group_id' => 17446,
            'entity' => [
                'mapping_type' => 2
            ]
        ];
        $entity_id = 4;
        SupplyChain::mapEntitiesTypeByAccount($action->get("collection"), $entity_id, $account, $entities);
        $this->assertEquals([
            $action->get("collection")->filterByStringField("id", $account['entity']['mapping_type'])->getFirst()->get("label") => [
                $account['group_id'] => [
                    $entity_id
                ]
            ]
        ], $entities);



        //test2
        $entities = [];
        $account = [
            'id'       => 166,
            'group_id' => 17446,
            'entity' => [
                'mapping_type' => 1
            ]
        ];
        $entity_id = 36;
        SupplyChain::mapEntitiesTypeByAccount($action->get("collection"), $entity_id, $account, $entities);
        $this->assertEquals([
            $action->get("collection")->filterByStringField("id", $account['entity']['mapping_type'])->getFirst()->get("label") => [
                $account['group_id'] => [
                    $entity_id
                ]
            ]
        ], $entities);



        //test3
        $entities = [];
        $account = [
            'id'       => 166,
            'group_id' => 17446,
            'entity' => [
                'mapping_type' => 1
            ]
        ];
        $entity_id = 36;
        SupplyChain::mapEntitiesTypeByAccount($action->get("collection"), $entity_id, $account, $entities);
        $entity_id = 37;
        SupplyChain::mapEntitiesTypeByAccount($action->get("collection"), $entity_id, $account, $entities);
        $entity_id = 38;
        SupplyChain::mapEntitiesTypeByAccount($action->get("collection"), $entity_id, $account, $entities);
        $this->assertEquals([
            $action->get("collection")->filterByStringField("id", $account['entity']['mapping_type'])->getFirst()->get("label") => [
                $account['group_id'] => [
                    36,
                    37,
                    38
                ]
            ]
        ], $entities);



        //test4
        $entities = [];
        $account = [
            'id'       => 166,
            'group_id' => 17446,
            'entity' => [
                'mapping_type' => 2
            ]
        ];
        $entity_id = 3;
        SupplyChain::mapEntitiesTypeByAccount($action->get("collection"), $entity_id, $account, $entities);
        $entity_id = 4;
        SupplyChain::mapEntitiesTypeByAccount($action->get("collection"), $entity_id, $account, $entities);
        $this->assertEquals([
            $action->get("collection")->filterByStringField("id", $account['entity']['mapping_type'])->getFirst()->get("label") => [
                $account['group_id'] => [
                    3,
                    4,
                ]
            ]
        ], $entities);




        //test5
        $entities = [];
        $account = [
            'id'       => 166,
            'group_id' => 17446,
            'entity' => []
        ];
        $entity_id = 3;
        SupplyChain::mapEntitiesTypeByAccount($action->get("collection"), $entity_id, $account, $entities);
        $this->assertEmpty($entities);




        //test5
        $entities = [];
        $account = [
            'id'       => 166,
            'group_id' => 17446,
            'entity' => [
                'mapping_type' => null
            ]
        ];
        $entity_id = 4;
        SupplyChain::mapEntitiesTypeByAccount($action->get("collection"), $entity_id, $account, $entities);
        $this->assertEmpty($entities);
    }

}
