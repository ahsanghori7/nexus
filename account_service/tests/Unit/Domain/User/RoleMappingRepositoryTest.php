<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\User\RoleMappingRepository;
use PHPUnit\Framework\TestCase;

final class RoleMappingRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        RoleMappingModelSpy::reset();
    }

    public function testFindAllByUserIdPassesFiltersToModel(): void
    {
        $repository = new class extends RoleMappingRepository {
            protected $models = [
                'roleMapping' => RoleMappingModelSpy::class,
            ];
        };
        $filters = ['user_id' => 55];

        $result = $repository->findAll($filters);

        $this->assertSame(RoleMappingModelSpy::$result, $result);
        $this->assertSame([[
            'filters' => $filters,
            'limit' => 0,
            'offset' => 0,
        ]], RoleMappingModelSpy::$calls);
    }

    public function testGetModelReturnsRoleMappingInstance(): void
    {
        $repository = new class extends RoleMappingRepository {
            protected $models = [
                'roleMapping' => RoleMappingModelSpy::class,
            ];
        };

        $model = $repository->getModel();

        $this->assertInstanceOf(RoleMappingModelSpy::class, $model);
    }

    public function testGetModelWithCustomNameReturnsRoleMappingInstance(): void
    {
        $repository = new class extends RoleMappingRepository {
            protected $models = [
                'roleMapping' => RoleMappingModelSpy::class,
            ];
        };

        $model = $repository->getModel('roleMapping');

        $this->assertInstanceOf(RoleMappingModelSpy::class, $model);
    }

    public function testGetModelThrowsExceptionForInvalidModelName(): void
    {
        $repository = new class extends RoleMappingRepository {
            protected $models = [
                'roleMapping' => RoleMappingModelSpy::class,
            ];
        };

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid model invalidModel');

        $repository->getModel('invalidModel');
    }
}

final class RoleMappingModelSpy
{
    public static array $calls = [];
    public static array $result = [
        ['user_id' => 55, 'role_id' => 2],
    ];

    public static function reset(): void
    {
        self::$calls = [];
        self::$result = [
            ['user_id' => 55, 'role_id' => 2],
        ];
    }

    public function findAll(array $filters = [], int $limit = 0, int $offset = 0): array
    {
        self::$calls[] = [
            'filters' => $filters,
            'limit' => $limit,
            'offset' => $offset,
        ];
        return self::$result;
    }
}
