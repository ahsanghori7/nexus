<?php
declare(strict_types=1);

namespace Tests\Domain\Account;

use App\Domain\AbstractTypeModel;
use App\Domain\Account\Subscription;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

final class SubscriptionTest extends TestCase
{
    private array $originalTypeCache = [];

    protected function setUp(): void
    {
        parent::setUp();
        DB::addConnection('r', FakeRedBean::class);
        FakeRedBean::reset();
        $this->originalTypeCache = $this->readTypeCache();
    }

    protected function tearDown(): void
    {
        FakeRedBean::reset();
        $this->writeTypeCache($this->originalTypeCache);
        parent::tearDown();
    }

    public function testGetFreeTrialIdReturnsConfiguredLabel(): void
    {
        $this->writeTypeCache([
            Subscription::class => [
                5 => ['id' => 5, 'label' => 'Free Trial'],
                6 => ['id' => 6, 'label' => 'Enterprise'],
            ],
        ]);

        $subscription = new Subscription();
        self::assertSame(5, $subscription->getFreeTrialId());
    }

    public function testGetExpiryDaysReturnsStoredValueOrDefault(): void
    {
        $subscription = new Subscription();
        $subscription->setData(['expires' => 14]);
        self::assertSame(14, $subscription->getExpiryDays());

        $subscription = new Subscription();
        self::assertSame(0, $subscription->getExpiryDays());
    }

    public function testGetExpirationDateByDaysAdvancesClock(): void
    {
        $subscription = new Subscription();
        $result = $subscription->getExpirationDateByDays(3);

        $expected = new \DateTimeImmutable('+3 days');
        $actual = new \DateTimeImmutable($result);

        self::assertEqualsWithDelta($expected->getTimestamp(), $actual->getTimestamp(), 2);
    }

    public function testAfterLoadHydratesWebsiteChild(): void
    {
        FakeRedBean::$getRowHook = static function (string $sql, array $params) {
            if (str_contains($sql, 'FROM subscription')) {
                return [
                    'id' => $params[0],
                    'website_id' => 9,
                    'label' => 'Free Trial',
                    'price' => 0,
                    'price_label' => 'Free',
                    'interval_type' => 'month',
                    'interval_unit' => 'm',
                    'interval_amount' => '1',
                ];
            }

            if (str_contains($sql, 'FROM website')) {
                return [
                    'id' => 9,
                    'label' => 'Portal',
                    'url' => 'https://portal.test',
                ];
            }

            return null;
        };

        $subscription = (new Subscription())->load(5);

        $website = $this->readObjectProperty($subscription, 'children')['website'] ?? null;
        self::assertNotNull($website);
        self::assertSame(9, $website->getId());
        self::assertSame('https://portal.test', $website->getData('url'));
    }

    /**
     * @return array<string,array>
     */
    private function readTypeCache(): array
    {
        $ref = new \ReflectionClass(AbstractTypeModel::class);
        $prop = $ref->getProperty('cache');
        $prop->setAccessible(true);
        /** @var array<string,array> $cache */
        $cache = $prop->getValue();
        return $cache ?? [];
    }

    private function writeTypeCache(array $cache): void
    {
        $ref = new \ReflectionClass(AbstractTypeModel::class);
        $prop = $ref->getProperty('cache');
        $prop->setAccessible(true);
        $prop->setValue(null, $cache);
    }

    /**
     * @return array<string,mixed>
     */
    private function readObjectProperty(object $object, string $property): array
    {
        $ref = new \ReflectionProperty($object, $property);
        $ref->setAccessible(true);
        return (array) $ref->getValue($object);
    }
}
