<?php
declare(strict_types=1);

namespace Tests\Domain\Account;

use App\Domain\Account\Membership;
use App\Domain\Account\Subscription;
use PHPUnit\Framework\TestCase;

class MembershipTest extends TestCase
{
    protected function tearDown(): void
    {
        parent::tearDown();
        SubscriptionStub::reset();
    }

    public function testBeforeSaveSetsDefaultsAndMergesMeta(): void
    {
        SubscriptionStub::$freeTrialId = 77;
        SubscriptionStub::$expiryDays = 30;
        SubscriptionStub::$expiryDate = '2025-01-01 00:00:00';

        $membership = (new MembershipWithStub())->setData([
            'meta' => json_encode(['existing' => true]),
        ]);

        $values = $membership->beforeSave(
            [
                'account_id' => 5,
                'meta' => ['new' => 'value'],
            ],
            ['meta' => ['new' => 'value']]
        );

        $this->assertSame(77, $values['subscription_id']);
        $this->assertSame('2025-01-01 00:00:00', $values['expires_at']);

        $meta = json_decode($values['meta'], true);
        $this->assertSame(['existing' => true, 'new' => 'value'], $meta);

        $this->assertSame([77], SubscriptionStub::$loadedIds);
    }

    public function testBeforeSaveRespectsProvidedSubscription(): void
    {
        SubscriptionStub::$freeTrialId = 77;
        $membership = new MembershipWithStub();

        $values = $membership->beforeSave(
            ['account_id' => 5, 'subscription_id' => 10],
            []
        );

        $this->assertSame(10, $values['subscription_id']);
        $this->assertSame([10], SubscriptionStub::$loadedIds);
    }

    public function testApplyFiltersAddsDateRangeClauses(): void
    {
        $membership = new MembershipWithStub();
        $sql = $membership->applyFilters(
            'SELECT * FROM membership',
            [
                'subscription_id' => 3,
                'created_at_start' => '2024-01-01',
                'created_at_end' => '2024-12-31',
            ]
        );

        $this->assertStringContainsString("subscription_id = '3'", $sql);
        $this->assertStringContainsString("CAST(created_at AS Date) >= '2024-01-01'", $sql);
        $this->assertStringContainsString("CAST(created_at AS Date) <= '2024-12-31'", $sql);
    }
}

class MembershipWithStub extends Membership
{
    public function getSubscription(): Subscription
    {
        return new SubscriptionStub();
    }
}

class SubscriptionStub extends Subscription
{
    public static int $freeTrialId = 1;
    public static int $expiryDays = 0;
    public static string $expiryDate = '2030-01-01 00:00:00';
    public static array $loadedIds = [];

    public static function reset(): void
    {
        self::$freeTrialId = 1;
        self::$expiryDays = 0;
        self::$expiryDate = '2030-01-01 00:00:00';
        self::$loadedIds = [];
    }

    public function getFreeTrialId()
    {
        return self::$freeTrialId;
    }

    public function load($id, $idField = self::ID_FIELD): static
    {
        self::$loadedIds[] = $id;
        $this->data['id'] = $id;
        return $this;
    }

    public function getExpiryDays(): int
    {
        return self::$expiryDays;
    }

    public function getExpirationDateByDays(int $days)
    {
        return self::$expiryDate;
    }
}
