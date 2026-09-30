<?php

use PHPUnit\Framework\TestCase;
use App\Models\Collection;
use App\Models\Abstraction;
use App\Models\Base;

class Mock extends Abstraction {

}


class TestCollection extends TestCase {

    protected array $basicItems = [
        ["id" => "1", "name" => "test_one"],
        ["id" => "2", "name" => "test_two"],
        ["id" => "3", "name" => "test_three"]
    ];

    public function testCanGetItems() {
        $collection = new Collection($this->basicItems, Mock::class);
        $items = $collection->getItems();

        $this->assertTrue(count($items) === 3);
        $this->assertTrue( $items[0] instanceof Mock);
    }

    public function testCanGetInstanceItems() {
        $collection = new Collection(
            $this->basicItems,
            Mock::class
        );

        $items = $collection->getItems();
        $this->assertTrue( $items[0] instanceof Mock);
        $this->assertTrue( $items[0]->getData("name") === "test_one");
        $this->assertTrue( $items[2]->getData("name") === "test_three");
    }#

    public function testCanGetFirst() {
        $collection = new Collection(
            $this->basicItems,
            Mock::class
        );

        $item = $collection->getFirst();
        $this->assertTrue( $item instanceof Mock);
        $this->assertTrue( $item->getData("name") === "test_one");
    }

    public function testCanFilter() {
        $collection = new Collection(
            $this->basicItems,
            Mock::class
        );

        $filtered = $collection->filter(function($i) { return ($i->getData("name") === "test_two"); });
        $item = $filtered->getFirst();
        $this->assertTrue( $item instanceof Mock);
        $this->assertTrue( $item->getData("name") === "test_two");
        $this->assertTrue( count($filtered) === 1);
        $this->assertTrue( count( $collection->filter(
            function($i) { return ( in_array($i->getData("name"),["test_one", "test_three"])); })) === 2
        );


        $filtered = $collection->filter(function($i) { return ($i->getData("name") === 5555); });
        $this->assertTrue( count($filtered) === 0);
    }

    public function testCanByIndex() {
        $collection = new Collection(
            $this->basicItems,
            Mock::class
        );

        $item = $collection->getByIndex(0);
        $this->assertTrue( $item instanceof Mock);
        $this->assertTrue( $item->getData("name") === "test_one");

        $item = $collection->getByIndex(2);
        $this->assertTrue( $item instanceof Mock);
        $this->assertTrue( $item->getData("name") === "test_three");

        $item = $collection->getByIndex(3);
        $this->assertTrue( is_null($item));
    }


    public function testCanReduce() {

        $collection = new Collection([
            ["id" => "10", "items" => ["id" => "1", "name" => "test"]],
            ["id" => "11", "items" => ["id" => "2", "name" => "test_two"]],
            ["id" => "12", "items" => ["id" => "3", "name" => "test_three"]],
            ["id" => "13", "items" => ["id" => "4", "name" => "test_four"]]
        ], Base::class);

        $reduced = $collection->reduce(function($i) {
            $items = $i->getData("items");
            if(in_array($items["id"], ["1", "3"])) {
                return new Collection([$items], Base::class);
            }
        });

        $this->assertTrue($reduced->count() === 2);
        $this->assertTrue($reduced->getFirst()->getData("name") === "test");
    }


    public function testCanFilterByIds() {
        $collection = new Collection($this->basicItems, Base::class);
        $items = $collection->filterByIds(["3"]);
        $this->assertTrue($items->count() === 1);
        $this->assertTrue($items->getFirst()->getId() === "3");

        $items = $collection->filterByIds([2, 3], true);
        $this->assertTrue($items->count() === 2);
        $this->assertTrue($items->getFirst()->getId() === "2");
        $this->assertTrue($items->getByIndex(1)->getId() === "3");
    }
}
