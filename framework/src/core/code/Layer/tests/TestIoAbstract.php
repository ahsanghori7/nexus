<?php
namespace Layer\Mock;

use PHPUnit\Framework\TestCase;
use Core\Layer\IoAbstract;


class Incoming extends IoAbstract {

    public function __construct(protected string $path = ""){}

    public function getPath() : string {
        return $this->path;
    }
}

class Outgoing extends IoAbstract {

    public function __construct(protected string $path = ""){}

    public function getPath() : string {
        return $this->path;
    }
}


class TestIoAbstract extends TestCase
{

    /**
     * @return void
     */
    public function testCanGetDirection() : void {
        $i = new Incoming();
        $o = new Outgoing();
        $this->assertEquals("incoming", $i->getDirection());
        $this->assertEquals("outgoing", $o->getDirection());
    }

    /**
     * @return void
     */
    public function testCanMatchDirection() : void {
        $i = new Incoming();
        $o = new Outgoing();
        $this->assertTrue($i->isDirection("incoming"));
        $this->assertTrue($o->isDirection("outgoing"));
    }

    /**
     * @return void
     */
    public function testCanGetType() : void {
        $i = new Incoming();
        $o = new Outgoing();
        $this->assertEquals("mock", $i->getType());
        $this->assertEquals("mock", $o->getType(), );
    }

    /**
     * @return void
     */
    public function testCanMatchType() : void {
        $i = new Incoming();
        $o = new Outgoing();
        $this->assertTrue($i->isType("mock"));
        $this->assertTrue($o->isType("mock"));
    }

    /**
     * @return void
     */
    public function testCanGetPathByIndex() : void {
        $i = new Incoming("test/one/two/three");
        $this->assertEquals("test", $i->getPathByIndex(0));
        $this->assertEquals("test/one/two", $i->getPathByIndex(0, 2));
        $this->assertEquals("one/two", $i->getPathByIndex(1, 2));
        $this->assertEquals("test/one/two/three", $i->getPathByIndex(0, -1));
        $this->assertEquals("test/one/two", $i->getPathByIndex(0, -2));
        $this->assertEquals("one/two", $i->getPathByIndex(1, -2));

    }
}
