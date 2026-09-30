<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\Project\Project;
use App\Domain\Project\TeamMemberRole;
use App\Domain\Project\TeamMemberRoleMapping;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use PHPUnit\Framework\TestCase;

class TeamMemberRoleMappingTest extends TestCase
{
    public function testCleanFiltersToFillableFields(): void
    {
        $mapping = new TeamMemberRoleMapping();
        $payload = [
            'role_id' => 1,
            'user_id' => 2,
            'project_id' => 3,
            'added_date' => '2024-01-01',
            'unexpected' => 'value',
        ];

        self::assertSame([
            'role_id' => 1,
            'user_id' => 2,
            'project_id' => 3,
            'added_date' => '2024-01-01',
        ], $mapping->clean($payload));
    }

    public function testJsonSerializeReturnsAssignedValues(): void
    {
        $mapping = new TeamMemberRoleMapping();
        $mapping->setData(['role_id' => 1, 'user_id' => 8]);

        self::assertSame(['role_id' => 1, 'user_id' => 8], $mapping->jsonSerialize());
    }

    public function testProjectRelationUsesBelongsTo(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $mapping = $this->getMockBuilder(TeamMemberRoleMapping::class)->onlyMethods(['belongsTo'])->getMock();
        $mapping->expects(self::once())
            ->method('belongsTo')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame(Project::class, $related);
                self::assertSame('project_id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $mapping->project());
    }

    public function testTeamMemberRoleRelationUsesHasOne(): void
    {
        $relation = $this->createMock(HasOne::class);
        $mapping = $this->getMockBuilder(TeamMemberRoleMapping::class)->onlyMethods(['hasOne'])->getMock();
        $mapping->expects(self::once())
            ->method('hasOne')
            ->willReturnCallback(static function ($related, $foreignKey, $localKey) use ($relation) {
                self::assertSame(TeamMemberRole::class, $related);
                self::assertSame('id', $foreignKey);
                self::assertSame('role_id', $localKey);
                return $relation;
            });

        self::assertSame($relation, $mapping->teamMemberRole());
    }
}
