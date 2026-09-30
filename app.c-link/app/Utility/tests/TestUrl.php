<?php

use App\Utility\Url;
use PHPUnit\Framework\TestCase;


class TestTender extends TestCase {

    public function testJoinSuffix() {
       $url = new Url("test");
       $this->assertEquals(
           "test/test",
           $url->get("/test")
       );

        $this->assertEquals(
            "test/test",
            $url->get("test")
        );

        $url = new Url("test/");
        $this->assertEquals(
            "test/test",
            $url->get("/test")
        );

        $this->assertEquals(
            "test/test",
            $url->get("test")
        );
    }

    public function testCanStripSlash() {
        $url = new Url("test/");
        $this->assertEquals(
            "test/test",
            $url->get("/test/")
        );

        $this->assertEquals(
            "test",
            $url->get()
        );

        $url = new Url("test/");
        $this->assertEquals(
            "test/test",
            $url->get("/test/")
        );

        $this->assertEquals(
            "test/test/",
            $url->get("/test/", true)
        );
    }
}
