<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Approval;

use App\Domain\Approval\Approval;
use App\Domain\Approval\ApprovalStatus;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use PHPUnit\Framework\TestCase;

class ApprovalTest extends TestCase
{
    public function testStatusRelationTargetsApprovalStatus(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $approval = $this->getMockBuilder(Approval::class)->onlyMethods(['belongsTo'])->getMock();
        $approval->expects(self::once())
            ->method('belongsTo')
            ->with(ApprovalStatus::class, 'status_id')
            ->willReturn($relation);

        self::assertSame($relation, $approval->status());
    }

    public function testApprovalStatusUsesExpectedTable(): void
    {
        $status = new ApprovalStatus();
        self::assertSame('approval_statuses', $status->getTable());
    }
}
