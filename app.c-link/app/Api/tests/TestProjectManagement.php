<?php

use PHPUnit\Framework\TestCase;
use App\Api\ProjectManagement;

class TestProjectManagement extends TestCase
{
    public function testGetInstructionFromIssuedOrders()
    {

        //TEST
        $instructions = [];
        $orders = [
            [
                'tender_id'   => 1,
                'order_price' => 2000,
                'tender'      => [
                    'id'    => 1,
                    'label' => 'Test Package'
                ]

            ]
        ];

        ProjectManagement::getInstructionFromIssuedOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 2000,
                    "variations" => 0,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 2000
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [];
        $orders = [
            [
                'tender_id'   => 1,
                'order_price' => 2000,
                'tender'      => [
                    'id'    => 1,
                    'label' => 'Test Package'
                ]

            ],
            [
                'tender_id'   => 2,
                'order_price' => 5000,
                'tender'      => [
                    'id'    => 2,
                    'label' => 'Test Another Package'
                ]

            ]
        ];

        ProjectManagement::getInstructionFromIssuedOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 2000,
                    "variations" => 0,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 2000
                ],
                2 => [
                    "tid" => 2,
                    "package" => "Test Another Package",
                    "order" => 5000,
                    "variations" => 0,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 5000
                ]
            ]
            ,$instructions);



        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 500,
            ]
        ];
        $orders = [
            [
                'tender_id'   => 1,
                'order_price' => 2000,
                'tender'      => [
                    'id'    => 1,
                    'label' => 'Test Package'
                ]

            ]
        ];

        ProjectManagement::getInstructionFromIssuedOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 2000,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 2500,
                    "issue_order" => true
                ]
            ]
        ,$instructions);




        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 1000,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 1500,
            ]
        ];
        $orders = [
            [
                'tender_id'   => 1,
                'order_price' => 2000,
                'tender'      => [
                    'id'    => 1,
                    'label' => 'Test Package'
                ]

            ]
        ];

        ProjectManagement::getInstructionFromIssuedOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 2000,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 2500,
                    "issue_order" => true
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 1000,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 1500,
            ],
            2 => [
                "tid"        => 2,
                "package"    => "Test Another Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 3000,
                "budget"     => 0,
                "total"      => -2500,
            ]
        ];
        $orders = [
            [
                'tender_id'   => 1,
                'order_price' => 1234,
                'tender'      => [
                    'id'    => 1,
                    'label' => 'Test Package'
                ]

            ],
            [
                'tender_id'   => 2,
                'order_price' => 1000,
                'tender'      => [
                    'id'    => 2,
                    'label' => 'Test Another Package'
                ]

            ]
        ];

        ProjectManagement::getInstructionFromIssuedOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 1234,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 1734,
                    "issue_order" => 1
                ],
                2 => [
                    "tid" => 2,
                    "package" => "Test Another Package",
                    "order" => 1000,
                    "variations" => 500,
                    "omissions" => 3000,
                    "budget" => 0,
                    "total" => -1500,
                    "issue_order" => true
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 1000,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 1500,
            ],
            2 => [
                "tid"        => 2,
                "package"    => "Test Another Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 3000,
                "budget"     => 0,
                "total"      => -2500,
            ]
        ];
        $orders = [];

        ProjectManagement::getInstructionFromIssuedOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 1000,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 1500
                ],
                2 => [
                    "tid" => 2,
                    "package" => "Test Another Package",
                    "order" => 0,
                    "variations" => 500,
                    "omissions" => 3000,
                    "budget" => 0,
                    "total" => -2500
                ]
            ]
        ,$instructions);
    }

    public function testGetInstructionFromDraftOrders()
    {

        //TEST
        $instructions = [];
        $orders = [
            1 => [
                'documents' => [
                    [
                        'status'     => 1,
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 20000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ]
                ]
            ]
        ];

        ProjectManagement::getInstructionFromDraftOrders($orders, $instructions);
        self::assertEquals(
            [
                "Test Package" => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 20000,
                    "variations" => 0,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 20000
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [];
        $orders = [
            1 => [
                'documents' => [
                    [
                        'status'     => 1,
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 20000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ]
                ]
            ],
            2 => [
                'documents' => [
                    [
                        'status'     => 1,
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 900
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Another Package'
                                ],
                                'tender_id' => 2
                            ]
                        ])
                    ]
                ]
            ]
        ];

        ProjectManagement::getInstructionFromDraftOrders($orders, $instructions);
        self::assertEquals(
            [
                "Test Package" => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 20000,
                    "variations" => 0,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 20000
                ],
                "Test Another Package" => [
                    "tid" => 2,
                    "package" => "Test Another Package",
                    "order" => 900,
                    "variations" => 0,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 900
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 500,
            ]
        ];
        $orders = [
            1 => [
                'documents' => [
                    [
                        'status'     => 1,
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 20000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ]
                ]
            ]
        ];

        ProjectManagement::getInstructionFromDraftOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 20000,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 20500
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 500,
            ]
        ];
        $orders = [
            1 => [
                'documents' => [
                    [
                        'status'     => 0, //document is in draft but is not completed 100%
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 20000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ]
                ]
            ]
        ];

        ProjectManagement::getInstructionFromDraftOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 0,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 500
                ]
            ]
        ,$instructions);


        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 500,
            ]
        ];
        $orders = [
            1 => [
                'documents' => [
                    [
                        'status'     => 0, //document is in draft but is not completed 100%
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 20000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ],
                    [
                        'status'     => 1,
                        'created_at' => '2023-11-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 6500
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ]
                ]
            ]
        ];

        ProjectManagement::getInstructionFromDraftOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 6500,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 7000
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 500,
            ]
        ];
        $orders = [
            1 => [
                'documents' => [
                    [
                        'status'     => 0, //document is in draft but is not completed 100%
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 20000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ],
                    [
                        'status'     => 0, //document is in draft but is not completed 100%
                        'created_at' => '2023-11-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 6500
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ]
                ]
            ]
        ];

        ProjectManagement::getInstructionFromDraftOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 0,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 500
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 500,
            ]
        ];
        $orders = [
            1 => [
                'documents' => [
                    [
                        'status'     => 1,
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 20000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ],
                    [//this will be taken as is the last draft order created based on the created at value
                        'status'     => 1,
                        'created_at' => '2023-11-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 8000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ]
                ]
            ]
        ];

        ProjectManagement::getInstructionFromDraftOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 8000,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 8500
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 500,
            ]
        ];
        $orders = [];

        ProjectManagement::getInstructionFromDraftOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 0,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 500
                ]
            ]
        ,$instructions);



        //TEST
        $instructions = [
            1 => [
                "tid"        => 1,
                "package"    => "Test Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 0,
                "budget"     => 0,
                "total"      => 500,
            ],
            2 => [
                "tid"        => 2,
                "package"    => "Test Another Package",
                "order"      => 0,
                "variations" => 500,
                "omissions"  => 4000,
                "budget"     => 0,
                "total"      => -3500,
            ]
        ];
        $orders = [
            1 => [
                'documents' => [
                    [
                        'status'     => 1,
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 20000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ],
                    [//this will be taken as is the last draft order created based on the created at value
                        'status'     => 1,
                        'created_at' => '2023-11-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 8000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Package'
                                ],
                                'tender_id' => 1
                            ]
                        ])
                    ]
                ]
            ],
            2 => [
                'documents' => [
                    [
                        'status'     => 0,
                        'created_at' => '2023-01-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 20000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Another Package'
                                ],
                                'tender_id' => 2
                            ]
                        ])
                    ],
                    [
                        'status'     => 1,
                        'created_at' => '2023-11-01 17:00:00',
                        'meta' => json_encode([
                            'values' => [
                                'order_value' => 3000
                            ],
                            'quote' => [
                                'tender' => [
                                    'label' => 'Test Another Package'
                                ],
                                'tender_id' => 2
                            ]
                        ])
                    ]
                ]
            ]
        ];

        ProjectManagement::getInstructionFromDraftOrders($orders, $instructions);
        self::assertEquals(
            [
                1 => [
                    "tid" => 1,
                    "package" => "Test Package",
                    "order" => 8000,
                    "variations" => 500,
                    "omissions" => 0,
                    "budget" => 0,
                    "total" => 8500
                ],
                2 => [
                    "tid" => 2,
                    "package" => "Test Another Package",
                    "order" => 3000,
                    "variations" => 500,
                    "omissions" => 4000,
                    "budget" => 0,
                    "total" => -500
                ]
            ]
        ,$instructions);
    }
}
