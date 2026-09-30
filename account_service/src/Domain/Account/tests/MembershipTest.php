<?php

    use \App\Domain\Account\Subscription;
    use \App\Domain\Account\Membership;

    class MockSubscription extends Subscription
    {
        const ID_FIELD = "id";

        /**
         * Sub method for getting the id of the free trial subscription
         * @return int
         */
        public function getFreeTrialId(): int
        {
            return 1;
        }

        public function load($id, $idField = self::ID_FIELD) {
            $this->data[$idField] = $id;
            return $this;
        }
    }

    /**
     * Class MockMembership
     * Mock DB Elements of membership class for testing
     */
    class MockMembership extends Membership
    {
        public function getSubscription()
        {
            return new MockSubscription();
        }

        public function setMeta($meta) {
            $this->data["meta"] = $meta;
        }
    }

    class AccountTest extends \PHPUnit\Framework\TestCase
    {
        public function testCanSetDefaultSubIdJsonBeforeSave()
        {
            $membership = new MockMembership();
            $values = $membership->beforeSave([]);
            $this->assertEquals(1, $values["subscription_id"]);
        }

        public function testCanParseJsonBeforeSave()
        {
            $membership = new MockMembership();
            $values = $membership->beforeSave([
                "meta" => ["test" => 1]
            ]);

            $json = json_decode($values["meta"]);
            $this->assertTrue(is_object($json));
            $this->assertEquals($json->test, 1);
        }

        public function testCanMergeJsonBeforeSave()
        {
            $membership = new MockMembership();
            $membership->setMeta(json_encode(["tester" => 2, "test" => 11]));
            $values = $membership->beforeSave([
                "meta" => ["test" => 1]
            ]);

            $json = json_decode($values["meta"]);
            $this->assertTrue(is_object($json));
            $this->assertEquals($json->test, 1);
            $this->assertEquals($json->tester, 2);
        }
    }
