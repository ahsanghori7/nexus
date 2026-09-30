<?php

namespace Api\Data\Transaction\Quote\tests;

use Api\TestBootstrap;
use Api\Data\Transaction\Quote\Item;
use Core\Data\Shape;

class TestItem extends TestBootstrap {

    protected array $testItems = [
        //New Item Variants
        ["rate" => 150.00, "version" => 1, "transaction_id" => 31],
        ["rate" => 100.00, "version" => 2, "transaction_id" => 22],
        //Unpublished Item
        [
            "id" => 1,
            "boq_item_id" => 15,
            "rate" => 100.00,
            "version" => 1,
            "status_id" => 2,
            "created_at" => "2024-05-03 14:50:26",
            "updated_at" => "2024-05-16 12:09:20",
            "transaction_id" => 55
        ],
        //Published Item
        [
            "id" => 43,
            "boq_item_id" => 15,
            "rate" => 100.00,
            "version" => 2,
            "status_id" => 3,
            "created_at" => "2024-05-03 14:50:26",
            "updated_at" => "2024-05-16 12:09:20",
            "transaction_id" => 55
        ],
        //Published Item
        [
            "id" => 23,
            "boq_item_id" => 15,
            "rate" => 100.00,
            "version" => 5,
            "status_id" => 3,
            "created_at" => "2024-05-03 14:50:26",
            "updated_at" => "2024-05-16 12:09:20",
            "transaction_id" => 55
        ]
    ];

    /**
     * @return void
     * @throws \Exception
     */
    public function testRateIsntUpdated() : void {
        $item = $this->getTestItemAsShape(0);
        $item->setItems(["transaction_id", 2]);
        $this->assertEquals(150.00, $item->get("rate"));
    }
    public function testItemIsFlaggedWithUpdated() : void {

        //Check and unpublished item doesn't create a child and the rate updates
        //New Item
        $item = $this->getTestItemAsShape(0);
        $item->setItems(["rate" => 2200]);
        $this->assertFalse($item->has("child"));
        $this->assertEquals(2200, $item->get("rate"));
        $this->assertEquals(1, $item->get("version"));
        $this->assertTrue($item->get("updated"));
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanCreateNewItem() : void {

        //Check and unpublished item doesn't create a child and the rate updates
        //New Item
        $item = $this->getTestItemAsShape(0);
        $item->setItems(["rate" => 2200]);
        $this->assertFalse($item->has("child"));
        $this->assertEquals(2200, $item->get("rate"));

        //Unpublished Item
        $item = $this->getTestItemAsShape(2);
        $item->setItems(["rate" => 4200]);
        $this->assertFalse($item->has("child"));
        $this->assertEquals(4200,$item->get("rate"));

        //Check a published update creates a child
        $item = $this->getTestItemAsShape(3);
        $item->setItems(["rate" => 5500]);
        $this->assertTrue($item->has("child"));

        $child = $item->get("child");
        $this->assertEquals(100.00, $item->get("rate"));
        $this->assertEquals(5500,   $child->get("rate"));

    }

    public function testCanCreateNewItemWithVerion() : void {
        //Check that the version is updated on creation of a new child

        $item = $this->getTestItemAsShape(3);
        $item->setItems(["rate" => 5500]);
        $this->assertTrue($item->has("child"));

        $child = $item->get("child");
        $this->assertEquals($item->get("version") + 1,   $child->get("version"));

        //Conduct test again with different version
        $item = $this->getTestItemAsShape(4);
        $item->setItems(["rate" => 5500]);
        $this->assertTrue($item->has("child"));

        $child = $item->get("child");
        $this->assertEquals($item->get("version") + 1,   $child->get("version"));
        $this->assertEquals($item->get("id"),   $child->get("parent_id"));

    }

    /**
     * @param mixed $index
     * @return Shape
     * @throws \Exception
     */
    public function getTestItemAsShape(mixed $index) : Shape {
        return new Item($this->getTestItem($index));
    }
}
