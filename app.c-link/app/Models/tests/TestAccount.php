<?php

use PHPUnit\Framework\TestCase;
use App\Models\Account;

class MockAccount extends Account
{

    public function __construct(array $data = [], $id = "")
    {
        $this->data = $data;
        $this->id = $id;
    }

    /**
     * @throws \App\Api\Exception
     */
    public function loadFromApi() {}
}

class TestAccount extends TestCase
{
    public function testGetEnquiryReceivedTotal()
    {
        $account = new MockAccount([
            'user' => [
                'id' => 1
            ]
        ], "1");
        $history = [];
        $exclude = [];
        $count = $account->getEnquiryReceivedTotal($history, $exclude);
        $this->assertEquals(0, $count);



        $account = new MockAccount([
            'user' => [
                'id' => 1000
            ]
        ], "1");
        $history = [
            [
                'name' => 'Project 1',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => []
                    ]
                ]
            ]
        ];
        $exclude = [];
        $count = $account->getEnquiryReceivedTotal($history, $exclude);
        $this->assertEquals(0, $count);



        $account = new MockAccount([
            'user' => [
                'id' => 1000
            ]
        ], "1");
        $history = [
            [
                'name' => 'Project 1',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => []
                    ]
                ]
            ]
        ];
        $exclude = [1, 2, 3, 4, 5, 6];
        $count = $account->getEnquiryReceivedTotal($history, $exclude);
        $this->assertEquals(0, $count);




        $account = new MockAccount([
            'user' => [
                'id' => 1000
            ]
        ], "1");
        $history = [
            [
                'name' => 'Project 1',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 4
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 4
                            ]
                        ]
                    ]
                ]
            ]
        ];
        $exclude = [2];
        $count = $account->getEnquiryReceivedTotal($history, $exclude);
        $this->assertEquals(1, $count);



        $account = new MockAccount([
            'user' => [
                'id' => 1000
            ]
        ], "1");
        $history = [
            [
                'name' => 'Project 1',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 4
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 4
                            ]
                        ]
                    ]
                ]
            ]
        ];
        $exclude = [4];
        $count = $account->getEnquiryReceivedTotal($history, $exclude);
        $this->assertEquals(0, $count);



        $account = new MockAccount([
            'user' => [
                'id' => 1000
            ]
        ], "1");
        $history = [
            [
                'name' => 'Project 1',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 4
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 4
                            ]
                        ]
                    ]
                ]
            ],
            [
                'name' => 'Project 2',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 3
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 3
                            ]
                        ]
                    ]
                ]
            ]
        ];
        $exclude = [4];
        $count = $account->getEnquiryReceivedTotal($history, $exclude);
        $this->assertEquals(1, $count);




        $account = new MockAccount([
            'user' => [
                'id' => 1000
            ]
        ], "1");
        $history = [
            [
                'name' => 'Project 1',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 4
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 4
                            ]
                        ]
                    ]
                ]
            ],
            [
                'name' => 'Project 2',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 3
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 3
                            ]
                        ]
                    ]
                ]
            ],
            [
                'name' => 'Project 3',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 6
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 3
                            ]
                        ]
                    ]
                ]
            ]
        ];
        $exclude = [3, 4, 6];
        $count = $account->getEnquiryReceivedTotal($history, $exclude);
        $this->assertEquals(0, $count);



        $account = new MockAccount([
            'user' => [
                'id' => 1008
            ]
        ], "1");
        $history = [
            [
                'name' => 'Project 1',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 4
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 3
                            ]
                        ]
                    ]
                ]
            ],
            [
                'name' => 'Project 2',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 3
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 3
                            ]
                        ]
                    ]
                ]
            ],
            [
                'name' => 'Project 3',
                'tender' => [
                    [
                        'id' => 1,
                        'Enquiry' => [
                            '1000' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 6
                            ],
                            '1008' => [
                                'history' => [
                                    'author_id' => 1
                                ],
                                'last_status' => 3
                            ]
                        ]
                    ]
                ]
            ]
        ];
        $exclude = [4, 6];
        $count = $account->getEnquiryReceivedTotal($history, $exclude);
        $this->assertEquals(3, $count);
    }
}
