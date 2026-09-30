<?php

namespace Infrastructure;

use App\core\Config;
use App\DocCreator\Signatory\Signatory;
use App\Models\Document;
use App\Models\UserModel;
use PHPUnit\Framework\TestCase;

class SignatoryTest extends TestCase
{

    /**
     * @var array
     */
    protected array $config;

    protected function setUp(): void
    {

        $this->config = [
            'host'             => Config::get("signatory.docusign.host"),
            'integration_key'  => Config::get("signatory.docusign.auth.integration_key"),
            'account_id'       => Config::get("signatory.docusign.auth.account_id"),
            'user_id'          => Config::get("signatory.docusign.auth.user_id"),
            'private_key_file' => Config::get("signatory.docusign.auth.private_key_file"),
            'scope'            => Config::get("signatory.docusign.auth.scope"),
            'base_path'        => Config::get("signatory.docusign.auth.base_path"),
            'save_path'        => Config::get("signatory.docusign.save.path")
        ];
    }

    protected function init()
    {
        $signatory = new Signatory();
        $signatory->setConfig($this->config);
        return $signatory;
    }

    public function testIsValidService()
    {
        $signatory = $this->init();
        $service = 'dqs';
        $this->assertFalse($signatory->isValidService($service));


        $signatory = $this->init();
        $service = '';
        $this->assertFalse($signatory->isValidService($service));


        $signatory = $this->init();
        $service = 'docusign';
        $this->assertTrue($signatory->isValidService($service));
    }

    public function testGetService()
    {
        $signatory = $this->init();
        $service = $signatory->setService("docusign");
        $this->assertEquals(get_class($service), "App\DocCreator\Signatory\Service\Docusign");
    }

    public function testGetGetAccessToken()
    {
        $signatory = $this->init();
        $service = $signatory->setService("docusign");
        $this->assertTrue(($service->getAccessToken() != ""));


        $signatory = $this->init();
        $this->expectException(\Exception::class);
        $signatory->setService("dqs");
    }

    public function testAddDocument()
    {
        $doc = [
            [
                'name' => 'test',
                'path' => __DIR__ . "/test.pdf"
            ]
        ];
        $signatory = $this->init();
        $service = $signatory->setService("docusign");
        $service->addDocument((new Document($doc[0])), $doc[0]['path']);
        $this->assertCount(1, $service->getDocuments());



        $doc = [
            [
                'name' => 'test',
                'path' => __DIR__ . "/test.pdf"
            ],
            [
                'name' => 'test',
                'path' => __DIR__ . "/test.pdf"
            ]
        ];
        $signatory = $this->init();
        $service = $signatory->setService("docusign");
        $service->addDocument((new Document($doc[0])), $doc[0]['path']);
        $service->addDocument((new Document($doc[1])), $doc[1]['path']);
        $this->assertCount(2, $service->getDocuments());



        $doc = [
            [
                'name' => 'file not found',
                'path' => __DIR__ . "/file not found.pdf"
            ]
        ];
        $signatory = $this->init();
        $service = $signatory->setService("docusign");
        $this->expectException(\Exception::class);
        $service->addDocument((new Document($doc[0])), $doc[0]['path']);
    }

    public function testAddSigner()
    {
        $signatory = $this->init();
        $service = $signatory->setService("docusign");
        $userModel = new UserModel([
            'name'  => 'Dan',
            'email' => 'dev@c-link.com',
        ], 1);
        $service->addSigner($userModel);
        $this->assertCount(1, $service->getSigners());



        $signatory = $this->init();
        $service = $signatory->setService("docusign");
        $userModel = new UserModel([
            'name'  => 'Dan',
            'email' => 'dev@c-link.com',
        ], 1);
        $service->addSigner($userModel);
        $userModel = new UserModel([
            'name'  => 'Dan1',
            'email' => 'dev1@c-link.com',
        ], 2);
        $service->addSigner($userModel);
        $this->assertCount(2, $service->getSigners());
    }

    public function testGetSigner()
    {
        $signatory = $this->init();
        $service = $signatory->setService("docusign");
        $userModel = new UserModel([
            'firstname' => 'Dan',
            'lastname'  => 'DQS',
            'email'     => 'dev@c-link.com',
        ], 1);
        $service->addSigner($userModel);

        $this->assertEquals("dev@c-link.com", $service->getSigner()->getEmail());
        $this->assertEquals("Dan DQS", $service->getSigner()->getName());
        $this->assertEquals(1, $service->getSigner()->getUserId());
        $this->assertEquals(1, $service->getSigner()->getRecipientId());

    }

}
