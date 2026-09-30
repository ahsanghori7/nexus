<?php

use Core\Data\Shape;
use Core\Data\Collection;
use Core\TestBootstrap;

class TestCollection extends TestBootstrap
{

    /**
     * @var array
     * For keeping a reusable list of data structures for testing.
     */
    protected array $testItems = [
        0 => [
            ["id" => 1, "group" => 1, "name" => "Test1", "value" => 100],
            ["id" => 2, "group" => 2, "name" => "Test2", "value" => 150],
            ["id" => 3, "group" => 1, "name" => "Test3", "value" => 90],
            ["id" => 4, "group" => 3, "name" => "Test4", "value" => 88],
            ["id" => 5, "group" => 1, "name" => "Test5", "value" => 101],
            ["id" => 6, "group" => 3, "name" => "Test6", "value" => 34],
            ["id" => 7, "group" => 1, "name" => "Test7", "value" => 45345]
        ]
    ];

    /**
     * @param mixed $index
     * @return Collection
     * @throws Exception
     */
    public function getTestCollection(mixed $index) : Collection {
        if(!isset($this->testItems[$index])) {
            throw new \Exception("Invalid test data index $index");
        }
        return new Collection($this->testItems[$index], Shape::class);
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanSetItems() : void {
        $collection = new Collection([
            ["name" => "test"], ["name" => "test two"]
        ], Shape::class);

        $this->assertCount(2, $collection->getItemsAsArray());
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanGetItemsAsInstances() : void {

        $collection = new Collection([
            ["name" => "test"], ["name" => "test two"]
        ], Shape::class);

        $items = $collection->getItems();
        $this->assertTrue(is_a($items[0], Shape::class));
        $this->assertTrue(is_a($items[1], Shape::class));
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanGetFirst() : void {

        $collection = new Collection([
            ["name" => "test"], ["name" => "test two"]
        ], Shape::class);

        $item = $collection->getFirst();
        $this->assertEquals("test", $item->get("name"));
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanGetLast() : void {

        $collection = new Collection([
            ["name" => "test"], ["name" => "test two"]
        ], Shape::class);

        $item = $collection->getLast();
        $this->assertEquals("test two", $item->get("name"));
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanGetByIndex() : void {

        $collection = new Collection([
            ["name" => "test"], ["name" => "test two"], ["name" => "test three"], ["name" => "test four"]
        ], Shape::class);

        $item = $collection->getByIndex(2);
        $this->assertEquals("test three", $item->get("name"));
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanFilter() : void {

        $collection = new Collection([
            ["name" => "test"], ["name" => "test two"], ["name" => "test three"], ["name" => "test four"]
        ], Shape::class);

        $items = $collection->filter(function($i) { return ($i->get("name") === "test");  });
        $this->assertEquals("test", $items->getFirst()->get("name"));

        $items = $collection->filter(function($i) { return ($i->get("name") === "test three");  });
        $this->assertEquals("test three", $items->getFirst()->get("name"));

    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanFilterByField() : void {

        $collection = new Collection([
            ["name" => "test", "age" => 1], ["name" => "test two", "age" => 5],
            ["name" => "test three", "age" => 3], ["name" => "test four", "age" => 10]
        ], Shape::class);

        $items = $collection->filterByField("name", "test");
        $this->assertEquals("test", $items->getFirst()->get("name"));

        $items = $collection->filterByField("name", "test four");
        $this->assertEquals("test four", $items->getFirst()->get("name"));

        $items = $collection->filterByField("name", "test four", "!=");
        $this->assertCount(3, $items);

        $items = $collection->filterByField("age", 3, ">");
        $this->assertCount(2, $items);
        $this->assertTrue($items->getFirst()->get("name") === "test two");
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanFilterStrVal() : void {

        $collection = new Collection([
            ["name" => "tesT", "age" => 1], ["name" => "test tWo", "age" => 5],
            ["name" => "test three", "age" => 3], ["name" => "test fOUr", "age" => 10]
        ], Shape::class);

        $items = $collection->filterByStringField("name", "test");
        $this->assertEquals("tesT", $items->getFirst()->get("name"));

        $items = $collection->filterByStringField("name", "test four");
        $this->assertEquals("test fOUr", $items->getFirst()->get("name"));
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testCanMergeCollections() : void {
        $collectionOne = new Collection([
            ["name" => "test", "age" => 1], ["name" => "test two", "age" => 5]
        ], Shape::class);
        $collectionTwo =new Collection([
            ["name" => "test three", "age" => 3], ["name" => "test four", "age" => 10]
        ], Shape::class);

        $collection = $collectionOne->merge($collectionTwo);

        $this->assertCount(4, $collection);
        $this->assertEquals("test", $collection->getFirst()->get("name"));
        $this->assertEquals("test four", $collection->getLast()->get("name"));
    }

    public function testCanGroupInMapReduce() : void {

        $c = $this->getTestCollection(0);
        $nc = $c->mapReduce("group", function($items, $k) {
            if($k === 1) {
                $this->assertCount(4, $items);
            }
            if($k === 2) {
                $this->assertCount(1, $items);
            }
            if($k === 3) {
                $this->assertCount(2, $items);
            }
            return $items;
        });
    }

    public function testCanReduce() : void {

        $c = $this->getTestCollection(0);

        //Test Reduce by test reduce by field
        $nc = $c->mapReduce("group", function($items, $k) {
            return $items->filterByField("value", 99, operator: ">", cast:"int");
        });

        $this->assertCount( 4, $nc);
        foreach($nc as $item) {
            $this->assertTrue($item->int("value") > 99);
        }

        //Test Reduce by test reduce by sort
        $nc = $c->mapReduce("group", function($items, $k) {
            return $items->sort(function($a, $b) {
                return ($a->get("value") >= $b->get("value")) ? -1 : 1;
            })->slice();
        });

        $this->assertCount(3, $nc);
    }

    public function testCanHandleBadReturn() : void {

        $c = $this->getTestCollection(0);
        try {
            $nc = $c->mapReduce("group", function ($items, $k) {
                return false;
            });
        }
        catch(\Exception $e) {
            $this->assertEquals($e->getMessage(), "Reducer must return array or collection");
        }

    }
}
