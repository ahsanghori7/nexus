<?php
declare(strict_types=1);

namespace Tests\Domain\Account\SupplyChain;

use App\Domain\Account\Account;
use App\Domain\Account\SupplyChain;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

final class SupplyChainDataAccessTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::addConnection('r', FakeRedBean::class);
        FakeRedBean::reset();
    }

    protected function tearDown(): void
    {
        FakeRedBean::reset();
        parent::tearDown();
    }

    public function testGetSelectBuildsJoinedQuery(): void
    {
        $chain = new SupplyChain();

        $sql = $chain->getSelect();

        $this->assertStringContainsString('SELECT sub.*, u.id as user_id', $sql);
        $this->assertStringContainsString('FROM supply_chain s', $sql);
        $this->assertStringContainsString('join account sub on sub.id = s.child_id', $sql);
        $this->assertStringContainsString('join user u on u.account_id = sub.id', $sql);
    }

    public function testMapRegionsFetchesMappingsAndAnnotatesTradeEntries(): void
    {
        $chain = new SupplyChain();
        $this->setInternalState($chain, 'data', [
            ['parent_id' => 7],
        ]);
        $this->setInternalState($chain, 'tradeIndex', [
            2 => [
                ['id' => 10, 'name' => 'Alpha'],
                ['id' => 11, 'name' => 'Beta'],
            ],
        ]);

        $repo = new class([10 => ['North'], 11 => ['South']]) extends \App\Domain\Region\RegionRepository {
            public array $calls = [];

            public function __construct(private array $mappings)
            {
            }

            public function getMappings(array $ids, string $type, ?int $gid = null): array
            {
                $this->calls[] = [$ids, $type, $gid];
                return $this->mappings;
            }
        };

        $chain->mapRegions($repo);

        $tradeIndex = $this->getInternalState($chain, 'tradeIndex');
        $this->assertSame(['North'], $tradeIndex[2][0]['region']);
        $this->assertSame(['South'], $tradeIndex[2][1]['region']);
        $this->assertSame([[ [10, 11], 'supply_chain', 7 ]], $repo->calls);
    }

    public function testMapRegionsSkipsWhenNoParentOrChildren(): void
    {
        $chain = new SupplyChain();
        $this->setInternalState($chain, 'data', []);
        $this->setInternalState($chain, 'tradeIndex', []);

        $repo = new class extends \App\Domain\Region\RegionRepository {
            public bool $called = false;

            public function getMappings(array $ids, string $type, ?int $gid = null): array
            {
                $this->called = true;
                return [];
            }
        };

        $chain->mapRegions($repo);
        $this->assertFalse($repo->called);
    }

    public function testMapTradesCapturesFailuresAndPersistsSuccesses(): void
    {
        $chain = new RecordingSupplyChain();
        $chain->tradeIdsThatFail = [3];

        $failures = [];
        $chain->mapTrades(7, 9, [3, 4], $failures);

        $this->assertSame(
            [
                ['parent_id' => 7, 'child_id' => 9, 'trade_id' => 4],
            ],
            $chain->payloads
        );
        $this->assertSame([3], $failures);
    }

    public function testExistsReturnsTrueWhenRowFound(): void
    {
        FakeRedBean::$getRowHook = static function (string $sql, array $params) {
            if (str_contains($sql, 'WHERE parent_id = ? AND child_id = ?')) {
                return ['id' => 1];
            }
            return null;
        };

        $chain = new SupplyChain();
        self::assertTrue($chain->exists(1, 2));
    }

    public function testExistsReturnsFalseWhenNoRow(): void
    {
        FakeRedBean::$getRowHook = static fn () => [];
        $chain = new SupplyChain();
        self::assertFalse($chain->exists(1, 2));
    }

    public function testLoadByAccountHydratesAccountsAndUsers(): void
    {
        FakeRedBean::$getAllHook = static function (string $sql): array {
            if (!str_contains($sql, 'WHERE s.parent_id = 5')) {
                throw new \RuntimeException('Unexpected query: ' . $sql);
            }

            return [
                [
                    'id' => 10,
                    'parent_id' => 5,
                    'child_id' => 10,
                    'trade_id' => 99,
                    'type_id' => 3,
                    'logo' => 'logo.png',
                    'meta' => json_encode([
                        5 => [
                            'user' => [
                                'id' => 900,
                                'firstname' => 'Meta',
                                'lastname' => 'User',
                            ],
                        ],
                    ]),
                    'user_id' => 101,
                    'firstname' => 'Paula',
                    'lastname' => 'Plum',
                    'display_name' => 'Paula P',
                    'user_email' => 'paula@example.com',
                ],
                [
                    'id' => 11,
                    'parent_id' => 5,
                    'child_id' => 11,
                    'trade_id' => 45,
                    'type_id' => 2,
                    'logo' => 'other.png',
                    'meta' => json_encode([]),
                    'user_id' => 102,
                    'firstname' => 'Oscar',
                    'lastname' => 'Orange',
                    'display_name' => 'Oscar O',
                    'user_email' => 'oscar@example.com',
                ],
                [
                    'id' => 11,
                    'parent_id' => 5,
                    'child_id' => 11,
                    'trade_id' => 46,
                    'type_id' => 2,
                    'logo' => 'other.png',
                    'meta' => json_encode([]),
                    'user_id' => 103,
                    'firstname' => 'Tina',
                    'lastname' => 'Teal',
                    'display_name' => 'Tina T',
                    'user_email' => 'tina@example.com',
                ],
            ];
        };

        $account = (new Account())->setData(['id' => 5]);
        $chain = new SupplyChain();
        $chain->loadByAccount($account);

        $data = $chain->getData();
        $this->assertArrayHasKey(10, $data);
        $this->assertArrayHasKey(11, $data);
        $this->assertSame([99], $data[10]['trades']);
        $this->assertSame([45, 46], $data[11]['trades']);
        $this->assertArrayHasKey('users', $data[11]);
        $this->assertArrayHasKey(102, $data[11]['users']);
        $this->assertSame('oscar@example.com', $data[11]['users'][102]['user_email']);

        $tradeIndex = $chain->getTradeIndex();
        $this->assertArrayHasKey(45, $tradeIndex);
        $this->assertSame(11, $tradeIndex[45][0]['id']);
    }

    public function testGetSupplyChainAccountsByParentIdBuildsQueryWithFilters(): void
    {
        $capturedSql = null;
        FakeRedBean::$getAllHook = static function (string $sql) use (&$capturedSql): array {
            $capturedSql = $sql;
            return [['id' => 42]];
        };

        $chain = new SupplyChain();
        $result = $chain->getSupplyChainAccountsByParentId(
            7,
            limit: 10,
            offset: 5,
            groupIds: [1, 2],
            attributes: ['test_types' => [3, 4]],
            term: 'search',
            orderBy: 'company',
            order: 1
        );

        $this->assertSame([['id' => 42]], $result);
        $this->assertNotNull($capturedSql);
        $this->assertStringContainsString('WHERE sc.parent_id = 7', $capturedSql);
        $this->assertStringContainsString('AND sc.child_id IN (1,2)', $capturedSql);
        $this->assertStringContainsString("att2.label LIKE '%search%'", $capturedSql);
    }

    public function testGetCollectionCountReturnsInteger(): void
    {
        FakeRedBean::$getRowHook = static fn () => ['count' => '12'];

        $chain = new SupplyChain();
        $count = $chain->getCollectionCount(9, ['trades' => [1, 2]], 'term');

        $this->assertSame(12, $count);
    }

    /**
     * @template T of object
     * @param T $object
     * @return mixed
     */
    private function getInternalState(object $object, string $property)
    {
        $ref = new \ReflectionProperty($object, $property);
        $ref->setAccessible(true);
        return $ref->getValue($object);
    }

    /**
     * @template T of object
     * @param T $object
     * @param mixed $value
     */
    private function setInternalState(object $object, string $property, $value): void
    {
        $ref = new \ReflectionProperty($object, $property);
        $ref->setAccessible(true);
        $ref->setValue($object, $value);
    }
}

final class RecordingSupplyChain extends SupplyChain
{
    public array $payloads = [];
    public array $tradeIdsThatFail = [];

    public function save(array $data, $insertOnly = false)
    {
        if (in_array($data['trade_id'], $this->tradeIdsThatFail, true)) {
            throw new \RuntimeException('Save failed for trade ' . $data['trade_id']);
        }
        $this->payloads[] = $data;
        return $this;
    }
}
