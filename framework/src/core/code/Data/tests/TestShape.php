<?php
use PHPUnit\Framework\TestCase;
use Core\Data\Shape;

class TestShape extends TestCase
{

    /**
     * @return void
     */
    public function testCanSetAndGet() : void {
        $cls = new Shape(["test" => 2]);
        $this->assertEquals($cls->get("test"), 2);
    }

    /**
     * @return void
     */
    public function testCanGetRecursive() : void {
        $cls = new Shape(["one" => (new Shape(["two" => (new Shape(["three" => 100]))]))]);
        $this->assertEquals($cls->get("one.two.three"), 100);

        $cls = new Shape(["one" => (new Shape(["two" => ["three" => 100]]))]);
        $this->assertEquals($cls->get("one.two.three"), 100);

        $cls = new Shape(["one" => 100]);
        $this->assertEquals($cls->get("one.two.three"), null);
    }

    /**
     * @return void
     */
    public function testCanGetShapeFromShape() : void {
        $cls = new Shape([
                "test" => ["test_value" => 1, "test_value_two" => 2],
                "test_shape" => new Shape(["shape_test" => 100]),
                "int_shape"  => 55

            ]
        );

        $shape = $cls->getShape("test");
        $this->assertEquals(1, $shape->get("test_value"));
        $existingShape = $cls->getShape("test_shape");
        $this->assertEquals(100, $existingShape->get("shape_test"));

        $intShape = $cls->getShape("int_shape");
        $this->assertEquals(55, $intShape->get("int_shape"));
    }
}
