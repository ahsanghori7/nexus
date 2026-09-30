<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\User\RoleRepository;
use PHPUnit\Framework\TestCase;

final class RoleRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        RoleRepositoryDbDouble::reset();
    }

    public function testGetRolesWithLevelReadsFromDatabase(): void
    {
        RoleRepositoryDbDouble::queueResult([
            ['id' => 1, 'label' => 'Admin', 'level' => 1, 'value' => 'Admin', 'is_contractor_user_type' => 0, 'is_external' => 0],
        ]);
        $repository = new class extends RoleRepository {
            public function getDb(): string
            {
                return RoleRepositoryDbDouble::class;
            }
        };

        $result = $repository->getRolesWithLevel();

        $this->assertSame([
            ['id' => 1, 'label' => 'Admin', 'level' => 1, 'value' => 'Admin', 'is_contractor_user_type' => 0, 'is_external' => 0],
        ], $result);
        $this->assertSame([
            "SELECT id, label, level, display_label AS value, is_contractor_user_type, is_external FROM role ORDER BY level ASC",
        ], RoleRepositoryDbDouble::$queries);
    }
}

final class RoleRepositoryDbDouble
{
    public static array $queries = [];
    private static array $queuedResults = [];

    public static function reset(): void
    {
        self::$queries = [];
        self::$queuedResults = [];
    }

    public static function queueResult(array $rows): void
    {
        self::$queuedResults[] = $rows;
    }

    public static function getAll(string $query): array
    {
        self::$queries[] = $query;
        if (!self::$queuedResults) {
            return [];
        }

        return array_shift(self::$queuedResults);
    }
}
