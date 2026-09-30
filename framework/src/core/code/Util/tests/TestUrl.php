<?php

use PHPUnit\Framework\TestCase;

use Core\Util\Url;

class TestUrl extends TestCase
{
    /**
     * @return void
     */
    public function testCanHost() : void {
        $url = new Url("http://google.com/test/url/one");
        $this->assertEquals($url->getHost(), "google.com");
    }

    /**
     * @return void
     */
    public function testCanScheme() : void {
        $url = new Url("http://google.com/test/url/one");
        $this->assertEquals($url->getScheme(), "http");
    }

    /**
     * @return void
     */
    public function testCanGetUri() : void {
        $url = new Url("http://google.com/test/url/one");
        $this->assertEquals($url->getUri(0), "test");
        $this->assertEquals($url->getUri(1), "url");
        $this->assertEquals($url->getUri(2), "one");
        $this->assertEquals($url->getUri(3), null);
    }

    /**
     * @return void
     */
    public function testCanGetArguments() : void {
        $url = new Url("http://google.com/test/url/one");
        $empty = $url->getArguments();
        $this->assertCount(0, $empty);

        $url = new Url("http://google.com/test/url/one?test=one&test_two=2");
        $args = $url->getArguments();
        $this->assertCount(2, $args);
    }
}
