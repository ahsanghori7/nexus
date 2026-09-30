<?php

use PHPUnit\Framework\TestCase;
use App\Api\Client\Request;

class MockRequest extends Request {

    public function setInfo(array $info) {
        $this->info = $info;
    }

    public function setResponse($response) {
        $this->response = $response;
    }
}

class TestRequest extends TestCase
{

    public function testDoesHaveStatus() {
        $r = new MockRequest("/");
        $r->setInfo(["http_code" => 203]);
        $this->assertTrue($r->hasStatus(203));
        $this->assertFalse($r->hasStatus(200));
    }

    public function testCanJudgeSuccess() {
        $r = new MockRequest("/");
        $r->setInfo(["http_code" => 203]);
        $this->assertTrue($r->isSuccess());

        $r->setInfo(["http_code" => 200]);
        $this->assertTrue($r->isSuccess());

        $r->setInfo(["http_code" => 300]);
        $this->assertFalse($r->isSuccess());

        $r->setInfo(["http_code" => 199]);
        $this->assertFalse($r->isSuccess());
    }

    public function testCanGetInfoByKey() {
        $r = new MockRequest("/");
        $r->setInfo(["http_code" => 203]);
        $this->assertEquals($r->getInfo("http_code"), 203);
    }

    public function testCanGetBodyByType() {
        $r = new MockRequest("/");
        $r->setData(["test" => 1]);
        $this->assertEquals($r->getBody(), '{"test":1}');

        $r->setHeader("Content-Type", "application/x-www-form-urlencoded");
        $this->assertEquals($r->getBody(), 'test=1');
    }


}
