<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Milestone;

use App\Domain\Milestone\AccountMilestoneMapping;
use App\Domain\Milestone\Milestone;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use PHPUnit\Framework\TestCase;

class AccountMilestoneMappingTest extends TestCase
{
    public function testMilestoneRelationTargetsMilestone(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $accountMilestoneMapping = $this->getMockBuilder(AccountMilestoneMapping::class)->onlyMethods(['belongsTo'])->getMock();
        $accountMilestoneMapping->expects(self::once())
            ->method('belongsTo')
            ->with(Milestone::class, 'milestone_id')
            ->willReturn($relation);

        self::assertSame($relation, $accountMilestoneMapping->milestone());
    }
}
