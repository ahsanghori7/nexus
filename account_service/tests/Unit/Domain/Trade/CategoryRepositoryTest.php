<?php
declare(strict_types=1);

namespace Tests\Domain\Trade;

use App\Domain\Trade\CategoryRepository;
use PHPUnit\Framework\TestCase;

/**
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
final class CategoryRepositoryTest extends TestCase
{
    public function testFindAllGroupsTradesByCategory(): void
    {
        CategoryModelStub::reset();
        CategoryModelStub::$records = [
            [
                'cat_id' => 1,
                'trade_id' => 10,
                'cat' => 'Roof',
                'trade' => 'Tiling',
                'icon' => 'roof.png',
                'rules' => 'A',
            ],
            [
                'cat_id' => 1,
                'trade_id' => 11,
                'cat' => 'Roof',
                'trade' => 'Gutter',
                'icon' => 'roof.png',
                'rules' => 'A',
            ],
            [
                'cat_id' => 2,
                'trade_id' => 12,
                'cat' => 'Ground',
                'trade' => 'Paving',
                'icon' => 'ground.png',
                'rules' => 'B',
            ],
        ];

        $repository = new CategoryRepository();
        $this->overrideRepositoryModel($repository);

        $result = $repository->findAll(['active' => 1], 25, 5);

        self::assertSame(
            [
                1 => [
                    'trades' => [
                        10 => 'Tiling',
                        11 => 'Gutter',
                    ],
                    'label' => 'Roof',
                    'icon' => 'roof.png',
                    'rules' => 'A',
                    'category_id' => 1,
                ],
                2 => [
                    'trades' => [
                        12 => 'Paving',
                    ],
                    'label' => 'Ground',
                    'icon' => 'ground.png',
                    'rules' => 'B',
                    'category_id' => 2,
                ],
            ],
            $result
        );

        self::assertSame([[['active' => 1], 25, 5]], CategoryModelStub::$findAllCalls);
    }

    private function overrideRepositoryModel(CategoryRepository $repository): void
    {
        $prop = new \ReflectionProperty(CategoryRepository::class, 'models');
        $prop->setAccessible(true);
        $prop->setValue($repository, ['category' => CategoryModelStub::class]);
    }
}

final class CategoryModelStub
{
    public static array $records = [];
    public static array $findAllCalls = [];

    public static function reset(): void
    {
        self::$records = [];
        self::$findAllCalls = [];
    }

    public function findAll(array $filters = [], int $limit = 0, int $offset = 0): array
    {
        self::$findAllCalls[] = [$filters, $limit, $offset];
        return self::$records;
    }
}
