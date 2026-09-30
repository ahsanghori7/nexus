<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use App\Domain\TenderRecommendation\TenderPricingSummary;
use PHPUnit\Framework\TestCase;

class TenderPricingSummaryTest extends TestCase
{
    public function testGetQuotesByPackage(): void
    {
        $model = $this->getMockBuilder(TenderPricingSummary::class)
            ->onlyMethods(['getDb'])
            ->getMock();

        $dbMock = new class {
            public static function select($sql, $params)
            {
                return [['transaction_id' => 1]];
            }
        };

        $model->method('getDb')->willReturn($dbMock);

        $result = $model->getQuotesByPackage(1, 2);

        $this->assertEquals([['transaction_id' => 1]], $result);
    }

    public function testUpdateForecastAndNoteSuccess(): void
    {
        $model = $this->getMockBuilder(TenderPricingSummary::class)
            ->onlyMethods(['getDb'])
            ->getMock();

        $dbMock = new class {
            public static function update($sql, $params)
            {
                return 1; // simulate success
            }
        };

        $model->method('getDb')->willReturn($dbMock);

        $result = $model->updateForecastAndNote(1, [
            'forecast' => 1000,
            'note' => 'test'
        ]);

        $this->assertTrue($result);
    }

    public function testUpdateForecastAndNoteFailure(): void
    {
        $model = $this->getMockBuilder(TenderPricingSummary::class)
            ->onlyMethods(['getDb'])
            ->getMock();

        $dbMock = new class {
            public static function update($sql, $params)
            {
                return 0; // simulate failure
            }
        };

        $model->method('getDb')->willReturn($dbMock);

        $result = $model->updateForecastAndNote(1, [
            'forecast' => 1000
        ]);

        $this->assertFalse($result);
    }
}
