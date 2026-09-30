<?php
declare(strict_types=1);

namespace Tests\Domain\Feature;

use App\Domain\Feature\FeatureRepository;
use PHPUnit\Framework\TestCase;

final class FeatureRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        FeatureModelSpy::reset();
        FeatureRepositoryDbDouble::reset();
    }

    public function testFindAllReturnsModelRowsUnchanged(): void
    {
        $repository = new class extends FeatureRepository {
            protected $models = [
                'feature' => FeatureModelSpy::class,
            ];
        };
        $filters = ['active' => 1];

        $result = $repository->findAll($filters, 25, 5);

        $this->assertSame(FeatureModelSpy::$result, $result);
        $this->assertSame([[
            'filters' => $filters,
            'limit' => 25,
            'offset' => 5,
        ]], FeatureModelSpy::$calls);
    }

    public function testGetFeaturesQueriesFeatureTable(): void
    {
        FeatureRepositoryDbDouble::queueGetAllResponse([
            ['id' => 7, 'name' => 'FeatureFlag'],
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getFeatures();

        $this->assertSame([['id' => 7, 'name' => 'FeatureFlag']], $result);
        $this->assertSame(['SELECT * from feature'], FeatureRepositoryDbDouble::$getAllCalls);
    }

    public function testGetAccountsWithFeaturesAddsAccountFilter(): void
    {
        FeatureRepositoryDbDouble::queueGetAllResponse([
            ['account_id' => 2, 'feature' => 'Reporting'],
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getAccountsWithFeatures(2);

        $this->assertSame([['account_id' => 2, 'feature' => 'Reporting']], $result);
        $this->assertStringContainsString('FROM account_features', FeatureRepositoryDbDouble::$getAllCalls[0]);
        $this->assertStringContainsString('account_features_mapping', FeatureRepositoryDbDouble::$getAllCalls[0]);
        $this->assertStringContainsString('WHERE account_features.account_id = 2', FeatureRepositoryDbDouble::$getAllCalls[0]);
    }

    public function testGetAccountEnvelopesReturnsFirstResult(): void
    {
        FeatureRepositoryDbDouble::queueGetAllResponse([
            ['id' => 10, 'account_id' => 15],
            ['id' => 11, 'account_id' => 15],
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $result = $repository->getAccountEnvelopes(15);

        $this->assertSame(['id' => 10, 'account_id' => 15], $result);
        $this->assertSame(['SELECT * FROM envelope WHERE account_id = 15'], FeatureRepositoryDbDouble::$getAllCalls);
    }

    public function testUpdateEnvelopesInsertsWhenNoExistingEnvelope(): void
    {
        FeatureRepositoryDbDouble::queueGetAllResponse([]);
        $repository = $this->createRepositoryWithQueryModels();

        $repository->updateEnvelopes(8, [
            'current' => 4,
            'envelopes' => 9,
            'period' => 'weekly',
        ]);

        $this->assertSame(['SELECT * from envelope where account_id = 8'], FeatureRepositoryDbDouble::$getAllCalls);
        $this->assertSame([
            "INSERT INTO envelope (account_id, current, envelopes, period) VALUES (8, 4, 9, 'weekly')",
        ], FeatureRepositoryDbDouble::$execCalls);
    }

    public function testUpdateEnvelopesUpdatesExistingRow(): void
    {
        FeatureRepositoryDbDouble::queueGetAllResponse([
            ['id' => 5, 'account_id' => 8],
        ]);
        $repository = $this->createRepositoryWithQueryModels();

        $repository->updateEnvelopes(8, [
            'current' => 2,
            'envelopes' => 6,
            'period' => 'monthly',
        ]);

        $this->assertSame([
            "UPDATE envelope SET current = 2, envelopes = 6, period = 'monthly' WHERE account_id = 8",
        ], FeatureRepositoryDbDouble::$execCalls);
    }

    public function testUpdateAccountsFeaturesReturnsInsertIds(): void
    {
        FeatureRepositoryDbDouble::queueLastInsertId(34);
        FeatureRepositoryDbDouble::queueLastInsertId(57);
        $repository = $this->createRepositoryWithQueryModels();

        $ids = $repository->updateAccountsFeatures([5, 9]);

        $this->assertSame([34, 57], $ids);
        $this->assertSame([
            "INSERT INTO account_features (account_id) VALUES (5)",
            "INSERT INTO account_features (account_id) VALUES (9)",
        ], FeatureRepositoryDbDouble::$execCalls);
    }

    public function testDeleteAccountsFeaturesIssuesDeleteStatement(): void
    {
        $repository = $this->createRepositoryWithQueryModels();

        $repository->deleteAccountsFeatures(44);

        $this->assertSame([
            "DELETE FROM account_features WHERE id = 44",
        ], FeatureRepositoryDbDouble::$execCalls);
    }

    public function testUpdateAccountsFeaturesMappingWritesMapping(): void
    {
        $repository = $this->createRepositoryWithQueryModels();

        $repository->updateAccountsFeaturesMapping(13, 29);

        $this->assertSame([
            "INSERT INTO account_features_mapping (account_features_id, feature_id) VALUES (13,29)",
        ], FeatureRepositoryDbDouble::$execCalls);
    }

    private function createRepositoryWithQueryModels(): FeatureRepository
    {
        return new class extends FeatureRepository {
            protected $models = [
                'feature' => FeatureTableModelDouble::class,
                'account_features' => AccountFeaturesTableModelDouble::class,
                'account_features_mapping' => AccountFeaturesMappingTableModelDouble::class,
                'envelope' => EnvelopeTableModelDouble::class,
            ];
        };
    }
}

final class FeatureModelSpy
{
    public static array $calls = [];
    public static array $result = [
        ['id' => 1, 'name' => 'Beta'],
    ];

    public static function reset(): void
    {
        self::$calls = [];
        self::$result = [
            ['id' => 1, 'name' => 'Beta'],
        ];
    }

    public function findAll(array $filters = [], int $limit = 0, int $offset = 0): array
    {
        self::$calls[] = [
            'filters' => $filters,
            'limit' => $limit,
            'offset' => $offset,
        ];
        return self::$result;
    }
}

final class FeatureRepositoryDbDouble
{
    public static array $getAllCalls = [];
    public static array $getAllResponses = [];
    public static array $execCalls = [];
    private static array $lastInsertIds = [];

    public static function reset(): void
    {
        self::$getAllCalls = [];
        self::$getAllResponses = [];
        self::$execCalls = [];
        self::$lastInsertIds = [];
    }

    public static function queueGetAllResponse(array $rows): void
    {
        self::$getAllResponses[] = $rows;
    }

    public static function queueLastInsertId(int $id): void
    {
        self::$lastInsertIds[] = $id;
    }

    public static function getAll(string $query): array
    {
        self::$getAllCalls[] = $query;
        if (!self::$getAllResponses) {
            return [];
        }
        return array_shift(self::$getAllResponses);
    }

    public static function exec(string $query): void
    {
        self::$execCalls[] = $query;
    }

    public static function getDatabaseAdapter(): object
    {
        return new class {
            public function getDatabase(): object
            {
                return new class {
                    public function getPDO(): object
                    {
                        return new class {
                            public function lastInsertId(): int
                            {
                                return FeatureRepositoryDbDouble::nextInsertId();
                            }
                        };
                    }
                };
            }
        };
    }

    public static function nextInsertId(): int
    {
        return self::$lastInsertIds ? array_shift(self::$lastInsertIds) : 0;
    }
}

final class FeatureTableModelDouble
{
    public function getName(): string
    {
        return 'feature';
    }

    public function getDb(): string
    {
        return FeatureRepositoryDbDouble::class;
    }
}

final class AccountFeaturesTableModelDouble
{
    public function getName(): string
    {
        return 'account_features';
    }

    public function getDb(): string
    {
        return FeatureRepositoryDbDouble::class;
    }
}

final class AccountFeaturesMappingTableModelDouble
{
    public function getName(): string
    {
        return 'account_features_mapping';
    }

    public function getDb(): string
    {
        return FeatureRepositoryDbDouble::class;
    }
}

final class EnvelopeTableModelDouble
{
    public function getName(): string
    {
        return 'envelope';
    }

    public function getDb(): string
    {
        return FeatureRepositoryDbDouble::class;
    }
}
