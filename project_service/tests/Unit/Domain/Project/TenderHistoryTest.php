<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\Project\TenderHistory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use PHPUnit\Framework\TestCase;

class TenderHistoryTest extends TestCase
{
    public function testBeforeSaveEncodesMetaArray(): void
    {
        $history = new TenderHistory();
        $values = [
            'meta' => ['status' => 'Submitted'],
            'tender_id' => 1,
        ];

        $result = $history->beforeSave($values, $values);

        self::assertSame('{"status":"Submitted"}', $result['meta'] ?? null);
    }

    public function testHistoryRelationUsesBelongsToTender(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $history = $this->getMockBuilder(TenderHistory::class)->onlyMethods(['belongsTo'])->getMock();
        $history->expects(self::once())
            ->method('belongsTo')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame('App\Domain\Project\Tender', $related);
                self::assertSame('id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $history->history());
    }
}
