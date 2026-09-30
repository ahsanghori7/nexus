<?php

    use PHPUnit\Framework\TestCase;
    use App\Models\Subscription;

    class SubscriptionTest extends TestCase
    {
        public function testIsPaid(){
            $sub = new Subscription([
                "price" => "100"
            ]);
            $this->assertTrue($sub->isPaid());

            $sub = new Subscription([
                "price" => "0"
            ]);
            $this->assertFalse($sub->isPaid());

            $sub = new Subscription([
                "price" => ""
            ]);
            $this->assertFalse($sub->isPaid());
        }

        public function testIsUpgradable() {
            $sub = new Subscription([
                "price" => "100",
            ]);
            $this->assertFalse($sub->isUpgradeable());

            $sub = new Subscription([
                "price" => "0"
            ]);
            $this->assertTrue($sub->isUpgradeable());

            $sub = new Subscription([
                "price" => "0",
                "website" => ["label" => "Clink"]
            ]);
            $this->assertTrue($sub->isUpgradeable("Clink"));

            $sub = new Subscription([
                "price" => "100",
                "website" => ["label" => "Prosper"]
            ]);
            $this->assertFalse($sub->isUpgradeable("Clink"));
        }

        public function testCanGetDescription() {
            $sub = new Subscription([
                "label" => "Test",
                "price_label" => 10
            ]);

            $this->assertEquals($sub->getDescription(), "Test | 10 GBP inc. Vat");
            $this->assertEquals($sub->getDescription("Tester"), "Tester Test | 10 GBP inc. Vat");
        }
    }
