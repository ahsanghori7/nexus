<?php
declare(strict_types=1);

namespace Tests\Domain\Region;

use App\Domain\Region\RegionRepository;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;
use Tests\Support\Fakes\FakeRegionMappingModel;
use Tests\Support\Fakes\FakeRegionModel;

final class RegionRepositoryTest extends TestCase
{
    private FakeRegionRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
        FakeRegionMappingModel::reset();
        FakeRegionModel::setRecords([
            ['id' => 1],
            ['id' => 2],
        ]);

        $this->repository = new FakeRegionRepository();
    }

    public function testValidateRegionsRejectsNonInt(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Region must be an integer,string supplied.');

        $this->repository->validateRegions(['bad']);
    }

    public function testValidateRegionsRejectsUnknownId(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid Region Id 99');

        $this->repository->validateRegions([99]);
    }

    public function testValidateRegionsEmptyReturnsFalse(): void
    {
        $this->assertFalse($this->repository->validateRegions([]));
    }

    public function testMapAddOnlyTrueDoesNotDelete(): void
    {
        $this->repository->map(5, [1, 2], 'delivery', null, true);

        $this->assertSame([], FakeRegionMappingModel::$deleteCalls);
        $this->assertSame([[5, 10, [1, 2], null]], FakeRegionMappingModel::$saveMappingsCalls);

        FakeRegionMappingModel::reset();
        $this->repository->map(5, [1], 'delivery', 7, false);

        $this->assertSame([['account_id' => 5, 'type_id' => 10, 'group_id' => 7]], FakeRegionMappingModel::$deleteCalls);
        $this->assertSame([[5, 10, [1], 7]], FakeRegionMappingModel::$saveMappingsCalls);
    }

    public function testGetMappingsTypeResolutionAndDelegation(): void
    {
        FakeRegionMappingModel::$byIdsResult = [['id' => 1]];
        $result = $this->repository->getMappings([1, 2], 'delivery', 3);

        $this->assertSame([['id' => 1]], $result);
        $this->assertSame([[ [1, 2], 10, 3 ]], FakeRegionMappingModel::$byIdsCalls);

        $originalMap = FakeRegionMappingModel::$typeMap;
        FakeRegionMappingModel::$typeMap = [];
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid Mapping Type unknown');
        $this->repository->getMappings([1], 'unknown');
        FakeRegionMappingModel::$typeMap = $originalMap;
    }
}

final class FakeRegionRepository extends RegionRepository
{
    protected array $modelMap = [
        'region' => FakeRegionModel::class,
        'region_mapping' => FakeRegionMappingModel::class,
        'region_group' => FakeRegionModel::class,
    ];

    private array $instances = [];

    public function getModel(string $name = 'region')
    {
        if (!isset($this->modelMap[$name])) {
            throw new \Exception("Unknown model {$name}");
        }

        if (!isset($this->instances[$name])) {
            $cls = $this->modelMap[$name];
            $this->instances[$name] = new $cls();
        }

        return $this->instances[$name];
    }
}
