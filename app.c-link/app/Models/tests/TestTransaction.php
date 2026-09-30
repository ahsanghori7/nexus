<?php

use App\Models\Transaction;
use PHPUnit\Framework\TestCase;


class TestTransaction extends TestCase {

  public function testCanGetTransactionCountByTenderIds()  {

    $transaction = new Transaction(
      [
        1 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
        2 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
        3 => [
          'subcontractor_id' => 2,
          'tender_id' => 2
        ],
      ]
    );
    $tender_id = 2;
    $result = $transaction->getTransactionCountByTenderIds([$tender_id]);
    $result = $result[$tender_id];
    $total = 3;
    $unique = 2;
    $this->assertEquals($total, array_sum($result));
    $this->assertCount($unique, $result);



    $transaction = new Transaction(
      [
        1 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
        2 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
        3 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
      ]
    );
    $tender_id = 2;
    $result = $transaction->getTransactionCountByTenderIds([$tender_id]);
    $result = $result[$tender_id];
    $total = 3;
    $unique = 1;
    $this->assertEquals($total, array_sum($result));
    $this->assertCount($unique, $result);



    $transaction = new Transaction(
      [
        1 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
        2 => [
          'subcontractor_id' => 2,
          'tender_id' => 2
        ],
        3 => [
          'subcontractor_id' => 3,
          'tender_id' => 2
        ],
      ]
    );
    $tender_id = 2;
    $result = $transaction->getTransactionCountByTenderIds([$tender_id]);
    $result = $result[$tender_id];
    $total = 3;
    $unique = 3;
    $this->assertEquals($total, array_sum($result));
    $this->assertCount($unique, $result);



    $transaction = new Transaction(
      [
        1 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
        2 => [
          'subcontractor_id' => 2,
          'tender_id' => 3
        ],
        3 => [
          'subcontractor_id' => 3,
          'tender_id' => 3
        ],
      ]
    );
    $tender_id = 2;
    $result = $transaction->getTransactionCountByTenderIds([$tender_id]);
    $result = $result[$tender_id];
    $total = 1;
    $unique = 1;
    $this->assertEquals($total, array_sum($result));
    $this->assertCount($unique, $result);



    $transaction = new Transaction(
      [
        1 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
        2 => [
          'subcontractor_id' => 2,
          'tender_id' => 3
        ],
        3 => [
          'subcontractor_id' => 2,
          'tender_id' => 3
        ],
      ]
    );
    $tender_id = 3;
    $result = $transaction->getTransactionCountByTenderIds([$tender_id]);
    $result = $result[$tender_id];
    $total = 2;
    $unique = 1;
    $this->assertEquals($total, array_sum($result));
    $this->assertCount($unique, $result);



    $transaction = new Transaction(
      [
        1 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
        2 => [
          'subcontractor_id' => 2,
          'tender_id' => 3
        ],
        3 => [
          'subcontractor_id' => 2,
          'tender_id' => 3
        ],
      ]
    );
    $tender_id = [2,3];
    $expected_count[2] = [
      'total' => 1,
      'unique' => 1
    ];
    $expected_count[3] = [
      'total' => 2,
      'unique' => 1
    ];
    $result = $transaction->getTransactionCountByTenderIds($tender_id);
    foreach($result as $tender_id => $item){
      $this->assertEquals($expected_count[$tender_id]['total'], array_sum($item));
      $this->assertCount($expected_count[$tender_id]['unique'], $item);
    }


    $transaction = new Transaction(
      [
        1 => [
          'subcontractor_id' => 1,
          'tender_id' => 2
        ],
        2 => [
          'subcontractor_id' => 2,
          'tender_id' => 3
        ],
        3 => [
          'subcontractor_id' => 2,
          'tender_id' => 3
        ],
        4 => [
          'subcontractor_id' => 3,
          'tender_id' => 3
        ],
        5 => [
          'subcontractor_id' => 2,
          'tender_id' => 4
        ],
        6 => [
          'subcontractor_id' => 3,
          'tender_id' => 4
        ],
        7 => [
          'subcontractor_id' => 4,
          'tender_id' => 5
        ],
        8 => [
          'subcontractor_id' => 5,
          'tender_id' => 6
        ],
        9 => [
          'subcontractor_id' => 6,
          'tender_id' => 7
        ],
        10 => [
          'subcontractor_id' => 7,
          'tender_id' => 7
        ],
      ]
    );
    $tender_id = [2,3,4,5,6,7];
    $expected_count[2] = [
      'total' => 1,
      'unique' => 1
    ];
    $expected_count[3] = [
      'total' => 3,
      'unique' => 2
    ];
    $expected_count[4] = [
      'total' => 2,
      'unique' => 2
    ];
    $expected_count[5] = [
      'total' => 1,
      'unique' => 1
    ];
    $expected_count[6] = [
      'total' => 1,
      'unique' => 1
    ];
    $expected_count[7] = [
      'total' => 2,
      'unique' => 2
    ];
    $result = $transaction->getTransactionCountByTenderIds($tender_id);
    foreach($result as $tender_id => $item){
      $this->assertEquals($expected_count[$tender_id]['total'], array_sum($item));
      $this->assertCount($expected_count[$tender_id]['unique'], $item);
    }






  }
}
