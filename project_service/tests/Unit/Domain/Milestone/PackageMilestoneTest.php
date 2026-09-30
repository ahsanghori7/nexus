<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Milestone;

use App\Domain\Milestone\AccountMilestoneMapping;
use App\Domain\Milestone\PackageMilestone;
use App\Domain\Milestone\PackageMilestoneStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use PHPUnit\Framework\TestCase;

class PackageMilestoneTest extends TestCase
{
    public function testStatusRelationTargetsPackageMilestoneStatus(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $packageMilestone = $this->getMockBuilder(PackageMilestone::class)->onlyMethods(['belongsTo'])->getMock();
        $packageMilestone->expects(self::once())
            ->method('belongsTo')
            ->with(PackageMilestoneStatus::class, 'package_milestone_status_id')
            ->willReturn($relation);

        self::assertSame($relation, $packageMilestone->status());
    }

    public function testAccountMilestoneMappingRelationTargetsAccountMilestoneMapping(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $packageMilestone = $this->getMockBuilder(PackageMilestone::class)->onlyMethods(['belongsTo'])->getMock();
        $packageMilestone->expects(self::once())
            ->method('belongsTo')
            ->with(AccountMilestoneMapping::class, 'account_milestone_mapping_id')
            ->willReturn($relation);

        self::assertSame($relation, $packageMilestone->accountMilestoneMapping());
    }
}
