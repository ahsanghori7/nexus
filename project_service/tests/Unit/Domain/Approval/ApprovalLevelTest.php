<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Approval;

use App\Domain\Approval\ApprovalConfiguration;
use App\Domain\Approval\ApprovalLevel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use PHPUnit\Framework\TestCase;

class ApprovalLevelTest extends TestCase
{
    public function testApprovalConfigurationRelationTargetsApprovalConfiguration(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $approvalLevel = $this->getMockBuilder(ApprovalLevel::class)->onlyMethods(['belongsTo'])->getMock();
        $approvalLevel->expects(self::once())
            ->method('belongsTo')
            ->with(ApprovalConfiguration::class, 'approval_config_id')
            ->willReturn($relation);

        self::assertSame($relation, $approvalLevel->approval_configuration());
    }
}
