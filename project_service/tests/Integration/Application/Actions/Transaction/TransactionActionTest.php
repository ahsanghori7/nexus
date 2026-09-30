<?php

use Tests\TestCase;

class TransactionActionTest extends TestCase
{

    public function testTransaction()
    {
        $app = $this->getAppInstance();

        $req = $this->createRequest('GET', '/v1/transaction');
        $response = $app->handle($req);
        $this->assertEquals(200, $response->getStatusCode());

        $req = $this->createRequest('GET', '/v1/transaction/1');
        $response = $app->handle($req);
        $this->assertEquals(200, $response->getStatusCode());

        $req = $this->createRequest('GET', '/v1/transaction/1234567890123');
        $response = $app->handle($req);
        $this->assertEquals(404, $response->getStatusCode());
    }
}
