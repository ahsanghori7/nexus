<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\Project\TenderDependency;
use Illuminate\Database\Eloquent\Relations\HasMany;
use PHPUnit\Framework\TestCase;

class TenderDependencyTest extends TestCase
{
    public function testCleanDropsUnknownKeys(): void
    {
        $dependency = new TenderDependency();
        $input = [
            'tender_id' => 1,
            'tender_parent_id' => 2,
            'tender_dependency_key' => 3,
            'tender_dependency_parent_key' => 4,
            'ignored' => true,
        ];

        self::assertSame([
            'tender_id' => 1,
            'tender_parent_id' => 2,
            'tender_dependency_key' => 3,
            'tender_dependency_parent_key' => 4,
        ], $dependency->clean($input));
    }

    public function testTableNameMatchesSchema(): void
    {
        $dependency = new TenderDependency();
        self::assertSame('tender_dependency', $dependency->getTable());
    }

    public function testDependencyRelationUsesHasMany(): void
    {
        $relation = $this->createMock(HasMany::class);
        $dependency = $this->getMockBuilder(TenderDependency::class)->onlyMethods(['hasMany'])->getMock();
        $dependency->expects(self::once())
            ->method('hasMany')
            ->willReturnCallback(static function ($related, $foreignKey, $localKey) use ($relation) {
                self::assertSame(TenderDependency::class, $related);
                self::assertSame('tender_id', $foreignKey);
                self::assertSame('tender_parent_id', $localKey);
                return $relation;
            });

        self::assertSame($relation, $dependency->dependency());
    }

    public function testDependenciesRelationEagerLoadsNestedRecords(): void
    {
        $relation = $this->getMockBuilder(HasMany::class)->disableOriginalConstructor()->addMethods(['with'])->getMock();
        $relation->expects(self::once())
            ->method('with')
            ->with('dependencies')
            ->willReturnSelf();

        $dependency = $this->getMockBuilder(TenderDependency::class)->onlyMethods(['dependency'])->getMock();
        $dependency->expects(self::once())->method('dependency')->willReturn($relation);

        self::assertSame($relation, $dependency->dependencies());
    }
}
