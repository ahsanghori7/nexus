<?php

namespace App\DocCreator\Shortcode\tests;

use App\DocCreator\HtmlParser;
use PHPUnit\Framework\TestCase;

class TestHtmlParser extends TestCase
{

    public function testCanParseOuterTags(): void
    {
        $this->assertEquals("<br>", HtmlParser::parseOuterTags('{br}'));

        $this->assertEquals("<br><br>", HtmlParser::parseOuterTags('{br:2}'));

        $this->assertEquals("<br><br><br><br>", HtmlParser::parseOuterTags('{br:4}'));

        $this->assertEquals(" <br><br><br><br>", HtmlParser::parseOuterTags(' {br:4}'));

        $this->assertEquals(" <br><br><br><br> ", HtmlParser::parseOuterTags(' {br:4} '));

        $this->assertEquals("br dqs", HtmlParser::parseOuterTags('br dqs'));

        $this->assertEquals("a<br><br> my name is dan", HtmlParser::parseOuterTags('a{br:2} my name is dan'));

        $this->assertEquals("a<br><br> my name is dan <br><br><br>", HtmlParser::parseOuterTags('a{br:2} my name is dan {br:3}'));

        $this->assertEquals("a{projectName} my name is dan", HtmlParser::parseOuterTags('a{projectName} my name is dan'));

        $this->assertEquals("{projectName}<br>", HtmlParser::parseOuterTags('{projectName}{br:1}'));

        $this->assertEquals(" {br:}", HtmlParser::parseOuterTags(' {br:}'));

        $this->assertEquals(" {br:notanumber}", HtmlParser::parseOuterTags(' {br:notanumber}'));

        $this->assertEquals(" {notexist:4}", HtmlParser::parseOuterTags(' {notexist:4}'));
    }

    public function htmlParse(string $string)
    {
        $content = [$string];
        HtmlParser::parseInnerTags($content);
        $content = array_shift($content);
        return $content;
    }

    public function testCanParseInnerTags(): void
    {

        //Shortcode inside a tag
        $content = '{b:{SubContractorEmail}}';
        $this->assertEquals("<strong>{SubContractorEmail}</strong>", $this->htmlParse($content));

        //Multiple nested tags with separated tags inside a tag
        $content = '{b: {b: {b:test} } {b:s} }';
        $this->assertEquals("<strong> <strong> <strong>test</strong> </strong> <strong>s</strong> </strong>", $this->htmlParse($content));

        //Multiple nested tags wit text inbetween
        $content = '{b:{u:Invitation {b:dqs} to Tender}}aaaa{b:pr}';
        $this->assertEquals("<strong><u>Invitation <strong>dqs</strong> to Tender</u></strong>aaaa<strong>pr</strong>", $this->htmlParse($content));

        //Multiple nested tags
        $content = '{b:{u:Invitation {b:{b:d{em:test}}{b:q}{u:s}} to Tender}}{b:pr}';
        $this->assertEquals("<strong><u>Invitation <strong><strong>d<em>test</em></strong><strong>q</strong><u>s</u></strong> to Tender</u></strong><strong>pr</strong>", $this->htmlParse($content));

        $this->assertEquals("<strong> <strong> <strong>test</strong> </strong> <strong>s</strong> </strong>", $this->htmlParse('{b: {b: {b:test} } {b:s} }'));

        //no tags
        $content = 'dqs potato';
        $this->assertEquals("dqs potato", $this->htmlParse($content));

        //no tags but curly bracket
        $content = 'dqs potato {mega} potato sdds';
        $this->assertEquals("dqs potato {mega} potato sdds", $this->htmlParse($content));

        //Multiple nested tags
        $content = '{b:{u:Invitation {b:{b:d{em:test}}{b:q}{u:s}} to Tender}}{b:pr}';
        $this->assertEquals("<strong><u>Invitation <strong><strong>d<em>test</em></strong><strong>q</strong><u>s</u></strong> to Tender</u></strong><strong>pr</strong>", $this->htmlParse($content));

        //Multiple nested tags wit text inbetween
        $content = '{b:{u:Invitation {b:dqs} to Tender}}aaaa{b:pr}';
        $this->assertEquals("<strong><u>Invitation <strong>dqs</strong> to Tender</u></strong>aaaa<strong>pr</strong>", $this->htmlParse($content));

        //multiple nested tags with text after the first tag
        $content = '{em:dqs{b:potato {u:robert {u: dean}}}}';
        $this->assertEquals("<em>dqs<strong>potato <u>robert <u> dean</u></u></strong></em>", $this->htmlParse($content));

        //Multiple nested tags with text outside of the tag
        $content = '{b:{u:Invitation {b:dqs} to Tender}}{b:pr} dan';
        $this->assertEquals("<strong><u>Invitation <strong>dqs</strong> to Tender</u></strong><strong>pr</strong> dan", $this->htmlParse($content));

        //multiple nested tags with text after the first tag text outside of the tag
        $content = '{em:dqs{b:potato {u:robert {u: dean}}}} test';
        $this->assertEquals("<em>dqs<strong>potato <u>robert <u> dean</u></u></strong></em> test", $this->htmlParse($content));

        //single tag with text after
        $content = '{em:dqs} potato';
        $this->assertEquals("<em>dqs</em> potato", $this->htmlParse($content));

        //single tag with text with dot separator
        $content = '{b:E: dqs}';
        $this->assertEquals("<strong>E: dqs</strong>", $this->htmlParse($content));

        //single tag with text with dot separator and text before
        $content = 'before {b:E: dqs}';
        $this->assertEquals("before <strong>E: dqs</strong>", $this->htmlParse($content));

        //single tag with text with dot separator and text after
        $content = '{b:E: dqs} potato';
        $this->assertEquals("<strong>E: dqs</strong> potato", $this->htmlParse($content));

        //single tag with text with dot separator and text after and before
        $content = 'before {b:E: dqs} potato';
        $this->assertEquals("before <strong>E: dqs</strong> potato", $this->htmlParse($content));

        //multiple tags
        $content = '{b:my name is dan}{b:my name is potato}';
        $this->assertEquals("<strong>my name is dan</strong><strong>my name is potato</strong>", $this->htmlParse($content));

        //multiple tags wit text inbetween
        $content = '{b:my name is dan} potato {b:my name is potato}';
        $this->assertEquals("<strong>my name is dan</strong> potato <strong>my name is potato</strong>", $this->htmlParse($content));

        //tag not exist
        $content = '{tagnotfound:potato major}';
        $this->assertEquals("{tagnotfound:potato major}", $this->htmlParse($content));

        //tags not exist
        $content = '{tagnotfound:potato major}{potato:dqs}';
        $this->assertEquals("{tagnotfound:potato major}{potato:dqs}", $this->htmlParse($content));

    }

}
