<?php

use PHPUnit\Framework\TestCase;
use App\Api\Transactions;

class TestTransaction extends TestCase
{
    public function testCanConvertToPenny() {

        $values = Transactions::covertToPennyValue([
            "price" => 200,
            "measured_work" => "200.0",
            "prelims" => "344.",
            "other_items" => "2444.554545",
            "order_value" => "200.99",
            "tester" => "1221"
        ]);

        $this->assertEquals(20000, $values["price"], "Invalid price");
        $this->assertEquals(20000, $values["measured_work"], "Invalid measured work");
        $this->assertEquals(34400, $values["prelims"], "Invalid prelims");
        $this->assertEquals(244455, $values["other_items"], "Invalid other items");
        $this->assertEquals(20099, $values["order_value"], "Invalid order value");
        $this->assertEquals("1221", $values["tester"], "Altered Key when should have ignored");
    }
}
