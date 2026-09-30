<?php

declare(strict_types=1);

namespace Tests\Unit\Action;

use App\Application\Actions\Milestone\MilestoneAction;
use App\Domain\Milestone\MilestoneRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Tests\TestDoubles\FakeCollection;

class MilestoneActionTest extends TestCase
{
    private ResponseFactory $responseFactory;

    protected function setUp(): void
    {
        $this->responseFactory = new ResponseFactory();
    }

    /**
     * Test listByAccountId returns milestones for the given account
     */
    public function testListByAccountIdReturnsMilestones(): void
    {
        $builder = $this->createBuilder(['select', 'where', 'orderBy', 'get']);
        $builder->method('where')
            ->with('account_id', 123)
            ->willReturnSelf();
        $builder->method('orderBy')
            ->willReturnSelf();
        $builder->method('select')
            ->willReturnSelf();
        $builder->method('get')
            ->willReturn(new FakeCollection([
                ['id' => 1, 'account_id' => 123, 'label' => 'Milestone 1', 'lead_time' => 4, 'sort_order' => 1],
                ['id' => 2, 'account_id' => 123, 'label' => 'Milestone 2', 'lead_time' => 4, 'sort_order' => 2],
            ]));

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('accountMilestoneMapping')
            ->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listByAccountId(
            $this->createRequest(),
            $this->createResponse(),
            ['account_id' => '123']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertCount(2, $payload['data']);
        self::assertSame('Milestone 1', $payload['data'][0]['label']);
    }

    /**
     * Test listByAccountId handles empty results
     */
    public function testListByAccountIdReturnsEmptyArray(): void
    {
        $builder = $this->createBuilder(['select', 'where', 'orderBy', 'get']);
        $builder->method('where')
            ->with('account_id', 999)
            ->willReturnSelf();
        $builder->method('orderBy')
            ->willReturnSelf();
        $builder->method('select')
            ->willReturnSelf();
        $builder->method('get')
            ->willReturn(new FakeCollection([]));

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('accountMilestoneMapping')
            ->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listByAccountId(
            $this->createRequest(),
            $this->createResponse(),
            ['account_id' => '999']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertCount(0, $payload['data']);
    }

    /**
     * Test listStatuses returns all milestone statuses
     */
    public function testListStatusesReturnsStatuses(): void
    {
        $builder = $this->createBuilder(['get']);
        $builder->method('get')
            ->willReturn(new FakeCollection([
                ['id' => 1, 'label' => 'Not Started'],
                ['id' => 2, 'label' => 'In Progress'],
                ['id' => 3, 'label' => 'Completed'],
            ]));

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestoneStatus')
            ->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listStatuses(
            $this->createRequest(),
            $this->createResponse(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertCount(3, $payload['data']);
        self::assertSame('Completed', $payload['data'][2]['label']);
    }

    /**
     * Test listStatuses handles empty results
     */
    public function testListStatusesReturnsEmptyArray(): void
    {
        $builder = $this->createBuilder(['get']);
        $builder->method('get')
            ->willReturn(new FakeCollection([]));

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestoneStatus')
            ->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listStatuses(
            $this->createRequest(),
            $this->createResponse(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertCount(0, $payload['data']);
    }

    /**
     * Test getPackageMilestones returns formatted milestones with joins
     */
    public function testGetPackageMilestonesReturnsMilestones(): void
    {
        $builder = $this->createBuilder([
            'where',
            'join',
            'orderBy',
            'select',
            'get',
        ]);

        $builder->method('where')
            ->with('package_id', 456)
            ->willReturnSelf();
        $builder->method('join')
            ->willReturnSelf();
        $builder->method('orderBy')
            ->willReturnSelf();
        $builder->method('select')
            ->willReturnSelf();
        $builder->method('get')
            ->willReturn(new FakeCollection([
                [
                    'id' => 1,
                    'label' => 'Design',
                    'lead_time' => 10,
                    'sort_order' => 1,
                    'type' => 'design',
                    'planned_start_date' => '2024-01-01',
                    'planned_end_date' => '2024-01-15',
                    'actual_start_date' => '2024-01-02',
                    'actual_end_date' => '2024-01-16',
                    'status' => 'Completed',
                ],
            ]));

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getPackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            ['package_id' => '456']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertCount(1, $payload['data']);
        self::assertSame('Design', $payload['data'][0]['label']);
        self::assertSame('Completed', $payload['data'][0]['status']);
    }

    /**
     * Test getPackageMilestones handles empty results
     */
    public function testGetPackageMilestonesReturnsEmptyArray(): void
    {
        $builder = $this->createBuilder([
            'where',
            'join',
            'orderBy',
            'select',
            'get',
        ]);

        $builder->method('where')->willReturnSelf();
        $builder->method('join')->willReturnSelf();
        $builder->method('orderBy')->willReturnSelf();
        $builder->method('select')->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([]));

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getPackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            ['package_id' => '789']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertCount(0, $payload['data']);
    }

    /**
     * Test createPackageMilestones creates multiple milestones
     */
    public function testCreatePackageMilestonesCreatesMultiple(): void
    {
        $mockModel = $this->createBuilder(['create']);
        $mockModel->expects(self::exactly(2))
            ->method('create')
            ->willReturnCallback(function (array $data) {
                self::assertArrayHasKey('id', $data);
                return true;
            });

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockModel);

        $action = $this->createAction($repository);
        $action->setRequestData([
            ['id' => 1, 'package_id' => 1],
            ['id' => 2, 'package_id' => 1],
        ]);

        $response = $action->createPackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            []
        );

        self::assertSame(201, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame('Package milestones created successfully.', $payload['data']['message']);
    }

    /**
     * Test createPackageMilestones handles empty data
     */
    public function testCreatePackageMilestonesWithEmptyData(): void
    {
        $mockModel = $this->createBuilder(['create']);
        $mockModel->expects(self::never())->method('create');

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockModel);

        $action = $this->createAction($repository);
        $action->setRequestData([]);

        $response = $action->createPackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            []
        );

        self::assertSame(201, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame('Package milestones created successfully.', $payload['data']['message']);
    }

    /**
     * Test createBulkPackageMilestones inserts all milestones for a single package in one call
     */
    public function testCreateBulkPackageMilestonesInsertsAll(): void
    {
        // The frontend wraps a single package's milestone list in an extra outer array, and
        // sends fields (e.g. sort_order) that don't belong to package_milestone.
        $requestData = [
            [
                ['account_milestone_mapping_id' => 1, 'package_id' => 1, 'sort_order' => 1, 'lead_time' => 5, 'package_milestone_status_id' => 1],
                ['account_milestone_mapping_id' => 2, 'package_id' => 1, 'sort_order' => 2, 'lead_time' => 10, 'package_milestone_status_id' => 1],
            ],
        ];

        $expectedRows = [
            ['account_milestone_mapping_id' => 1, 'package_id' => 1, 'lead_time' => 5, 'package_milestone_status_id' => 1],
            ['account_milestone_mapping_id' => 2, 'package_id' => 1, 'lead_time' => 10, 'package_milestone_status_id' => 1],
        ];

        $mockModel = $this->createBuilder(['insert']);
        $mockModel->expects(self::once())
            ->method('insert')
            ->with($expectedRows)
            ->willReturn(true);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockModel);

        $action = $this->createAction($repository);
        $action->setRequestData($requestData);

        $response = $action->createBulkPackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            []
        );

        self::assertSame(201, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame('Package milestones created successfully.', $payload['data']['message']);
    }

    /**
     * Test createBulkPackageMilestones flattens multiple packages' milestone groups into one insert
     */
    public function testCreateBulkPackageMilestonesFlattensMultiplePackageGroups(): void
    {
        // One milestone-list group per package_id.
        $requestData = [
            [
                ['account_milestone_mapping_id' => 1, 'package_id' => 1, 'sort_order' => 1, 'lead_time' => 5, 'package_milestone_status_id' => 1],
                ['account_milestone_mapping_id' => 2, 'package_id' => 1, 'sort_order' => 2, 'lead_time' => 10, 'package_milestone_status_id' => 1],
            ],
            [
                ['account_milestone_mapping_id' => 3, 'package_id' => 2, 'sort_order' => 1, 'lead_time' => 4, 'package_milestone_status_id' => 1],
            ],
        ];

        $expectedRows = [
            ['account_milestone_mapping_id' => 1, 'package_id' => 1, 'lead_time' => 5, 'package_milestone_status_id' => 1],
            ['account_milestone_mapping_id' => 2, 'package_id' => 1, 'lead_time' => 10, 'package_milestone_status_id' => 1],
            ['account_milestone_mapping_id' => 3, 'package_id' => 2, 'lead_time' => 4, 'package_milestone_status_id' => 1],
        ];

        $mockModel = $this->createBuilder(['insert']);
        $mockModel->expects(self::once())
            ->method('insert')
            ->with($expectedRows)
            ->willReturn(true);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockModel);

        $action = $this->createAction($repository);
        $action->setRequestData($requestData);

        $response = $action->createBulkPackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            []
        );

        self::assertSame(201, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame('Package milestones created successfully.', $payload['data']['message']);
    }

    /**
     * Test createBulkPackageMilestones returns a 400 ActionError when the insert throws
     */
    public function testCreateBulkPackageMilestonesReturnsBadRequestOnException(): void
    {
        $milestones = [
            ['account_milestone_mapping_id' => 1, 'package_id' => 1, 'lead_time' => 5, 'package_milestone_status_id' => 1],
        ];

        $mockModel = $this->createBuilder(['insert']);
        $mockModel->method('insert')->willThrowException(new \Exception('DB is down'));

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockModel);

        $action = $this->createAction($repository);
        $action->setRequestData($milestones);

        $response = $action->createBulkPackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame('DB is down', $payload['error']['description']);
    }

