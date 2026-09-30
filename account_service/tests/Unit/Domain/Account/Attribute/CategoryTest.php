<?php
declare(strict_types=1);

namespace Tests\Domain\Account\Attribute;

use App\Domain\Account\Attribute\Category;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;

final class CategoryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
    }

    public function testCategoryMappingsAggregateAttributesByCategory(): void
    {
        FakeDB::queueGetAllResult([
            [
                'cat_label' => 'Safety',
                'cat_id' => 1,
                'type' => 'trade',
                'region_code' => 'UK',
                'group_id' => 5,
                'id' => 10,
                'label' => 'Helmet',
            ],
            [
                'cat_label' => 'Safety',
                'cat_id' => 1,
                'type' => 'trade',
                'region_code' => 'UK',
                'group_id' => 5,
                'id' => 11,
                'label' => 'Boots',
            ],
        ]);

        $category = new CategoryModelStub();
        $result = $category->getCategoryMappings(['type' => 'trade']);

        self::assertSame(
            [
                [
                    'category' => [
                        'id' => 1,
                        'type' => 'trade',
                        'label' => 'Safety',
                        'region_code' => 'UK',
                        'group_id' => 5,
                    ],
                    'attributes' => [
                        ['id' => 10, 'label' => 'Helmet'],
                        ['id' => 11, 'label' => 'Boots'],
                    ],
                ],
            ],
            $result
        );

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString('`attribute_category` ac', $query);
        self::assertStringContainsString("JOIN attribute_category_mapping", $query);
        self::assertStringContainsString("JOIN attribute a", $query);
        self::assertStringContainsString("ac.type = 'trade'", $query);
    }

    public function testCategoryMappingsReturnOnlyAttributes(): void
    {
        FakeDB::queueGetAllResult([
            [
                'cat_label' => 'Skills',
                'cat_id' => 7,
                'type' => 'trade',
                'region_code' => 'UK',
                'group_id' => 2,
                'id' => 30,
                'label' => 'Scaffolding',
            ],
        ]);

        $category = new CategoryModelStub();
        $result = $category->getCategoryMappings([], true);

        self::assertSame(
            [
                [
                    'id' => 30,
                    'label' => 'Scaffolding',
                    'category' => 'Skills',
                ],
            ],
            $result
        );
    }

    public function testCategoryMappingsWithNoFilterAddsNoWhereClause(): void
    {
        FakeDB::queueGetAllResult([]);

        $category = new CategoryModelStub();
        $result = $category->getCategoryMappings([]);

        self::assertSame([], $result);

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringNotContainsString('WHERE', $query);
    }

    public function testCategoryMappingsWithRegionCodeFilter(): void
    {
        FakeDB::queueGetAllResult([
            [
                'cat_label' => 'Tools',
                'cat_id' => 3,
                'type' => 'general',
                'region_code' => 'AU',
                'group_id' => null,
                'id' => 20,
                'label' => 'Drill',
            ],
        ]);

        $category = new CategoryModelStub();
        $result = $category->getCategoryMappings(['region_code' => 'AU']);

        self::assertCount(1, $result);
        self::assertSame('AU', $result[0]['category']['region_code']);

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString("ac.region_code = 'AU'", $query);
    }

    public function testCategoryMappingsWithGroupIdFilter(): void
    {
        FakeDB::queueGetAllResult([
            [
                'cat_label' => 'Electrical',
                'cat_id' => 9,
                'type' => 'trade',
                'region_code' => 'US',
                'group_id' => 4,
                'id' => 50,
                'label' => 'Wiring',
            ],
        ]);

        $category = new CategoryModelStub();
        $result = $category->getCategoryMappings(['group_id' => 4]);

        self::assertCount(1, $result);
        self::assertSame(4, $result[0]['category']['group_id']);

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString('AND (a.restricted_account_id IS NULL OR a.restricted_account_id = 4)', $query);
    }

    public function testCategoryMappingsWithAllFilters(): void
    {
        FakeDB::queueGetAllResult([
            [
                'cat_label' => 'Plumbing',
                'cat_id' => 12,
                'type' => 'trade',
                'region_code' => 'UK',
                'group_id' => 7,
                'id' => 60,
                'label' => 'Pipes',
            ],
        ]);

        $category = new CategoryModelStub();
        $result = $category->getCategoryMappings([
            'type'        => 'trade',
            'region_code' => 'UK',
            'group_id'    => 7,
        ]);

        self::assertCount(1, $result);
        self::assertSame('Plumbing', $result[0]['category']['label']);

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString("ac.type = 'trade'", $query);
        self::assertStringContainsString("ac.region_code = 'UK'", $query);
        self::assertStringContainsString('AND (a.restricted_account_id IS NULL OR a.restricted_account_id = 7)', $query);
    }

    public function testCategoryMappingsWithMultipleCategoriesGroupsSeparately(): void
    {
        FakeDB::queueGetAllResult([
            [
                'cat_label' => 'Safety',
                'cat_id' => 1,
                'type' => 'trade',
                'region_code' => 'UK',
                'group_id' => 5,
                'id' => 10,
                'label' => 'Helmet',
            ],
            [
                'cat_label' => 'Tools',
                'cat_id' => 2,
                'type' => 'trade',
                'region_code' => 'UK',
                'group_id' => 5,
                'id' => 20,
                'label' => 'Hammer',
            ],
        ]);

        $category = new CategoryModelStub();
        $result = $category->getCategoryMappings(['type' => 'trade']);

        self::assertCount(2, $result);
        self::assertSame('Safety', $result[0]['category']['label']);
        self::assertSame('Tools', $result[1]['category']['label']);
        self::assertCount(1, $result[0]['attributes']);
        self::assertCount(1, $result[1]['attributes']);
    }

    public function testCategoryMappingsReturnOnlyAttributesWithMultipleRows(): void
    {
        FakeDB::queueGetAllResult([
            [
                'cat_label' => 'Skills',
                'cat_id' => 7,
                'type' => 'trade',
                'region_code' => 'UK',
                'group_id' => 2,
                'id' => 30,
                'label' => 'Scaffolding',
            ],
            [
                'cat_label' => 'Safety',
                'cat_id' => 1,
                'type' => 'trade',
                'region_code' => 'UK',
                'group_id' => 5,
                'id' => 10,
                'label' => 'Helmet',
            ],
        ]);

        $category = new CategoryModelStub();
        $result = $category->getCategoryMappings([], true);

        self::assertCount(2, $result);
        self::assertSame(
            [
                ['id' => 30, 'label' => 'Scaffolding', 'category' => 'Skills'],
                ['id' => 10, 'label' => 'Helmet', 'category' => 'Safety'],
            ],
            $result
        );
    }
}

final class CategoryModelStub extends Category
{
    public function getDB()
    {
        return FakeDB::class;
    }
}
