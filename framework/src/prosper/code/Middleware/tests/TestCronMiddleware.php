<?php

use PHPUnit\Framework\TestCase;

use Core\Data\Shape;
use Core\Service\Manager;
use Core\Service\Testing\MockRestService;
use Prosper\Middleware\CronMiddleware;

Manager::addService("project", new MockRestService());
Manager::addService("account", new MockRestService());

class TestCronMiddleware extends TestCase
{
    public function getMockService(string $name) : MockRestService
    {
        $s = Manager::getService($name);
        if($s instanceof MockRestService) {
            return $s;
        }
    }

    public function testCanLoadLiveProjects() {
        $this->getMockService("project")->loadRequestFromResultMock("live_tenders", "tender", dir:__DIR__);
        $output = new Shape();
        CronMiddleware::loadLiveTenders()($output);
        $regions = $output->getShape("offerings_ids")->get("region");
        $trades  = $output->getShape("offerings_ids")->get("trade");

        $this->assertTrue(count($regions) > 0);
        $this->assertTrue(count($trades) > 0);
        $this->assertTrue(
            count($regions) === count(array_unique($regions))
        );
        $this->assertTrue(
            count($trades) === count(array_unique($trades))
        );

        $this->assertCount(24, $output->get("live_tenders"));
    }

    public function testCanMatchSubcontractors() {
        $output = new Shape([
            "subcontractors" => [
                ["account_id" => 1, "offerings" => ["trade" =>[1,2,3,4], "region" => [10, 12]]],
                ["account_id" => 2, "offerings" => ["trade" =>[2,3],     "region" => [10, 9]]],
                ["account_id" => 3, "offerings" => ["trade" =>[2, 3,4,5,6], "region" => [9, 14]]],
                ["account_id" => 4, "offerings" => ["trade" =>[1,5,7],   "region" => [2, 3, 14]]]
            ],
            "live_tenders" => [
                [
                    "region"   => 10, // Should match account id 1 only as only one to have trade
                    "packages" => [1],
                    "history"  => [],
                ],
                [
                    "region"   => 9, // Should match account id 2,3 only as both have region and package
                    "packages" => [3, 4],
                    "history"  => [],
                ],
                [
                    "region"   => 10, // Should match account id 2 only as 1 is removed due to history and id 3 does not match region
                    "packages" => [2],
                    "history"  => [1],
                ],
            ]
        ]);

        CronMiddleware::matchSubcontractors()($output);

        $matches = $output->get("matches");
        $this->assertTrue($matches[1]["opportunities"] === 1);
        $this->assertTrue($matches[2]["opportunities"] === 2);
        $this->assertTrue($matches[3]["opportunities"] === 1);
        $this->assertTrue(!isset($matches[4]));

        $sids = $output->get("sids");
        $this->assertCount(3, $sids);
    }

    public function testCanBlackListSubcontractors() {
        $output = new Shape([
            "subcontractors" => [
                ["account_id" => 1, "offerings" => ["trade" =>[1], "region" => [10]]],
                ["account_id" => 2, "offerings" => ["trade" =>[1], "region" => [10]]]
            ],
            "live_tenders" => [
                [
                    "region"   => 10,
                    "packages" => [1],
                    "history"  => [],
                ]
            ],
            "email_blacklist" => [2]
        ]);

        CronMiddleware::matchSubcontractors()($output);
        $matches = $output->get("matches");
        $this->assertTrue($matches[1]["opportunities"] === 1);
        $this->assertTrue(!isset($matches[2]));

        $sids = $output->get("sids");
        $this->assertCount(1, $sids);
    }
}