    /**
     * Test createBulkPackageMilestones handles empty data
     */
    public function testCreateBulkPackageMilestonesWithEmptyData(): void
    {
        $mockModel = $this->createBuilder(['insert']);
        $mockModel->expects(self::never())->method('insert');

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockModel);

        $action = $this->createAction($repository);
        $action->setRequestData([]);

        $response = $action->createBulkPackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            []
        );

        self::assertSame(201, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame('Package milestones created successfully.', $payload['data']['message']);
    }

    /**
     * Test updatePackageMilestones updates existing milestones
     */
    public function testUpdatePackageMilestonesUpdatesExisting(): void
    {
        $mockRecord = $this->createBuilder(['update']);
        $mockRecord->expects(self::exactly(2))
            ->method('update')
            ->willReturn(true);

        $mockModel = $this->createBuilder(['where', 'first']);
        $mockModel->expects(self::exactly(2))
            ->method('where')
            ->with('id', self::isType('int'))
            ->willReturnSelf();
        $mockModel->expects(self::exactly(2))
            ->method('first')
            ->willReturn($mockRecord);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockModel);

        $action = $this->createAction($repository);
        $action->setRequestData([
            ['id' => 1, 'status' => 'updated'],
            ['id' => 2, 'status' => 'updated'],
        ]);

        $response = $action->updatePackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            ['package_id' => '100']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame('Package milestones updated successfully.', $payload['data']['message']);
    }

    /**
     * Test updatePackageMilestones skips non-existent milestones
     */
    public function testUpdatePackageMilestonesSkipsNonExistent(): void
    {
        $mockModel = $this->createBuilder(['where', 'first']);
        $mockModel->method('where')->willReturnSelf();
        $mockModel->method('first')->willReturn(null);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockModel);

        $action = $this->createAction($repository);
        $action->setRequestData([
            ['id' => 999, 'status' => 'updated'],
        ]);

        $response = $action->updatePackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            ['package_id' => '100']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame('Package milestones updated successfully.', $payload['data']['message']);
    }

    /**
     * Test updatePackageMilestones handles empty data
     */
    public function testUpdatePackageMilestonesWithEmptyData(): void
    {
        $mockModel = $this->createBuilder(['where', 'first']);
        $mockModel->expects(self::never())->method('where');

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockModel);

        $action = $this->createAction($repository);
        $action->setRequestData([]);

        $response = $action->updatePackageMilestones(
            $this->createRequest(),
            $this->createResponse(),
            ['package_id' => '100']
        );

        self::assertSame(200, $response->getStatusCode());
    }

    /**
     * Test startMilestone updates status to In Progress
     */
    public function testStartMilestoneUpdatesStatus(): void
    {
        $mockStatuses = new FakeCollection([
            ['id' => 1, 'label' => 'Not Started'],
            ['id' => 2, 'label' => 'In Progress'],
            ['id' => 3, 'label' => 'Completed'],
        ]);

        $mockRecord = $this->createBuilder(['where', 'exists', 'update']);
        $mockRecord->method('where')
            ->with('id', 1)
            ->willReturnSelf();
        $mockRecord->method('exists')->willReturn(true);
        $mockRecord->expects(self::once())
            ->method('update')
            ->with([
                'actual_start_date' => '2026-01-01',
                'package_milestone_status_id' => 2,
            ])
            ->willReturn(true);

        $statusBuilder = $this->createBuilder(['get']);
        $statusBuilder->method('get')->willReturn($mockStatuses);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->expects(self::atLeast(2))
            ->method('getModel')
            ->willReturnCallback(function (string $model) use ($mockRecord, $statusBuilder) {
                if ($model === 'packageMilestone') {
                    return $mockRecord;
                }
                return $statusBuilder;
            });

        $action = $this->createAction($repository);
        $action->setRequestData(['actual_start_date' => '2026-01-01']);

        $response = $action->startMilestone(
            $this->createRequest(),
            $this->createResponse(),
            ['package_milestone_id' => '1']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame(true, $payload['data']['success']);
        self::assertSame('Package milestone updated successfully.', $payload['data']['message']);
    }

    /**
     * Test startMilestone returns 404 when milestone not found
     */
    public function testStartMilestoneReturnsNotFound(): void
    {
        $mockRecord = $this->createBuilder(['where', 'exists']);
        $mockRecord->method('where')
            ->with('id', 999)
            ->willReturnSelf();
        $mockRecord->method('exists')->willReturn(false);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockRecord);

        $action = $this->createAction($repository);
        $action->setRequestData([]);

        $response = $action->startMilestone(
            $this->createRequest(),
            $this->createResponse(),
            ['package_milestone_id' => '999']
        );

        self::assertSame(404, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame(false, $payload['data']['success']);
        self::assertSame('Package milestone not found.', $payload['data']['message']);
    }

    /**
     * Test startMilestone handles missing In Progress status
     */
    public function testStartMilestoneWithMissingInProgressStatus(): void
    {
        $mockStatuses = new FakeCollection([
            ['id' => 1, 'label' => 'Not Started'],
        ]);

        $mockRecord = $this->createBuilder(['where', 'exists', 'update']);
        $mockRecord->method('where')
            ->willReturnSelf();
        $mockRecord->method('exists')->willReturn(true);
        $mockRecord->expects(self::once())
            ->method('update')
            ->with(['package_milestone_status_id' => null])
            ->willReturn(true);

        $statusBuilder = $this->createBuilder(['get']);
        $statusBuilder->method('get')->willReturn($mockStatuses);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->expects(self::atLeast(2))
            ->method('getModel')
            ->willReturnCallback(function (string $model) use ($mockRecord, $statusBuilder) {
                if ($model === 'packageMilestone') {
                    return $mockRecord;
                }
                return $statusBuilder;
            });

        $action = $this->createAction($repository);
        $action->setRequestData([]);

        $response = $action->startMilestone(
            $this->createRequest(),
            $this->createResponse(),
            ['package_milestone_id' => '10']
        );

        self::assertSame(200, $response->getStatusCode());
    }

    /**
     * Test completeMilestone updates status to Completed
     */
    public function testCompleteMilestoneUpdatesStatus(): void
    {
        $mockStatuses = new FakeCollection([
            ['id' => 2, 'label' => 'In Progress'],
            ['id' => 3, 'label' => 'Completed'],
        ]);

        $mockRecord = $this->createBuilder(['where', 'exists', 'first', 'update', 'value', 'join', 'orderBy', 'select', 'get']);
        $mockRecord->method('where')
            ->willReturnSelf();
        $mockRecord->method('exists')->willReturn(true);
        $mockRecord->method('first')
            ->willReturn(new \Tests\TestDoubles\FakeRecord([
                'id' => 10,
                'actual_start_date' => '2024-01-01 10:00:00',
                'actual_end_date' => '2024-01-05 10:00:00',
            ]));
        $mockRecord->expects(self::once())
            ->method('update')
            ->with([
                'actual_end_date' => '2024-01-05',
                'package_milestone_status_id' => 3,
            ])
            ->willReturn(true);

        // Support the later listing query chain used by completeMilestone
        $mockRecord->method('join')->willReturnSelf();
        $mockRecord->method('orderBy')->willReturnSelf();
        $mockRecord->method('select')->willReturnSelf();
        $mockRecord->method('get')->willReturn(new FakeCollection([
            [
                'id' => 10,
                'label' => 'Completed Milestone',
                'lead_time' => 5,
                'sort_order' => 1,
                'type' => 'type',
                'planned_start_date' => '2024-01-01',
                'planned_end_date' => '2024-01-05',
                'actual_start_date' => '2024-01-01',
                'actual_end_date' => '2024-01-05',
                'status' => 'Completed',
            ],
        ]));
        $mockRecord->method('value')->with('package_id')->willReturn(1);

        $statusBuilder = $this->createBuilder(['get']);
        $statusBuilder->method('get')->willReturn($mockStatuses);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->expects(self::atLeast(2))
            ->method('getModel')
            ->willReturnCallback(function (string $model) use ($mockRecord, $statusBuilder) {
                if ($model === 'packageMilestone') {
                    return $mockRecord;
                }
                return $statusBuilder;
            });

        $action = $this->createAction($repository);
        $action->setRequestData(['actual_end_date' => '2024-01-05']);

        $response = $action->completeMilestone(
            $this->createRequest(),
            $this->createResponse(),
            ['package_milestone_id' => '10']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame(true, $payload['data']['success']);
    }

    /**
     * Test completeMilestone returns 404 when milestone not found
     */
    public function testCompleteMilestoneReturnsNotFound(): void
    {
        $mockRecord = $this->createBuilder(['where', 'exists']);
        $mockRecord->method('where')
            ->with('id', 999)
            ->willReturnSelf();
        $mockRecord->method('exists')->willReturn(false);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->method('getModel')
            ->with('packageMilestone')
            ->willReturn($mockRecord);

        $action = $this->createAction($repository);
        $action->setRequestData([]);

        $response = $action->completeMilestone(
            $this->createRequest(),
            $this->createResponse(),
            ['package_milestone_id' => '999']
        );

        self::assertSame(404, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true);
        self::assertSame(false, $payload['data']['success']);
    }

    /**
     * Test completeMilestone handles missing Completed status
     */
    public function testCompleteMilestoneWithMissingCompletedStatus(): void
    {
        $mockStatuses = new FakeCollection([
            ['id' => 2, 'label' => 'In Progress'],
        ]);

        $mockRecord = $this->createBuilder(['where', 'exists', 'first', 'update', 'value', 'join', 'orderBy', 'select', 'get']);
        $mockRecord->method('where')
            ->willReturnSelf();
        $mockRecord->method('exists')->willReturn(true);
        $mockRecord->method('first')
            ->willReturn(new \Tests\TestDoubles\FakeRecord([
                'id' => 10,
                'actual_start_date' => '2024-01-01 10:00:00',
                'package_id' => 1
            ]));
        $mockRecord->expects(self::once())
            ->method('update')
            ->with(['actual_end_date' => '2024-01-05', 'package_milestone_status_id' => null])
            ->willReturn(true);

        // Support the later listing query chain used by completeMilestone
        $mockRecord->method('join')->willReturnSelf();
        $mockRecord->method('orderBy')->willReturnSelf();
        $mockRecord->method('select')->willReturnSelf();
        $mockRecord->method('get')->willReturn(new FakeCollection([]));
        $mockRecord->method('value')->with('package_id')->willReturn(1);

        $statusBuilder = $this->createBuilder(['get']);
        $statusBuilder->method('get')->willReturn($mockStatuses);

        $repository = $this->createMock(MilestoneRepository::class);
        $repository->expects(self::atLeast(2))
            ->method('getModel')
            ->willReturnCallback(function (string $model) use ($mockRecord, $statusBuilder) {
                if ($model === 'packageMilestone') {
                    return $mockRecord;
                }
                return $statusBuilder;
            });

        $action = $this->createAction($repository);
        $action->setRequestData(['actual_end_date' => '2024-01-05']);

        $response = $action->completeMilestone(
            $this->createRequest(),
            $this->createResponse(),
            ['package_milestone_id' => '10']
        );

        self::assertSame(200, $response->getStatusCode());
    }

    /**
     * Helper to create a MilestoneAction with mocked dependencies
     */
    private function createAction(
        MilestoneRepository $repository,
        ?LoggerInterface $logger = null
    ): TestableMilestoneAction {
        return new TestableMilestoneAction(
            $logger ?? $this->createMock(LoggerInterface::class),
            $repository
        );
    }

    /**
     * Helper to create a mock builder
     */
    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)->addMethods($methods)->getMock();
    }

    /**
     * Helper to create a PSR-7 request
     */
    private function createRequest(array $query = []): \Psr\Http\Message\ServerRequestInterface
    {
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/v1/milestone');
        if ($query) {
            $request = $request->withQueryParams($query);
        }

        return $request;
    }

    /**
     * Helper to create a PSR-7 response
     */
    private function createResponse(): \Psr\Http\Message\ResponseInterface
    {
        return $this->responseFactory->createResponse();
    }
}

/**
 * Testable version of MilestoneAction that allows setting request data
 */
class TestableMilestoneAction extends MilestoneAction
{
    private ?array $requestData = null;

    public function setRequestData(array $data): void
    {
        $this->requestData = $data;
    }

    public function getData($k = null, $default = null)
    {
        if ($this->requestData !== null) {
            if ($k !== null) {
                return $this->requestData[$k] ?? $default;
            }

            return $this->requestData;
        }

        return parent::getData($k, $default);
    }
}
