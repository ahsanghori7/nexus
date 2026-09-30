<?php declare(strict_types=1);
use PHPUnit\Framework\TestCase;
use CL\Pdf\Html\Abstraction;
use CL\Pdf\Html\Image;


class MockElement extends Abstraction {

    public function getTag(): string
    {
        return "test";
    }
}

class TestHtmlElement extends TestCase
{

    public function testCanGetType() {
        $mock = new Image();
        $this->assertEquals('Image', $mock->getType());

        $mock = new MockElement();
        $this->assertEquals('MockElement', $mock->getType());

    }

    public function testCanGetInlineStyles() {
        $mock = new MockElement(["style" => [
            "test" => 1, "test2" => 2
        ]]);

        $this->assertEquals('style="test:1; test2:2"', $mock->getInlineStyles());
        //If no styles, return val is empty string
        $mock = new MockElement(["style" => []]);
        $this->assertEquals('', $mock->getInlineStyles());

        $mock = new MockElement([]);
        $this->assertEquals('', $mock->getInlineStyles());
    }


    public function testCanGetPropertyHtml() {
        $mock = new MockElement(["props" => [
            "test" => 1, "test2" => 2
        ]]);

        $this->assertEquals('test="1" test2="2"', $mock->getHtmlProperties());

        $mock = new MockElement();
        $this->assertEquals('', $mock->getHtmlProperties());
    }

    public function testCanOpenTag() {

        //No content or children
        $mock = new MockElement();
        $tag = $mock->openTag();
        $this->assertEquals('<test />', $tag);

        //With Content, no styles
        $mock = new MockElement(["children" => ["potato"]]);
        $tag = $mock->openTag();
        $this->assertEquals('<test>', $tag);

        //With Styles
        $mock = new MockElement(["style" => ["test" => 1, "test2" => 2]]);
        $tag = $mock->openTag();
        $this->assertEquals('<test style="test:1; test2:2" />', $tag);


        //With Content & styles
        $mock = new MockElement(["children" => ["test"], "style" => ["test" => 1, "test2" => 2]]);
        $tag = $mock->openTag();
        $this->assertEquals('<test style="test:1; test2:2">', $tag);

        //With Attributes
        $mock = new MockElement(["props" => ["test" => 1, "test2" => 2]]);
        $tag = $mock->openTag();
        $this->assertEquals('<test test="1" test2="2" />', $tag);

        //With Attributes & content
        $mock = new MockElement(["children" => ["test"], "props" => ["test" => 1, "test2" => 2]]);
        $tag = $mock->openTag();
        $this->assertEquals('<test test="1" test2="2">', $tag);

        //With styles, attributes & content
        $mock = new MockElement([
            "children" => ["test"],
            "props" => ["test" => 1, "test2" => 2],
            "style" => ["test" => 1, "test2" => 2]
        ]);
        $tag = $mock->openTag();
        $this->assertEquals('<test style="test:1; test2:2" test="1" test2="2">', $tag);
    }

    public function testCanCloseTag() {
        $mock = new MockElement(["style" => [
            "test" => 1, "test2" => 2
        ]]);

        $tag = $mock->closeTag();
        $this->assertEquals("", $tag);

        $mock = new MockElement([
            "children" => ["test"],
            "style" => ["test" => 1, "test2" => 2
        ]]);

        $tag = $mock->closeTag();
        $this->assertEquals("</test>", $tag);
    }

    public function testCanGetChildrenByType() {
        $mock = new MockElement([
            "children" => [
                ["name" => "page"],
                ["name" => "page"],
                ["name" => "image"],
                ["name" => "text"],
                ["name" => "view"],
            ]
        ]);

        $items = $mock->getChildElementsByType("image");
        $this->assertTrue(count($items) === 1);
        $this->assertTrue($items[0]->getType() === "image");

        $items = $mock->getChildElementsByType("page");
        $this->assertTrue(count($items) === 2);
        $this->assertTrue($items[0]->getType() === "page");
        $this->assertTrue($items[1]->getType() === "page");
    }
}
