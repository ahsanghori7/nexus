<?php

use PHPUnit\Framework\TestCase;
use App\Api\Project as ProjectApi;

class ApiProject extends TestCase
{

  public function getProject()
  {
    return [
      'tender' => [
        [
          'id' => 1,
          'label' => 'Tender 1'
        ],
        [
          'id' => 2,
          'label' => 'Tender 2'
        ],
        [
          'id' => 3,
          'label' => 'Tender 3'
        ],
        [
          'id' => 4,
          'label' => 'Tender 4'
        ],
        [
          'id' => 5,
          'label' => 'Tender 5'
        ]
      ]
    ];
  }

  /*
   * Get first enquiry sent date for all tenders inside a project
   * If the tender has no history than we don't do anything
   * We can filter the history by status as we might want to filter by tender history status (dismissed, deleted, etc)
   * If we find an enquiry in history we need to get the first enquiry that was sent for that tender (if the same enquiry was sent multiple time to the same subcontractor we will take the first one)
   * After we get the date we will assing a new key to the tender called "enquiry_sent_date"
   *
   */
  public function testGetProjectTenderFirstEnquirySentDate()
  {

    $project = $this->getProject();
    $history = [
      [
        'label' => 'Tender 1',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2023-07-15'
              ],
              [
                'created_at' => '2023-02-16'
              ]
            ],
            'last_status' => 1
          ],
          [
            'history' => [
              [
                'created_at' => '2022-02-16'
              ],
              [
                'created_at' => '2022-02-15'
              ]
            ],
            'last_status' => 1
          ]
        ]
      ],
      [
        'label' => 'Tender 2',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2030-01-11'
              ]
            ],
            'last_status' => 1
          ]
        ]
      ]
    ];

    ProjectApi::updateProjectTenderFirstEnquirySentDate($project, $history, [2, 6, 10]);
    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][0]);
    $this->assertEquals("2022-02-15", $project['tender'][0]['enquiry_sent_date']);

    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][1]);
    $this->assertEquals("2030-01-11", $project['tender'][1]['enquiry_sent_date']);

    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][2]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][3]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][4]);




    $project = $this->getProject();
    $history = [
      [
        'label' => 'Tender 1',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2023-07-15'
              ],
              [
                'created_at' => '2023-02-16'
              ]
            ],
            'last_status' => 1
          ],
          [
            'history' => [
              [
                'created_at' => '2022-02-16'
              ],
              [
                'created_at' => '2022-02-15'
              ]
            ],
            'last_status' => 1
          ]
        ]
      ],
      [
        'label' => 'Tender 2',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2030-01-12'
              ]
            ],
            'last_status' => 1
          ]
        ]
      ],
      [
        'label' => 'Tender 3',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2040-01-14'
              ]
            ],
            'last_status' => 1
          ],
          [
            'history' => [
              [
                'created_at' => '2040-01-13'
              ]
            ],
            'last_status' => 1
          ],
          [
            'history' => [
              [
                'created_at' => '2040-01-12'
              ]
            ],
            'last_status' => 1
          ]
        ]
      ],
      [
        'label' => 'Tender 4',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2050-01-18'
              ]
            ],
            'last_status' => 1
          ]
        ]
      ],
      [
        'label' => 'Tender 5',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2060-01-10'
              ],
              [
                'created_at' => '2060-01-08'
              ]
            ],
            'last_status' => 1
          ]
        ]
      ]
    ];

    ProjectApi::updateProjectTenderFirstEnquirySentDate($project, $history, [2, 6, 10]);
    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][0]);
    $this->assertEquals("2022-02-15", $project['tender'][0]['enquiry_sent_date']);

    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][1]);
    $this->assertEquals("2030-01-12", $project['tender'][1]['enquiry_sent_date']);

    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][2]);
    $this->assertEquals("2040-01-12", $project['tender'][2]['enquiry_sent_date']);

    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][3]);
    $this->assertEquals("2050-01-18", $project['tender'][3]['enquiry_sent_date']);

    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][4]);
    $this->assertEquals("2060-01-08", $project['tender'][4]['enquiry_sent_date']);




    $project = $this->getProject();
    $history = [
      [
        'label' => 'Tender 1',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2023-07-15'
              ],
              [
                'created_at' => '2023-02-16'
              ]
            ],
            'last_status' => 10
          ],
          [
            'history' => [
              [
                'created_at' => '2022-02-16'
              ],
              [
                'created_at' => '2022-02-15'
              ]
            ],
            'last_status' => 6
          ]
        ]
      ],
      [
        'label' => 'Tender 2',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2030-01-1'
              ]
            ],
            'last_status' => 2
          ]
        ]
      ]
    ];
    ProjectApi::updateProjectTenderFirstEnquirySentDate($project, $history, [2, 6, 10]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][0]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][1]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][2]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][3]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][4]);




    $project = $this->getProject();
    $history = [
      [
        'label' => 'Tender 1',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2023-07-15'
              ],
              [
                'created_at' => '2023-02-16'
              ]
            ],
            'last_status' => 10
          ],
          [
            'history' => [
              [
                'created_at' => '2022-02-16'
              ],
              [
                'created_at' => '2022-02-15'
              ]
            ],
            'last_status' => 6
          ]
        ]
      ],
      [
        'label' => 'Tender 2',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2030-01-10'
              ]
            ],
            'last_status' => 1
          ]
        ]
      ]
    ];
    ProjectApi::updateProjectTenderFirstEnquirySentDate($project, $history, [2, 6, 10]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][0]);

    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][1]);
    $this->assertEquals("2030-01-10", $project['tender'][1]['enquiry_sent_date']);

    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][2]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][3]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][4]);




    $project = $this->getProject();
    $history = [
      [
        'label' => 'Tender 2',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2030-01-14'
              ],
              [
                'created_at' => '2030-01-13'
              ],
              [
                'created_at' => '2030-01-12'
              ],
              [
                'created_at' => '2030-01-11'
              ]
            ],
            'last_status' => 1
          ]
        ]
      ],
      [
        'label' => 'Tender 3',
        'Enquiry' => [
          [
            'history' => [
              [
                'created_at' => '2040-01-29'
              ]
            ],
            'last_status' => 1
          ],
          [
            'history' => [
              [
                'created_at' => '2010-01-19'
              ]
            ],
            'last_status' => 10
          ]
        ]
      ]
    ];
    ProjectApi::updateProjectTenderFirstEnquirySentDate($project, $history, []);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][0]);

    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][1]);
    $this->assertEquals("2030-01-11", $project['tender'][1]['enquiry_sent_date']);

    $this->assertArrayHasKey("enquiry_sent_date", $project['tender'][2]);
    $this->assertEquals("2010-01-19", $project['tender'][2]['enquiry_sent_date']);

    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][3]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][4]);




    $project = $this->getProject();
    $history = [];
    ProjectApi::updateProjectTenderFirstEnquirySentDate($project, $history, [2, 6, 10]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][0]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][1]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][2]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][3]);
    $this->assertArrayNotHasKey("enquiry_sent_date", $project['tender'][4]);
  }

  public function testGetPackages()
  {

      $trades = [
          [
              'id' => 1,
              'label' => 'TEST 1'
          ],
          [
              'id' => 2,
              'label' => 'TEST 2'
          ],
          [
              'id' => 3,
              'label' => 'TEST 3'
          ],
          [
              'id' => 4,
              'label' => 'TEST 4'
          ],
          [
              'id' => 5,
              'label' => 'TEST 5'
          ],
          [
              'id' => 6,
              'label' => 'TEST 6'
          ],
          [
              'id' => 7,
              'label' => 'TEST 7'
          ],
          [
              'id' => 8,
              'label' => 'TEST 8'
          ],
      ];


      //whitelist test
      $whitelist = [
          [
              'trade_id' => 1,
          ],
          [
              'trade_id' => 2,
          ]
      ];

      $this->assertEquals([
          [
            'id' => 1, 'label' => 'TEST 1'
          ],
          [
            'id' => 2, 'label' => 'TEST 2'
          ],
      ],ProjectApi::filterTradesByWhitelist($trades,$whitelist));



      //whitelist and check to see if the order is kept
      $whitelist = [
          [
              'trade_id' => 6,
          ],
          [
              'trade_id' => 1,
          ],
          [
              'trade_id' => 4,
          ]
      ];
      $this->assertEquals([
          [
              'id' => 1, 'label' => 'TEST 1'
          ],
          [
              'id' => 4, 'label' => 'TEST 4'
          ],
          [
              'id' => 6, 'label' => 'TEST 6'
          ],
      ],ProjectApi::filterTradesByWhitelist($trades,$whitelist));



      //not whitelist
      $whitelist = [];
      $this->assertEquals($trades ,ProjectApi::filterTradesByWhitelist($trades,$whitelist));
  }

}
