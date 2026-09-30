<?php

use App\Models\Tender;
use PHPUnit\Framework\TestCase;


class TestTender extends TestCase {

    public function testGetDefaultDecisionDate()
    {
        $tender = new Tender([], "7");

        //difference between tender and start on site is greater than 4 weeks
        //and therefore the decision date should be set 2 weeks after the tender return
        $tender_return = '2022-05-01';
        $start_on_site = '2022-09-01';
        $this->assertEquals("2022-05-15", $tender->getDefaultDecisionDate([
            "start_on_site" => $start_on_site,
            "tender_return" => $tender_return,
        ]));


        //difference between tender and start on site is less than 4 weeks
        //and therefore the decision date should be set in the middle of the tender return and start on site
        $tender_return = '2022-05-01';
        $start_on_site = '2022-05-09';
        $this->assertEquals("2022-05-05", $tender->getDefaultDecisionDate([
            "start_on_site" => $start_on_site,
            "tender_return" => $tender_return
        ]));


        //difference between tender and start on site is less than 4 weeks
        //and therefore the decision date should be set 2 weeks after the tender return
        //or a custom of number of days after tender return if is specified
        $tender_return = '2022-05-01';
        $start_on_site = '2022-09-09';
        $this->assertEquals("2022-05-03", $tender->getDefaultDecisionDate([
            "start_on_site" => $start_on_site,
            "tender_return" => $tender_return
        ], 2));


        //difference between tender and start on site is less than 4 weeks
        //and therefore the decision date should be set 2 weeks after the tender return
        //or a custom of number of days after tender return if is specified
        $tender_return = '2022-05-01';
        $start_on_site = '2022-09-09';
        $this->assertEquals("2022-05-01", $tender->getDefaultDecisionDate([
            "start_on_site" => $start_on_site,
            "tender_return" => $tender_return
        ], 0));



        //if the decision date is provided already we don't need to calculate anything
        $tender_return = '2022-05-01';
        $start_on_site = '2022-09-01';
        $decision_date = '2027-11-22';
        $this->assertEquals("2027-11-22", $tender->getDefaultDecisionDate([
            "start_on_site" => $start_on_site,
            "tender_return" => $tender_return,
            "decision_date" => $decision_date
        ]));
    }

    public function testCanGetApiUrl() {
        $tender = new Tender(["project_id" => 4], "66");
        $this->assertEquals("project/4/tender/66", $tender->getApiUrl());
    }

    public function testCanGetTradeIds()  {
        $tender = new Tender(["packages" => [
            ["package_id" => 5],
            ["package_id" => 44],
            ["package_id" => 33],
            ["package_id" => 55]
        ]]);
        $this->assertEquals([5,44,33,55], $tender->tradeIds());
    }

  public function testCanGetHistoryCountByType()  {

    $tender = new Tender(
      [
        "Interest" => [
          1 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 4
          ],
          2 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 4
          ],
          3 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 4
          ],
        ]
      ]
    );
    $this->assertEquals(3, $tender->getHistoryCountByType('Interest'));




    $tender = new Tender(
      [
        "Interest" => [
          1 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
          2 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 4
          ],
          3 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 4
          ],
        ]
      ]
    );
    $this->assertEquals(2, $tender->getHistoryCountByType('Interest',[2]));



    $tender = new Tender(
      [
        "Interest" => [
          1 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
          2 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
          3 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 8
          ],
          4 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 1
          ],
        ]
      ]
    );
    $this->assertEquals(1, $tender->getHistoryCountByType('Interest',[2,8]));




    $tender = new Tender(
      [
        "Interest" => [
          102 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
          103 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
          17446 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
        ]
      ]
    );
    $this->assertEquals(0, $tender->getHistoryCountByType('Interest',[2]));



    $tender = new Tender(
      [
        "Enquiry" => [
          102 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
          103 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
          17446 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
        ]
      ]
    );
    $this->assertEquals(3, $tender->getHistoryCountByType('Enquiry'));



    $tender = new Tender(
      [
        "Test" => [
          102 => [
            'history' => [
              'author_id' => null
            ],
            'last_status' => 2
          ],
        ]
      ]
    );
    $this->assertEquals(1, $tender->getHistoryCountByType('Test'));
  }
}
