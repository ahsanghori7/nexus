<?php

namespace Core;

if(!defined("APP")) {
    define("APP", "core");
}

require_once(realpath(__DIR__ . "/../../../init.php"));

use PHPUnit\Framework\TestCase;
use Core\Data\Shape;
class TestBootstrap extends TestCase {

    /**
     * @var array
     * For keeping a reusable list of data structures for testing.
     */
    protected array $testItems = [];

    /**
     * @param mixed $index
     * @return array
     * @throws \Exception
     */
    public function getTestItem(mixed $index) : array {
        if(!isset($this->testItems[$index])) {
            throw new \Exception("Invalid test data index $index");
        }
        return $this->testItems[$index];
    }

    /**
     * @param mixed $index
     * @return Shape
     * @throws \Exception
     */
    public function getTestItemAsShape(mixed $index) : Shape {
        return new Shape($this->getTestItem($index));
    }

}
