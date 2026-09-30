<?php


use Core\Router\Route;
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
use Core\Data\Collection;
use Prosper\Middleware\AccountMiddleware;
use Core\Data\Collection as CollectionClass;


class TestAccountMiddleware extends TestCase
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
            AccountMiddleware::$method($params)($route, $collection);
        }else{
            AccountMiddleware::$method()($route, $collection);
        }
        return $route->get("collection")->count();
    }

    public function setData($action, $test)
    {
        $action->setItems([
            'subcontractor' => new Shape([
                'aid' => $test['aid'],
                'membership' => new Shape([
                    'trial' => $test['membership'] === 'trial',
                    'flexi' => $test['membership'] === 'flexi',
                    'commission' => $test['membership'] === 'commission',
                    'regional' => $test['membership'] === 'regional',
                    'national' => $test['membership'] === 'national',
                ])
            ]),
            'free_tokens_amount' => $test['free_tokens_amount'],
            'token_used' => new Shape($test['token_used']),
            'session' => new Shape([
                'account' => new Shape([
                    'id' => $test['aid'],
                    'membership' => new Shape([
                        'meta' => '{"tokens": '.$test['tokens'].'}',
                    ])
                ])
            ])
        ]);
    }

    public function testCanClaimFreeToken()
    {

        $action = $this->setAction([]);

        //give free token, no tokens left, 0 tokens used, trial
        $this->setData($action, [
            'free_tokens_amount' => 1,
            'aid'    => 1,
            'tokens' => 0,
            'membership' => 'trial',
            'token_used' => [
                'free' => 0,
                'paid' => 0
            ]
        ]);
        AccountMiddleware::canClaimFreeToken()($action);
        $this->assertTrue($action->get("can_claim", false));


        //give free token, no tokens left, 0 tokens used, flexi
        $this->setData($action, [
            'free_tokens_amount' => 1,
            'aid'    => 1,
            'tokens' => 0,
            'membership' => 'flexi',
            'token_used' => [
                'free' => 0,
                'paid' => 0
            ]
        ]);
        AccountMiddleware::canClaimFreeToken()($action);
        $this->assertTrue($action->get("can_claim", false));



        //give free token, no tokens left, 0 tokens used, commission
        $this->setData($action, [
            'free_tokens_amount' => 1,
            'aid'    => 1,
            'tokens' => 0,
            'membership' => 'commission',
            'token_used' => [
                'free' => 0,
                'paid' => 0
            ]
        ]);
        AccountMiddleware::canClaimFreeToken()($action);
        $this->assertFalse($action->get("can_claim", false));



        //give free token, no tokens left, 0 tokens used, regional
        $this->setData($action, [
            'free_tokens_amount' => 1,
            'aid'    => 1,
            'tokens' => 0,
            'membership' => 'regional',
            'token_used' => [
                'free' => 0,
                'paid' => 0
            ]
        ]);
        AccountMiddleware::canClaimFreeToken()($action);
        $this->assertFalse($action->get("can_claim", false));



        //give free token, no tokens left, 0 tokens used, national
        $this->setData($action, [
            'free_tokens_amount' => 1,
            'aid'    => 1,
            'tokens' => 0,
            'membership' => 'national',
            'token_used' => [
                'free' => 0,
                'paid' => 0
            ]
        ]);
        AccountMiddleware::canClaimFreeToken()($action);
        $this->assertFalse($action->get("can_claim", false));



        //give free token, no tokens left, free token used, trial
        $this->setData($action, [
            'free_tokens_amount' => 1,
            'aid'    => 1,
            'tokens' => 0,
            'membership' => 'trial',
            'token_used' => [
                'free' => 1,
                'paid' => 0
            ]
        ]);
        AccountMiddleware::canClaimFreeToken()($action);
        $this->assertFalse($action->get("can_claim", false));


        //give free token, no tokens left, paid token used, trial
        $this->setData($action, [
            'free_tokens_amount' => 1,
            'aid'    => 1,
            'tokens' => 0,
            'membership' => 'trial',
            'token_used' => [
                'free' => 0,
                'paid' => 1
            ]
        ]);
        AccountMiddleware::canClaimFreeToken()($action);
        $this->assertFalse($action->get("can_claim", false));


        //give free token, no tokens left, free token used, paid token used, trial
        $this->setData($action, [
            'free_tokens_amount' => 1,
            'aid'    => 1,
            'tokens' => 0,
            'membership' => 'trial',
            'token_used' => [
                'free' => 1,
                'paid' => 1
            ]
        ]);
        AccountMiddleware::canClaimFreeToken()($action);
        $this->assertFalse($action->get("can_claim", false));


        //DON'T give free token, no tokens left, no free token used, no paid token used, trial
        $this->setData($action, [
            'free_tokens_amount' => 0,
            'aid'    => 1,
            'tokens' => 0,
            'membership' => 'trial',
            'token_used' => [
                'free' => 0,
                'paid' => 0
            ]
        ]);
        AccountMiddleware::canClaimFreeToken()($action);
        $this->assertFalse($action->get("can_claim", false));

    }

    /**
     * @throws Exception
     */
    public function testCountTotalLoggedInSessions()
    {
        $action = $this->setAction([]);

        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'token_usage'   => 0
                ]
            ],  Shape::class)
        ]);
        AccountMiddleware::countTotalEngagement()($action);
        $this->assertEquals(1, $action->get("engagement_total"));



        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'token_usage'   => 20
                ]
            ],  Shape::class)
        ]);
        AccountMiddleware::countTotalEngagement()($action);
        $this->assertEquals(20, $action->get("engagement_total"));



        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'token_usage'   => 20
                ],
                [
                    'token_usage'   => 0
                ]
            ],  Shape::class)
        ]);
        AccountMiddleware::countTotalEngagement()($action);
        $this->assertEquals(21, $action->get("engagement_total"));



        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'token_usage'   => 20
                ],
                [
                    'token_usage'   => 5
                ],
                [
                    'token_usage'   => 0
                ]
            ],  Shape::class)
        ]);
        AccountMiddleware::countTotalEngagement()($action);
        $this->assertEquals(26, $action->get("engagement_total"));



        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'token_usage'   => 20
                ],
                [
                    'token_usage'   => 5
                ],
                [
                    'token_usage'   => 30
                ]
            ],  Shape::class)
        ]);
        AccountMiddleware::countTotalEngagement()($action);
        $this->assertEquals(55, $action->get("engagement_total"));



        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'token_usage'   => 0
                ],
                [
                    'token_usage'   => 0
                ],
                [
                    'token_usage'   => 0
                ]
            ],  Shape::class)
        ]);
        AccountMiddleware::countTotalEngagement()($action);
        $this->assertEquals(3, $action->get("engagement_total"));


    }


    public function testFilterEngagementByPreviousDays()
    {
        $action = $this->setAction([]);

        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2023-06-01'
                ]
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(30)($action);
        $this->assertEquals(1, count($action->get("engagement_filtered", [])));



        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2022-06-01'
                ],
                [
                    'created_at' => '2023-06-01'
                ]
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(30)($action);
        $this->assertEquals(1, count($action->get("engagement_filtered", [])));



        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2023-06-01'
                ],
                [
                    'created_at' => '2023-06-02'
                ]
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(30)($action);
        $this->assertEquals(2, count($action->get("engagement_filtered", [])));



        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2021-06-01'
                ],
                [
                    'created_at' => '2021-06-02'
                ]
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(30)($action);
        $this->assertEquals(0, count($action->get("engagement_filtered", [])));



        $action->setItems([
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2023-05-08'
                ],
                [
                    'created_at' => '2023-06-02'
                ]
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(30)($action);
        $this->assertEquals(1, count($action->get("engagement_filtered", [])));



        $action->setItems([
            'current_day' => DateTime::createFromFormat('Y-m-d', '2023-06-08'),
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2023-05-08'
                ],
                [
                    'created_at' => '2023-06-02'
                ]
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(30)($action);
        $this->assertEquals(1, count($action->get("engagement_filtered", [])));



        $action->setItems([
            'current_day' => DateTime::createFromFormat('Y-m-d', '2023-06-08'),
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2023-05-09'
                ],
                [
                    'created_at' => '2023-06-02'
                ]
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(30)($action);
        $this->assertEquals(2, count($action->get("engagement_filtered", [])));



        $action->setItems([
            'current_day' => DateTime::createFromFormat('Y-m-d', '2023-06-08'),
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2023-05-08'
                ],
                [
                    'created_at' => '2023-06-02'
                ]
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(31)($action);
        $this->assertEquals(2, count($action->get("engagement_filtered", [])));



        $action->setItems([
            'current_day' => DateTime::createFromFormat('Y-m-d', '2023-06-08'),
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2020-06-08'
                ],
                [
                    'created_at' => '2021-06-02'
                ],
                [
                    'created_at' => '2022-06-02'
                ],
                [
                    'created_at' => '2023-06-02'
                ]
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(10000)($action);
        $this->assertEquals(4, count($action->get("engagement_filtered", [])));



        $action->setItems([
            'current_day' => DateTime::createFromFormat('Y-m-d', '2023-06-08'),
            'engagement' => new CollectionClass([
                [
                    'created_at' => '2023-06-06'
                ],
                [
                    'created_at' => '2023-06-07'
                ],
            ], Shape::class)
        ]);
        AccountMiddleware::filterEngagementByPreviousDays(1)($action);
        $this->assertEquals(1, count($action->get("engagement_filtered", [])));
    }
}
