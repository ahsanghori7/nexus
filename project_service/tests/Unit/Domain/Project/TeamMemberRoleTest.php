<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\Project\TeamMemberRole;
use PHPUnit\Framework\TestCase;

class TeamMemberRoleTest extends TestCase
{
    public function testCleanKeepsLabelOnly(): void
    {
        $role = new TeamMemberRole();
        $result = $role->clean(['label' => 'QS', 'ignored' => true]);

        self::assertSame(['label' => 'QS'], $result);
    }

    public function testJsonSerializeReflectsAssignedData(): void
    {
        $role = new TeamMemberRole();
        $role->setData(['id' => 4, 'label' => 'Commercial Manager']);

        self::assertSame(['id' => 4, 'label' => 'Commercial Manager'], $role->jsonSerialize());
        self::assertSame('project_team_member_role', $role->getTable());
    }
}
