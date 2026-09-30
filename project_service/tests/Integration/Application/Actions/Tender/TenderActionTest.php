<?php

use Tests\TestCase;

class TenderActionTest extends TestCase
{

    public function testTender()
    {
        $app = $this->getAppInstance();

        $req = $this->createRequest('GET', '/v1/tender');
        $response = $app->handle($req);
        $this->assertEquals(200, $response->getStatusCode());

        $req = $this->createRequest('GET', '/v1/tender/27279');
        $response = $app->handle($req);
        $this->assertEquals(200, $response->getStatusCode());

        $req = $this->createRequest('GET', '/v1/tender/1234567890123');
        $response = $app->handle($req);
        $this->assertEquals(404, $response->getStatusCode());
    }
}
