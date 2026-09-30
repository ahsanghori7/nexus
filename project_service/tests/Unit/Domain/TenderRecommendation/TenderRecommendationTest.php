<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\TenderRecommendation;

use App\Domain\TenderRecommendation\TenderPricingSummary;
use App\Domain\TenderRecommendation\TenderRecommendation;
use PHPUnit\Framework\TestCase;

class FakeDb
{
    public static array $selectCalls = [];
    public static array $updateCalls = [];
    public static int $updateResult = 1;

    public static function reset(): void
    {
        self::$selectCalls = [];
        self::$updateCalls = [];
        self::$updateResult = 1;
    }

    public static function select(string $sql, array $params = []): array
    {
        self::$selectCalls[] = [$sql, $params];
        return [['rows' => 'result']];
    }

    public static function update(string $sql, array $params): int
    {
        self::$updateCalls[] = [$sql, $params];
        return self::$updateResult;
    }
}

class TenderRecommendationTest extends TestCase
{
    protected function setUp(): void
    {
        FakeDb::reset();
    }

    public function testGetByProjectIdBuildsQuery(): void
    {
        $model = new class extends TenderRecommendation {
            public function getDb()
            {
                return FakeDb::class;
            }
        };

        $result = $model->getByProjectId(42);

        self::assertSame([['rows' => 'result']], $result);
        self::assertCount(1, FakeDb::$selectCalls);
        self::assertStringContainsString('WHERE p.id = 42', FakeDb::$selectCalls[0][0]);
    }

    public function testGetByProjectAndIdFiltersByBothIds(): void
    {
        $model = new class extends TenderRecommendation {
            public function getDb()
            {
                return FakeDb::class;
            }
        };

        $model->getByProjectAndId(9, 3);

        self::assertStringContainsString('WHERE tr.id = 3 AND p.id = 9', FakeDb::$selectCalls[0][0]);
    }

    public function testGetActiveRecommendationsExcludesCancelled(): void
    {
        $model = new class extends TenderRecommendation {
            public function getDb()
            {
                return FakeDb::class;
            }
        };

        $model->getActiveRecommendationsByProject(11);

        self::assertStringContainsString('tr.tender_id = 11', FakeDb::$selectCalls[0][0]);
        self::assertStringContainsString("LOWER(tr.status) != 'cancelled'", FakeDb::$selectCalls[0][0]);
    }

    public function testGetRecommendationStatusByProjectUsesParameterisedQuery(): void
    {
        $model = new class extends TenderRecommendation {
            public function getDb()
            {
                return FakeDb::class;
            }
        };

        $model->getRecommendationStatusByProject(77);

        self::assertSame([77], FakeDb::$selectCalls[0][1]);
    }
}

class TenderPricingSummaryTest extends TestCase
{
    protected function setUp(): void
    {
        FakeDb::reset();
    }

    public function testGetQuotesByPackageBuildsQueryAndParams(): void
    {
        $model = new class extends TenderPricingSummary {
            public function getDb()
            {
                return FakeDb::class;
            }
        };

        $model->getQuotesByPackage(5, 9);

        self::assertCount(1, FakeDb::$selectCalls);
        self::assertSame(['package_id' => 9, 'project_id' => 5], FakeDb::$selectCalls[0][1]);
        self::assertStringContainsString('pkg.id = :package_id', FakeDb::$selectCalls[0][0]);
    }

    public function testUpdateForecastAndNoteReturnsFalseWhenNoRowsUpdated(): void
    {
        FakeDb::$updateResult = 0;
        $model = new class extends TenderPricingSummary {
            public function getDb()
            {
                return FakeDb::class;
            }
        };

        $updated = $model->updateForecastAndNote(12, ['forecast' => 123.45]);

        self::assertFalse($updated);
        self::assertCount(1, FakeDb::$updateCalls);
        self::assertSame(12, FakeDb::$updateCalls[0][1]['transaction_id']);
    }

    public function testUpdateForecastAndNotePersistsChanges(): void
    {
        FakeDb::$updateResult = 2;
        $model = new class extends TenderPricingSummary {
            public function getDb()
            {
                return FakeDb::class;
            }
        };

        $updated = $model->updateForecastAndNote(13, ['forecast' => 100, 'note' => 'updated']);

        self::assertTrue($updated);
        self::assertStringContainsString('forecast = :forecast', FakeDb::$updateCalls[0][0]);
        self::assertSame(['forecast' => 100, 'note' => 'updated', 'transaction_id' => 13], FakeDb::$updateCalls[0][1]);
    }
}
