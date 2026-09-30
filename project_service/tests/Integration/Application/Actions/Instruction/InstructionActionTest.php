<?php

use Tests\TestCase;

class InstructionActionTest extends TestCase
{

    public function testInstruction()
    {
        $app = $this->getAppInstance();

        $req = $this->createRequest('GET', '/v1/instruction');

        $response = $app->handle($req);
        $this->assertEquals(200, $response->getStatusCode());

        $req = $this->createRequest('GET', '/v1/instruction/1');
        $response = $app->handle($req);
        $this->assertEquals(200, $response->getStatusCode());

        $req = $this->createRequest('GET', '/v1/instruction/1234567890123');
        $response = $app->handle($req);
        $this->assertEquals(404, $response->getStatusCode());
    }
}
