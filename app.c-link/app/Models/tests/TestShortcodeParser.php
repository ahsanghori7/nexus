<?php


use App\Models\Shortcode\Parser;
use PHPUnit\Framework\TestCase;

class TestShortcodeParser extends TestCase
{

    public function testCanParseMoneyValue() {
        $value = Parser::parse("money", "£100,000.00");
        $this->assertEquals($value, 10000000);

        $value = Parser::parse("money", "£299.00");
        $this->assertEquals($value, 29900);

        $value = Parser::parse("money", "£299");
        $this->assertEquals($value, 29900);
    }

    public function testIgnoreNoMap()
    {
        $value = Parser::parse("no_mapping", "tester");
        $this->assertEquals($value, "tester");

        $value = Parser::parse("no_mapping", 100);
        $this->assertEquals($value, 100);

        $value = Parser::parse("no_mapping", null);
        $this->assertEquals($value, null);
    }

}
