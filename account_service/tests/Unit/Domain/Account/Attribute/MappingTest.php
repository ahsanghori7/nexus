<?php
declare(strict_types=1);

namespace Tests\Domain\Account\Attribute;

use App\Domain\Account\Attribute\Mapping;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;

final class MappingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
    }

    public function testAccountAttributeMappingsGroupedByGroupAndType(): void
    {
        FakeDB::queueGetAllResult([
            [
                'id'             => 1,
                'account_id'     => 10,
                'group_id'       => 2,
                'label'          => 'Harness',
                'attribute_type' => 'safety',
            ],
            [
                'id'             => 2,
                'account_id'     => 10,
                'group_id'       => 2,
                'label'          => 'Boots',
                'attribute_type' => 'safety',
            ],
            [
                'id'             => 3,
                'account_id'     => 10,
                'group_id'       => 3,
                'label'          => 'Planning',
                'attribute_type' => 'skills',
            ],
        ]);

        $mapping = new MappingModelStub();
        $result  = $mapping->getAccountAttributeMappings(10);

        self::assertSame(
            [
                2 => [
                    'safety' => [
                        ['id' => 1, 'label' => 'Harness'],
                        ['id' => 2, 'label' => 'Boots'],
                    ],
                ],
                3 => [
                    'skills' => [
                        ['id' => 3, 'label' => 'Planning'],
                    ],
                ],
            ],
            $result
        );
    }

    public function testQueryIncludesAccountIdInWhereClause(): void
    {
        FakeDB::queueGetAllResult([]);

        $mapping = new MappingModelStub();
        $mapping->getAccountAttributeMappings(42);

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString('account_attribute_mapping aam', $query);
        self::assertStringContainsString('JOIN attribute a', $query);
        self::assertStringContainsString('JOIN attribute_type at', $query);
        self::assertStringContainsString('aam.account_id = 42', $query);
        self::assertStringNotContainsString('group_id IN', $query);
        self::assertStringNotContainsString("at.label = ", $query);
    }

    public function testQueryIncludesGroupIdsFilter(): void
    {
        FakeDB::queueGetAllResult([]);

        $mapping = new MappingModelStub();
        $mapping->getAccountAttributeMappings(42, [4, 5]);

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString('aam.account_id = 42', $query);
        self::assertStringContainsString('aam.group_id IN (4,5)', $query);
        self::assertStringNotContainsString("at.label = ", $query);
    }

    public function testQueryIncludesTypeFilter(): void
    {
        FakeDB::queueGetAllResult([]);

        $mapping = new MappingModelStub();
        $mapping->getAccountAttributeMappings(42, [], 'skills');

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString('aam.account_id = 42', $query);
        self::assertStringContainsString("at.label = 'skills'", $query);
        self::assertStringNotContainsString('group_id IN', $query);
    }

    public function testQueryIncludesGroupIdsAndTypeFilter(): void
    {
        FakeDB::queueGetAllResult([]);

        $mapping = new MappingModelStub();
        $mapping->getAccountAttributeMappings(42, [4, 5], 'skills');

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString('aam.account_id = 42', $query);
        self::assertStringContainsString('aam.group_id IN (4,5)', $query);
        self::assertStringContainsString("at.label = 'skills'", $query);
    }

    public function testEmptyResultReturnsEmptyArray(): void
    {
        FakeDB::queueGetAllResult([]);

        $mapping = new MappingModelStub();
        $result  = $mapping->getAccountAttributeMappings(99);

        self::assertSame([], $result);
    }

    public function testThrowsExceptionWhenDbDoesNotHaveGetAll(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Database not found');

        $mapping = new MappingBrokenDbStub();
        $mapping->getAccountAttributeMappings(1);
    }
}

final class MappingModelStub extends Mapping
{
    public function getDB(): string
    {
        return FakeDB::class;
    }
}

final class MappingBrokenDbStub extends Mapping
{
    public function getDB(): object
    {
        return new class {
            // intentionally no getAll method
        };
    }
}
