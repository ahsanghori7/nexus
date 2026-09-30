<?php


    namespace App\core\Html\test;

    use App\core\Html\Element;
    use PHPUnit\Framework\TestCase as PHPUnit_TestCase;

    class TestElement extends PHPUnit_TestCase
    {
        public function testCanGetTag() {
            $el = new Element("a");
            $this->assertEquals("<a />", $el->__toString());

            $el = new Element("a", ["href" => "home"]);
            $this->assertEquals("<a href='home' />", $el->__toString());

            $el = new Element("a", ["href" => "home"], "home");
            $this->assertEquals("<a href='home'>home</a>", $el->__toString());
        }
    }
