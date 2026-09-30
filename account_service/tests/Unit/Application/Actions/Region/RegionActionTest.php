<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Region;

use App\Application\Actions\Action;
use App\Application\Actions\Region\RegionAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class RegionActionTest extends TestCase
{
    public function testGetRegionsReturnsMappings(): void
    {
        $repository = new RegionRepositoryStub();
        $repository->regionMappings = [['region_id' => 3]];

        $action = $this->createAction($repository);
        $response = $action->getRegions(
            $this->createRequest('GET', '/v1/region/4'),
            new Response(),
            ['id' => '4']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->regionMappings, $payload['data']);
    }

    public function testGetRegionsInjectsAccountIdIntoFilters(): void
    {
        $repository = new RegionRepositoryStub();
        $action = $this->createAction($repository);

        $request = $this->createRequest('GET', '/v1/region/9')
            ->withQueryParams(['group_id' => '11']);

        $action->getRegions($request, new Response(), ['id' => '9']);

        self::assertSame([
            ['group_id' => '11', 'account_id' => 9],
        ], $repository->regionMappingFindAllCalls);
    }

    public function testUpdateAccountRegionsReplacesMappings(): void
    {
        $repository = new RegionRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, [5, 6]);

        $response = $action->updateAccountRegions(
            $this->createRequest('PATCH', '/v1/region/3'),
            new Response(),
            ['id' => '3']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([
            [
                'account_id' => 3,
                'type_id' => RegionRepositoryStub::REGION_ACCOUNT_TYPE_ID,
            ],
        ], $repository->deleteCalls);
        self::assertSame([
            [
                'account_id' => 3,
                'region_id' => 5,
                'group_id' => 3,
                'type_id' => RegionRepositoryStub::REGION_ACCOUNT_TYPE_ID,
            ],
            [
                'account_id' => 3,
                'region_id' => 6,
                'group_id' => 3,
                'type_id' => RegionRepositoryStub::REGION_ACCOUNT_TYPE_ID,
            ],
        ], $repository->saveCalls);
    }

    public function testGetRegionGroupReturnsData(): void
    {
        $repository = new RegionRepositoryStub();
        $repository->regionGroup = [['id' => 1, 'label' => 'North']];

        $action = $this->createAction($repository);
        $response = $action->getRegionGroup(
            $this->createRequest('GET', '/v1/region/group'),
            new Response(),
            []
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->regionGroup, $payload['data']);
    }

    public function testCreateRegionWithoutBodyReturnsBadRequest(): void
    {
        RegionModelDBStub::reset();

        $repository = new RegionRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, []);

        $response = $action->createRegion(
            $this->createRequest('POST', '/v1/region'),
            new Response(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testCreateRegionCreatesRegionAndSyncsLegacyId(): void
    {
        RegionModelDBStub::reset();

        $repository = new RegionRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'label' => 'Northern',
            'region_id' => 27,
        ]);

        $response = $action->createRegion(
            $this->createRequest('POST', '/v1/region'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['success' => true], $payload['data']);
        self::assertSame([
            ['label' => 'Northern'],
        ], $repository->regionSaves);
        self::assertSame([
            ['UPDATE region SET id = ? WHERE id = ?', [27, RegionEntityStub::SAVED_ID]],
        ], $repository->legacyExecCalls);
    }

    private function createAction(RegionRepositoryStub $repository): RegionActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new RegionActionUnderTest($logger, $repository);
    }

    private function setActionData(RegionAction $action, mixed $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class RegionActionUnderTest extends RegionAction
{
    public function __construct(LoggerInterface $logger, RegionRepositoryStub $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }
}

final class RegionRepositoryStub
{
    public const REGION_ACCOUNT_TYPE_ID = 3;
    public array $regionMappings = [];
    public array $regionMappingFindAllCalls = [];
    public array $deleteCalls = [];
    public array $saveCalls = [];
    public array $regionGroup = [];
    public array $regionSaves = [];
    public array $legacyExecCalls = [];

    public function getModel(string $name = '')
    {
        return match ($name) {
            'region_mapping' => new RegionMappingModelStub($this),
            'region_group' => new RegionGroupModelStub($this),
            default => new RegionModelStub($this),
        };
    }
}

final class RegionMappingModelStub
{
    public function __construct(private RegionRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        $this->repository->regionMappingFindAllCalls[] = $filters;
        return $this->repository->regionMappings;
    }

    public function deleteWhere(array $criteria): void
    {
        $this->repository->deleteCalls[] = $criteria;
    }

    public function save(array $data): void
    {
        $this->repository->saveCalls[] = $data;
    }
}

final class RegionModelStub
{
    public const ID_FIELD = 'id';

    public function __construct(private RegionRepositoryStub $repository)
    {
    }

    public function save(array $data): RegionEntityStub
    {
        $this->repository->regionSaves[] = $data;
        return new RegionEntityStub();
    }

    public function getDB(): string
    {
        RegionModelDBStub::setRepository($this->repository);
        return RegionModelDBStub::class;
    }

    public function getName(): string
    {
        return 'region';
    }
}

final class RegionEntityStub
{
    public const SAVED_ID = 99;

    public function getId(): int
    {
        return self::SAVED_ID;
    }
}

final class RegionModelDBStub
{
    private static ?RegionRepositoryStub $repository = null;
    public static array $execCalls = [];

    public static function setRepository(RegionRepositoryStub $repository): void
    {
        self::$repository = $repository;
    }

    public static function exec(string $sql, array $params): void
    {
        self::$execCalls[] = [$sql, $params];
        if (self::$repository) {
            self::$repository->legacyExecCalls[] = [$sql, $params];
        }
    }

    public static function reset(): void
    {
        self::$repository = null;
        self::$execCalls = [];
    }
}

final class RegionGroupModelStub
{
    public function __construct(private RegionRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        return $this->repository->regionGroup;
    }
}
