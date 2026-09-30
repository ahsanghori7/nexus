<?php

declare(strict_types=1);

namespace Tests\Unit\Action;

use App\Application\Actions\Project\ProjectAction;
use App\Domain\AbstractModel;
use App\Domain\Project\Integration\ProjectIntegration;
use App\Domain\Project\ProjectRepository;
use Illuminate\Database\Capsule\Manager as Capsule;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Tests\TestDoubles\FakeCollection;

class ProjectActionTest extends TestCase
{
    private ResponseFactory $responseFactory;

    protected function setUp(): void
    {
        $this->responseFactory = new ResponseFactory();
    }

    public function testListReturnsProjects(): void
    {
        $builder = $this->createBuilder(['with', 'where', 'get']);
        $builder->method('with')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 1, 'name' => 'Demo'],
        ]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->list($this->createRequest(), $this->createResponse());

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('Demo', (string) $response->getBody());
    }

    public function testListAppliesQueryAndAuthorFilters(): void
    {
        $builder = $this->createBuilder(['with', 'where', 'orWhere', 'whereIn', 'orWhereIn', 'get']);
        $builder->method('with')->willReturnSelf();
        $builder->expects(self::exactly(2))
            ->method('where')
            ->willReturnCallback(function ($arg) use ($builder) {
                if (is_callable($arg)) {
                    $arg($builder);
                    return $builder;
                }
                self::assertSame(['status' => 'active'], $arg);
                return $builder;
            });
        $builder->expects(self::once())->method('orWhere')->with('name', 'LIKE', '%Alpha%')->willReturnSelf();
        $builder->expects(self::once())->method('whereIn')->with('author_id', ['1', '2'])->willReturnSelf();
        $builder->expects(self::once())->method('orWhereIn')->with('group_id', ['1', '2'])->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 2, 'name' => 'Alpha'],
        ]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturn($builder);

        $action = $this->createAction($repository);
        $request = $this->createRequest([
            'query' => 'Alpha',
            'author_ids' => '[1,2]',
            'status' => 'active',
        ]);
        $response = $action->list($request, $this->createResponse());

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('Alpha', (string) $response->getBody());
    }

    public function testGetByIdReturnsNotFoundWhenMissing(): void
    {
        $builder = $this->createBuilder(['with', 'where', 'get']);
        $builder->method('with')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getById($this->createRequest(), $this->createResponse(), ['id' => 99]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetByIdReturnsPayloadWhenFound(): void
    {
        $builder = $this->createBuilder(['with', 'where', 'get']);
        $builder->method('with')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 5, 'name' => 'Sample'],
        ]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getById($this->createRequest(), $this->createResponse(), ['id' => 5]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('Sample', (string) $response->getBody());
    }

    public function testCreateReturnsSuccessWhenProjectDoesNotExist(): void
    {
        $model = $this->createBuilder(['load', 'isLoaded']);
        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturn($model);
        // Creation is wrapped in a transaction; run the unit of work inline.
        $repository->method('transaction')->willReturnCallback(static fn(callable $work) => $work());
        $repository->expects(self::once())->method('generateSlug')->willReturn('demo-slug');
        $repository->expects(self::once())->method('create')->with(self::callback(function (array $data) {
            return $data['slug'] === 'demo-slug';
        }))->willReturn(42);
        $repository->expects(self::once())->method('createProjectMapping')->with([
            'project_id' => 42,
            'owner_id' => 10,
        ]);

        $action = $this->createAction($repository);
        $action->setRequestData([
            'name' => ' Demo ',
            'group_id' => 10,
        ]);

        $response = $action->create($this->createRequest(), $this->createResponse());
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"status": true', (string) $response->getBody());
    }

    public function testCreateReturnsValidationErrorWhenProjectExists(): void
    {
        $model = $this->createBuilder(['load', 'isLoaded']);
        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(true);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturn($model);

        $action = $this->createAction($repository);
        $action->setRequestData(['name' => 'Existing', 'group_id' => 1]);

        $response = $action->create($this->createRequest(), $this->createResponse());

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"status": false', (string) $response->getBody());
    }

    public function testCreateReturnsBadRequestWhenBodyMissing(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $action = $this->createAction($repository);

        $response = $action->create($this->createRequest(), $this->createResponse());
        self::assertSame(400, $response->getStatusCode());
    }

    public function testUpdateTransactionReturnsNoContentWhenFound(): void
    {
        $transaction = $this->createBuilder(['find', 'exists', 'store', 'load', 'getData']);

        $transaction->method('load')->willReturnSelf();
        $transaction->method('exists')->willReturn(true);
        $transaction->method('getData')->with('price')->willReturn('100');
        $transaction->expects(self::once())
            ->method('store')
            ->with(['field' => 'value', 'price' => '100']);

        $tenderRecommendation = $this->createBuilder(['where', 'first']);

        $tenderRecommendation->method('where')->willReturnSelf();
        $tenderRecommendation->method('first')->willReturn(null);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')
            ->willReturnMap([
                ['transaction', $transaction],
                ['tender_recommendation', $tenderRecommendation],
            ]);

        $action = $this->createAction($repository);
        $action->setRequestData(['field' => 'value', 'price' => '100']);

        $response = $action->updateTransaction(
            $this->createRequest(),
            $this->createResponse(),
            ['tid' => 5]
        );

        self::assertSame(203, $response->getStatusCode());
    }

    public function testUpdateTransactionReturnsNotFoundWhenMissing(): void
    {
        $transaction = $this->createBuilder(['find', 'exists', 'store', 'load', 'getData']);

        $transaction->method('load')->willReturnSelf();
        $transaction->method('exists')->willReturn(false);
        $transaction->method('getData')->with('price')->willReturn('100');
        $transaction->expects(self::never())
            ->method('store')
            ->with(['field' => 'value', 'price' => '100']);

        $tenderRecommendation = $this->createBuilder(['where', 'first']);

        $tenderRecommendation->method('where')->willReturnSelf();
        $tenderRecommendation->method('first')->willReturn(null);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')
            ->willReturnMap([
                ['transaction', $transaction],
                ['tender_recommendation', $tenderRecommendation],
            ]);

        $action = $this->createAction($repository);
        $action->setRequestData([
            'field' => 'value',
            'price' => '100',
        ]);
        $response = $action->updateTransaction($this->createRequest(), $this->createResponse(), ['tid' => 5]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testDeleteTransactionByIdReturnsNoContent(): void
    {
        $transaction = $this->createBuilder(['deleteBy']);
        $transaction->expects(self::once())->method('deleteBy')->with(['id' => 9]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('transaction')->willReturn($transaction);

        $action = $this->createAction($repository);
        $response = $action->deleteTransactionById($this->createRequest(), $this->createResponse(), ['tid' => 9]);

        self::assertSame(203, $response->getStatusCode());
    }

    public function testListPackagesReturnsPayload(): void
    {
        $builder = $this->createBuilder(['where', 'exists', 'with', 'get']);
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('with')->with('packages')->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([['label' => 'Pkg']]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $action = $this->createAction($repository);
        $request = $this->createRequest(['status' => 1]);
        $response = $action->listPackages($request, $this->createResponse(), ['id' => 5]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('Pkg', (string) $response->getBody());
    }

    public function testListPackagesReturnsEmptyArrayWhenMissing(): void
    {
        $builder = $this->createBuilder(['where', 'exists']);
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listPackages($this->createRequest(), $this->createResponse(), ['id' => 5]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('[]', (string) $response->getBody());
    }

    public function testDeleteByGroupIdDeletesProjects(): void
    {
        $model = $this->createBuilder(['deleteBy']);
        $model->expects(self::once())->method('deleteBy')->with(['group_id' => 77]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->willReturn($model);

        $action = $this->createAction($repository);
        $response = $action->deleteByGroupId($this->createRequest(), $this->createResponse(), ['id' => 77]);

        self::assertSame(203, $response->getStatusCode());
    }

    public function testUpdateTenderReturnsNoContentWhenFound(): void
    {
        TenderPackageMappingDeleteDouble::reset();

        $group = $this->createBuilder(['exists', 'getId']);
        $group->method('exists')->willReturn(true);
        $group->method('getId')->willReturn(11);
        $group->service = 'Consultant';
        $group->start_on_site = '2026-01-01';

        $initial = $this->createBuilder(['where', 'find']);
        $initial->method('where')->willReturnSelf();
        $initial->method('find')->willReturn($group);

        $mapping = new TenderPackageMappingDeleteDouble();

        $updater = $this->createBuilder(['where', 'update']);
        $updater->method('where')->willReturnSelf();
        $updater->expects(self::once())->method('update')->with(['label' => 'Updated', 'status' => 'ready']);

        $updatedTender = $this->createBuilder(['toArray']);
        $updatedTender->method('toArray')->willReturn(['id' => 11, 'label' => 'Updated', 'status' => 'ready']);

        $refetcher = $this->createBuilder(['where', 'with', 'first']);
        $refetcher->method('where')->willReturnSelf();
        $refetcher->method('with')->willReturnSelf();
        $refetcher->method('first')->willReturn($updatedTender);

        $tenderCalls = 0;
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::exactly(4))
            ->method('getModel')
            ->willReturnCallback(function (string $name) use (&$tenderCalls, $initial, $updater, $refetcher, $mapping) {
                if ($name === 'package') {
                    return $mapping;
                }
                $tenderCalls++;
                return match ($tenderCalls) {
                    1 => $initial,
                    2 => $updater,
                    default => $refetcher,
                };
            });
        $repository->method('resolveTenderStatus')->willReturn('ready');

        $action = $this->createAction($repository);
        $action->setRequestData(['label' => 'Updated']);

        $response = $action->updateTender($this->createRequest(), $this->createResponse(), ['id' => 5, 'tid' => 9]);
        self::assertSame(200, $response->getStatusCode());
        $body = json_decode((string) $response->getBody(), true);
        self::assertSame(['id' => 11, 'label' => 'Updated', 'status' => 'ready'], $body['data']);
        self::assertNull(TenderPackageMappingDeleteDouble::$deletedTenderId);
    }

    public function testUpdateTenderDeletesAllPackagesWhenPackagesEmpty(): void
    {
        TenderPackageMappingDeleteDouble::reset();

        $group = $this->createBuilder(['exists', 'getId']);
        $group->method('exists')->willReturn(true);
        $group->method('getId')->willReturn(11);
        $group->service = 'Consultant';
        $group->start_on_site = '2026-01-01';

        $initial = $this->createBuilder(['where', 'find']);
        $initial->method('where')->willReturnSelf();
        $initial->method('find')->willReturn($group);

        $mapping = new TenderPackageMappingDeleteDouble();

        $updater = $this->createBuilder(['where', 'update']);
        $updater->method('where')->willReturnSelf();
        $updater->expects(self::once())->method('update')->with(['label' => 'Updated', 'status' => 'ready']);

        $updatedTender = $this->createBuilder(['toArray']);
        $updatedTender->method('toArray')->willReturn(['id' => 11, 'label' => 'Updated', 'status' => 'ready']);

        $refetcher = $this->createBuilder(['where', 'with', 'first']);
        $refetcher->method('where')->willReturnSelf();
        $refetcher->method('with')->willReturnSelf();
        $refetcher->method('first')->willReturn($updatedTender);

        $tenderCalls = 0;
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::exactly(4))
            ->method('getModel')
            ->willReturnCallback(function (string $name) use (&$tenderCalls, $initial, $updater, $refetcher, $mapping) {
                if ($name === 'package') {
                    return $mapping;
                }
                $tenderCalls++;
                return match ($tenderCalls) {
                    1 => $initial,
                    2 => $updater,
                    default => $refetcher,
                };
            });
        $repository->method('resolveTenderStatus')->willReturn('ready');

        $action = $this->createAction($repository);
        $action->setRequestData(['label' => 'Updated', 'packages' => []]);

        $response = $action->updateTender($this->createRequest(), $this->createResponse(), ['id' => 5, 'tid' => 9]);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame(11, TenderPackageMappingDeleteDouble::$deletedTenderId);
        self::assertNull(TenderPackageMappingDeleteDouble::$removedPackageIds);
        self::assertNull(TenderPackageMappingDeleteDouble::$insertedRows);
    }

    public function testUpdateTenderSyncsPackagesWhenPackagesProvided(): void
    {
        TenderPackageMappingDeleteDouble::reset();
        TenderPackageMappingDeleteDouble::$existingPackageIds = [1, 2];

        $group = $this->createBuilder(['exists', 'getId']);
        $group->method('exists')->willReturn(true);
        $group->method('getId')->willReturn(11);
        $group->service = 'Consultant';
        $group->start_on_site = '2026-01-01';

        $initial = $this->createBuilder(['where', 'find']);
        $initial->method('where')->willReturnSelf();
        $initial->method('find')->willReturn($group);

        $mapping = new TenderPackageMappingDeleteDouble();

        $updater = $this->createBuilder(['where', 'update']);
        $updater->method('where')->willReturnSelf();
        $updater->expects(self::once())->method('update')->with(['label' => 'Updated', 'status' => 'ready']);

        $updatedTender = $this->createBuilder(['toArray']);
        $updatedTender->method('toArray')->willReturn(['id' => 11, 'label' => 'Updated', 'status' => 'ready']);

        $refetcher = $this->createBuilder(['where', 'with', 'first']);
        $refetcher->method('where')->willReturnSelf();
        $refetcher->method('with')->willReturnSelf();
        $refetcher->method('first')->willReturn($updatedTender);

        $tenderCalls = 0;
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::exactly(4))
            ->method('getModel')
            ->willReturnCallback(function (string $name) use (&$tenderCalls, $initial, $updater, $refetcher, $mapping) {
                if ($name === 'package') {
                    return $mapping;
                }
                $tenderCalls++;
                return match ($tenderCalls) {
                    1 => $initial,
                    2 => $updater,
                    default => $refetcher,
                };
            });
        $repository->method('resolveTenderStatus')->willReturn('ready');

        $action = $this->createAction($repository);
        $action->setRequestData(['label' => 'Updated', 'packages' => [2, 3]]);

        $response = $action->updateTender($this->createRequest(), $this->createResponse(), ['id' => 5, 'tid' => 9]);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame([1], array_values(TenderPackageMappingDeleteDouble::$removedPackageIds));
        self::assertSame(
            [['tender_id' => 11, 'package_id' => 3]],
            array_values(TenderPackageMappingDeleteDouble::$insertedRows)
        );
    }

    public function testUpdateTenderReturnsNotFoundWhenGroupMissing(): void
    {
        $group = $this->createBuilder(['exists']);
        $group->method('exists')->willReturn(false);

        $initial = $this->createBuilder(['where', 'find']);
        $initial->method('where')->willReturnSelf();
        $initial->method('find')->willReturn($group);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($initial);

        $action = $this->createAction($repository);
        $response = $action->updateTender($this->createRequest(), $this->createResponse(), ['id' => 5, 'tid' => 9]);
        self::assertSame(404, $response->getStatusCode());
    }

    public function testListTransactionByProjectIdFiltersNullTenders(): void
    {
        $inner = $this->createBuilder(['where']);
        $inner->expects(self::once())->method('where')->with('project_id', 7);

        $builder = $this->createBuilder(['with', 'exists', 'get']);
        $builder->expects(self::once())
            ->method('with')
            ->with($this->callback(function ($relations) use ($inner): bool {
                self::assertIsArray($relations);
                self::assertArrayHasKey('tender', $relations);
                $relations['tender']($inner);
                return true;
            }))
            ->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 1, 'tender' => ['id' => 10]],
            ['id' => 2, 'tender' => null],
        ]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('transaction')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listTransactionByProjectId(
            $this->createRequest(),
            $this->createResponse(),
            ['id' => 7]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertCount(1, $payload['data']);
        self::assertSame(1, $payload['data'][0]['id']);
    }

    public function testListTransactionByProjectIdReturnsNotFoundWhenMissing(): void
    {
        $builder = $this->createBuilder(['with', 'exists']);
        $builder->method('with')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('transaction')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listTransactionByProjectId(
            $this->createRequest(),
            $this->createResponse(),
            ['id' => 9]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetTenderTransactionByIdReturnsPayload(): void
    {
        $inner = $this->createBuilder(['where', 'orderBy']);
        $inner->expects(self::once())->method('where')->with(['status_id' => 1])->willReturnSelf();
        $inner->expects(self::once())->method('orderBy')->with('quote_created', 'DESC')->willReturnSelf();

        $builder = $this->createBuilder(['where', 'with', 'exists', 'get']);
        $builder->method('where')->with('id', 5)->willReturnSelf();
        $builder->expects(self::once())
            ->method('with')
            ->with('transaction', self::callback(function ($callback) use ($inner): bool {
                $callback($inner);
                return true;
            }))
            ->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('get')->willReturn(new FakeCollection([['id' => 5, 'label' => 'T']]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $action = $this->createAction($repository);
        $request = $this->createRequest(['status_id' => 1]);
        $response = $action->getTenderTransactionById($request, $this->createResponse(), ['tid' => 5]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"label": "T"', (string) $response->getBody());
    }

    public function testGetTenderTransactionByIdReturnsNotFound(): void
    {
        $builder = $this->createBuilder(['where', 'with', 'exists']);
        $builder->method('where')->willReturnSelf();
        $builder->method('with')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getTenderTransactionById($this->createRequest(), $this->createResponse(), ['tid' => 5]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetTenderHistoryByIdReturnsPayload(): void
    {
        $inner = $this->createBuilder(['where', 'orderBy']);
        $inner->expects(self::once())->method('where')->with(['status_id' => 2])->willReturnSelf();
        $inner->expects(self::exactly(2))
            ->method('orderBy')
            ->withAnyParameters()
            ->willReturnCallback(function (string $field, string $direction) use ($inner) {
                static $calls = 0;
                $calls++;
                if ($calls === 1) {
                    TestCase::assertSame('created_at', $field);
                    TestCase::assertSame('DESC', $direction);
                } elseif ($calls === 2) {
                    TestCase::assertSame('id', $field);
                    TestCase::assertSame('DESC', $direction);
                }

                return $inner;
            });

        $builder = $this->createBuilder(['where', 'with', 'exists', 'get']);
        $builder->method('where')->with('id', 12)->willReturnSelf();
        $builder->expects(self::once())
            ->method('with')
            ->with('history', self::callback(function ($callback) use ($inner): bool {
                $callback($inner);
                return true;
            }))
            ->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('get')->willReturn(new FakeCollection([['history' => [['id' => 1]]]]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $action = $this->createAction($repository);
        $request = $this->createRequest(['status_id' => 2]);
        $response = $action->getTenderHistoryById($request, $this->createResponse(), ['tid' => 12]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"history"', (string) $response->getBody());
    }

    public function testGetTenderHistoryByIdReturnsNotFound(): void
    {
        $builder = $this->createBuilder(['where', 'with', 'exists']);
        $builder->method('where')->willReturnSelf();
        $builder->method('with')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getTenderHistoryById($this->createRequest(), $this->createResponse(), ['tid' => 1]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testDeleteTenderHistoryByIdDeletesRecordWhenExists(): void
    {
        $builder = $this->createBuilder(['where', 'exists', 'delete']);
        $builder->method('where')->with('id', 3)->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->expects(self::once())->method('delete');

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tenderHistory')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->deleteTenderHistoryById($this->createRequest(), $this->createResponse(), ['hid' => 3]);

        self::assertSame(203, $response->getStatusCode());
    }

    public function testDeleteTenderHistoryByIdReturnsNotFoundWhenMissing(): void
    {
        $builder = $this->createBuilder(['where', 'exists']);
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tenderHistory')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->deleteTenderHistoryById($this->createRequest(), $this->createResponse(), ['hid' => 1]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetSummaryReturnsAggregatedData(): void
    {
        $project = $this->createBuilder(['where', 'exists', 'get']);
        $project->method('where')->with(['id' => 5])->willReturnSelf();
        $project->method('exists')->willReturn(true);
        $project->method('get')->willReturn(new FakeCollection([['project' => 'data']]));

        $tender = $this->createBuilder(['select', 'leftJoin', 'join', 'where']);
        $tender->method('select')->willReturnSelf();
        $tender->method('leftJoin')->willReturnSelf();
        $tender->method('join')->willReturnSelf();
        $tender->method('where')->willReturnSelf();

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::exactly(2))
            ->method('getModel')
            ->willReturnCallback(function (string $name) use ($project, $tender) {
                if ($name === 'project') {
                    return $project;
                }
                self::assertSame('tender', $name);
                return $tender;
            });
        $repository->expects(self::once())->method('getSummary')->with($tender)->willReturn(['totals' => 1]);

        $action = $this->createAction($repository);
        $request = $this->createRequest(['status_id' => 3]);
        $response = $action->getSummary($request, $this->createResponse(), ['id' => 5]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"totals": 1', (string) $response->getBody());
    }

    public function testGetSummaryReturnsNotFoundWhenProjectMissing(): void
    {
        $project = $this->createBuilder(['where', 'exists']);
        $project->method('where')->willReturnSelf();
        $project->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project')->willReturn($project);

        $action = $this->createAction($repository);
        $response = $action->getSummary($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testListTransactionsMergesProjectData(): void
    {
        $project = $this->createBuilder(['where', 'exists', 'get']);
        $project->method('where')->with(['id' => 8])->willReturnSelf();
        $project->method('exists')->willReturn(true);
        $project->method('get')->willReturn(new FakeCollection([['name' => 'Project']]));

        $transactionModel = $this->createBuilder(['getLatestQuotes']);
        $transactionModel->expects(self::once())->method('getLatestQuotes')->with(8)->willReturn(['latest' => true]);

        $tenderModel = $this->createBuilder(['getTenderQuotes']);
        $tenderModel->expects(self::once())->method('getTenderQuotes')->with(8, ['latest' => true])->willReturn(['tenders' => []]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::exactly(3))
            ->method('getModel')
            ->willReturnCallback(function (string $name) use ($project, $transactionModel, $tenderModel) {
                return match ($name) {
                    'project' => $project,
                    'transaction' => $transactionModel,
                    'tender' => $tenderModel,
                    default => throw new \RuntimeException('Unexpected model ' . $name),
                };
            });
        $repository->expects(self::once())
            ->method('aggregateTenderTransaction')
            ->with(['tenders' => []], 4, 2)
            ->willReturn([8 => ['value' => 50]]);

        $action = $this->createAction($repository);
        $request = $this->createRequest(['type_id' => 2, 'status_id' => 4]);
        $response = $action->listTransactions($request, $this->createResponse(), ['id' => 8]);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame('Project', $payload['data'][8]['name']);
        self::assertSame(50, $payload['data'][8]['value']);
    }

    public function testListTransactionsReturnsNotFoundWhenProjectMissing(): void
    {
        $project = $this->createBuilder(['where', 'exists']);
        $project->method('where')->willReturnSelf();
        $project->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project')->willReturn($project);

        $action = $this->createAction($repository);
        $response = $action->listTransactions($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testListTransactionsFilesAggregatesFiles(): void
    {
        $project = $this->createBuilder(['where', 'exists']);
        $project->method('where')->with(['id' => 11])->willReturnSelf();
        $project->method('exists')->willReturn(true);

        $transactionModel = $this->createBuilder(['getLatestQuotes']);
        $transactionModel->expects(self::once())->method('getLatestQuotes')->with(11)->willReturn(['latest' => true]);

        $tenderModel = $this->createBuilder(['getTenderQuotes']);
        $tenderModel->expects(self::once())->method('getTenderQuotes')->with(11, ['latest' => true])->willReturn(['tenders' => []]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::exactly(3))
            ->method('getModel')
            ->willReturnCallback(function (string $name) use ($project, $transactionModel, $tenderModel) {
                return match ($name) {
                    'project' => $project,
                    'transaction' => $transactionModel,
                    'tender' => $tenderModel,
                    default => throw new \RuntimeException('Unexpected model ' . $name),
                };
            });
        $repository->expects(self::once())
            ->method('aggregateTenderTransactionFiles')
            ->with(['tenders' => []])
            ->willReturn(['files' => ['a.pdf']]);

        $action = $this->createAction($repository);
        $response = $action->listTransactionsFiles($this->createRequest(), $this->createResponse(), ['id' => 11]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('a.pdf', (string) $response->getBody());
    }

    public function testListTransactionsFilesReturnsNotFoundWhenProjectMissing(): void
    {
        $project = $this->createBuilder(['where', 'exists']);
        $project->method('where')->willReturnSelf();
        $project->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project')->willReturn($project);

        $action = $this->createAction($repository);
        $response = $action->listTransactionsFiles($this->createRequest(), $this->createResponse(), ['id' => 2]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testListTransactionDocumentsReturnsGroupedMetadata(): void
    {
        $project = $this->createBuilder(['where', 'exists']);
        $project->method('where')->with(['id' => 11])->willReturnSelf();
        $project->method('exists')->willReturn(true);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project')->willReturn($project);
        $repository->expects(self::once())
            ->method('getTransactionDocumentsByProject')
            ->with(11)
            ->willReturn([
                4 => [
                    9 => [
                        'count' => 1,
                        'documents' => [
                            ['id' => 2, 'name' => 'quote.pdf', 'quote_version' => 1, 'created_at' => '2026-01-01 10:00:00'],
                        ],
                    ],
                ],
            ]);

        $action = $this->createAction($repository);
        $response = $action->listTransactionDocuments($this->createRequest(), $this->createResponse(), ['id' => 11]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('quote.pdf', (string) $response->getBody());
    }

    public function testListTransactionDocumentsReturnsNotFoundWhenProjectMissing(): void
    {
        $project = $this->createBuilder(['where', 'exists']);
        $project->method('where')->willReturnSelf();
        $project->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project')->willReturn($project);

        $action = $this->createAction($repository);
        $response = $action->listTransactionDocuments($this->createRequest(), $this->createResponse(), ['id' => 2]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testListTendersReturnsAggregatedHistory(): void
    {
        $project = $this->createBuilder(['where', 'exists']);
        $project->method('where')->with(['id' => 5])->willReturnSelf();
        $project->method('exists')->willReturn(true);

        $tender = $this->createBuilder(['select', 'leftJoin', 'join', 'where']);
        $tender->method('select')->willReturnSelf();
        $tender->method('leftJoin')->willReturnSelf();
        $tender->method('join')->willReturnSelf();
        $tender->method('where')->with(['status' => 1, 'project_id' => 5])->willReturnSelf();

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::exactly(2))
            ->method('getModel')
            ->willReturnCallback(function (string $name) use ($project, $tender) {
                if ($name === 'project') {
                    return $project;
                }
                self::assertSame('tender', $name);
                return $tender;
            });
        $repository->expects(self::once())->method('aggregateTenderHistory')->with($tender)->willReturn(['history' => []]);

        $action = $this->createAction($repository);
        $request = $this->createRequest(['status' => 1]);
        $response = $action->listTenders($request, $this->createResponse(), ['id' => 5]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"history"', (string) $response->getBody());
    }

    public function testListTendersReturnsNotFoundWhenProjectMissing(): void
    {
        $project = $this->createBuilder(['where', 'exists']);
        $project->method('where')->willReturnSelf();
        $project->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project')->willReturn($project);

        $action = $this->createAction($repository);
        $response = $action->listTenders($this->createRequest(), $this->createResponse(), ['id' => 7]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetProcurementDefaultsToFullHistory(): void
    {
        $tender = $this->createBuilder(['select', 'leftJoin', 'join', 'where', 'whereIn', 'orWhereNull', 'exists']);
        $tender->method('select')->willReturnSelf();
        $tender->method('leftJoin')->willReturnSelf();
        $tender->method('join')->willReturnSelf();
        $tender->method('whereIn')->willReturnSelf();
        $tender->method('orWhereNull')->willReturnSelf();
        $tender->method('where')->willReturnCallback(function ($arg) use ($tender) {
            if (is_callable($arg)) {
                $arg($tender);
            }
            return $tender;
        });
        $tender->method('exists')->willReturn(true);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())->method('getModel')->with('tender')->willReturn($tender);
        $repository->expects(self::once())
            ->method('aggregateTenderHistory')
            ->with($tender, false)
            ->willReturn(['history' => []]);

        $action = $this->createAction($repository);
        $response = $action->getProcurement($this->createRequest(), $this->createResponse(), ['id' => 9]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"history"', (string) $response->getBody());
    }

    /**
     * `history=latest` builds a real query (joinSub + window function) rather than one that can be
     * driven through a mocked repository, so this asserts on the compiled SQL instead of executing
     * it — no live database is needed since Eloquent only opens a connection when a query actually
     * runs, and ->toSql() just compiles. Full behavioral coverage (tie-break winner, tenders with no
     * history preserved) is in tests/Integration/Application/Actions/Project/ProjectActionTest.php,
     * which runs against a real database.
     */
    public function testBuildProcurementModelWithLatestHistoryOnlyGeneratesDeterministicRankedQuery(): void
    {
        $capsule = new Capsule();
        $capsule->addConnection([
            'driver' => 'mysql',
            'host' => '127.0.0.1',
            'database' => 'project_service',
            'username' => 'root',
            'password' => '',
            'charset' => 'utf8',
            'collation' => 'utf8_unicode_ci',
            'prefix' => '',
        ]);
        $capsule->setAsGlobal();
        $capsule->bootEloquent();

        $action = $this->createAction(new ProjectRepository());

        $method = new \ReflectionMethod($action, 'buildProcurementModelWithLatestHistoryOnly');
        $method->setAccessible(true);
        $model = $method->invoke($action, 22661);

        $sql = $model->toSql();

        self::assertStringContainsString(
            'ROW_NUMBER() OVER (PARTITION BY tender_id, tender_history_type, specialist_id ORDER BY created_at DESC, id DESC)',
            $sql,
            'tie-break must be deterministic: created_at desc, then id desc'
        );
        self::assertStringContainsString('where `rn` = ?', $sql);
        self::assertStringContainsString('left join', $sql, 'tenders with no matching history row must still be returned');
        self::assertSame([22661, 'Interest', 'Enquiry', 1, 22661, 'Interest', 'Enquiry'], $model->getBindings());
    }

    public function testGetProcurementReturnsEmptyWhenTenderMissing(): void
    {
        $tender = $this->createBuilder(['select', 'leftJoin', 'join', 'where', 'whereIn', 'orWhereNull', 'exists']);
        $tender->method('select')->willReturnSelf();
        $tender->method('leftJoin')->willReturnSelf();
        $tender->method('join')->willReturnSelf();
        $tender->method('whereIn')->willReturnSelf();
        $tender->method('orWhereNull')->willReturnSelf();
        $tender->method('where')->willReturnCallback(function ($arg) use ($tender) {
            if (is_callable($arg)) {
                $arg($tender);
            }
            return $tender;
        });
        $tender->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($tender);
        $repository->expects(self::never())->method('aggregateTenderHistory');

        $action = $this->createAction($repository);
        $response = $action->getProcurement($this->createRequest(), $this->createResponse(), ['id' => 9]);

        self::assertSame(200, $response->getStatusCode());
    }

    public function testGetCustomerHealthScoreRunsProjectFilter(): void
    {
        $inner = $this->createBuilder(['whereIn']);
        $inner->expects(self::once())->method('whereIn')->with('project_id', ['1', '2'])->willReturnSelf();

        $transaction = $this->createBuilder(['with', 'get']);
        $transaction->expects(self::once())
            ->method('with')
            ->with($this->callback(function ($relations) use ($inner): bool {
                self::assertIsArray($relations);
                self::assertArrayHasKey('tender', $relations);
                $relations['tender']($inner);
                return true;
            }))
            ->willReturnSelf();
        $transaction->method('get')->willReturn(new FakeCollection([['id' => 1]]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('transaction')->willReturn($transaction);

        $action = $this->createAction($repository);
        $response = $action->getCustomerHealthScore(
            $this->createRequest(),
            $this->createResponse(),
            ['pids' => '[1,2]']
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 1', (string) $response->getBody());
    }

    public function testListStatusesReturnsPayload(): void
    {
        $builder = $this->createBuilder(['get']);
        $builder->method('get')->willReturn(new FakeCollection([['label' => 'Pending']]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project_entity_status')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listStatuses($this->createRequest(), $this->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('Pending', (string) $response->getBody());
    }

    public function testGetIntegrationReturnsBadRequestWhenProviderIdMissing(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::never())->method('getProjectIntegration');
        $logger = $this->createMock(LoggerInterface::class);
        $logger->expects(self::once())->method('warning')
            ->with(self::stringContains('provider_id'));

        $action = $this->createAction($repository, $logger);
        $response = $action->getIntegration(
            $this->createRequest(),
            $this->createResponse(),
            ['id' => 10, 'provider_id' => null]
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"data": []', (string)$response->getBody());
    }

    public function testGetIntegrationReturnsNotFoundWhenMissing(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())
            ->method('getProjectIntegration')
            ->with(12, 34)
            ->willReturn(null);

        $action = $this->createAction($repository);
        $response = $action->getIntegration(
            $this->createRequest(),
            $this->createResponse(),
            ['id' => 12, 'provider_id' => 34]
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"data": []', (string)$response->getBody());
    }

    public function testGetIntegrationReturnsPayload(): void
    {
        $integration = new ProjectIntegration();
        $integration->integration_id = 'node-1';
        $integration->integration_name = 'Folder A';
        $integration->integration_uri = '/workspace/folder-a';
        $integration->meta = json_encode(['k' => 'v']);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())
            ->method('getProjectIntegration')
            ->with(5, 6)
            ->willReturn($integration);

        $action = $this->createAction($repository);
        $response = $action->getIntegration(
            $this->createRequest(),
            $this->createResponse(),
            ['id' => 5, 'provider_id' => 6]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Folder A', $payload['data']['integration_name']);
        self::assertSame(['k' => 'v'], json_decode($payload['data']['meta'], true, 512, JSON_THROW_ON_ERROR));
    }

    public function testGetDependencyDelegatesToBulkRepositoryMethod(): void
    {
        $tenderBuilder = $this->createBuilder(['select', 'where', 'get']);
        $tenderBuilder->method('select')->with(['id'])->willReturnSelf();
        $tenderBuilder->method('where')->with(['project_id' => 9])->willReturnSelf();
        $tenderBuilder->method('get')->willReturn(new FakeCollection([
            ['id' => 11],
            ['id' => 15],
        ]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')
            ->willReturnMap([
                ['tender', $tenderBuilder],
            ]);
        $repository->expects(self::once())
            ->method('getProjectDependenciesByTenderIds')
            ->with([11, 15], 'children')
            ->willReturn([
                11 => [['tender_child_id' => 20]],
                15 => [],
            ]);

        $action = $this->createAction($repository);
        $response = $action->getDependency(
            $this->createRequest(['type' => 'children']),
            $this->createResponse(),
            ['id' => 9]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([
            'data' => [
                11 => [['tender_child_id' => 20]],
                15 => [],
            ],
        ], $payload);
    }

    public function testGetInterestsDelegatesToRepositoryMethod(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())
            ->method('getProjectInterests')
            ->with(9)
            ->willReturn([
                ['id' => 11, 'label' => 'Groundworks', 'cid' => 44],
            ]);

        $action = $this->createAction($repository);
        $response = $action->getInterests(
            $this->createRequest(),
            $this->createResponse(),
            ['id' => 9]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([
            'data' => [
                ['id' => 11, 'label' => 'Groundworks', 'cid' => 44],
            ],
        ], $payload);
    }

    public function testGetDashboardSummaryDelegatesToRepositoryMethod(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())
            ->method('getProjectDashboardSummary')
            ->with(9)
            ->willReturn([
                11 => [
                    'interest_count' => 2,
                    'enquiries_sent' => 1,
                    'unique_quote_count' => 3,
                    'total_quote_count' => 5,
                ],
            ]);

        $action = $this->createAction($repository);
        $response = $action->getDashboardSummary(
            $this->createRequest(),
            $this->createResponse(),
            ['id' => 9]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string)$response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([
            'data' => [
                11 => [
                    'interest_count' => 2,
                    'enquiries_sent' => 1,
                    'unique_quote_count' => 3,
                    'total_quote_count' => 5,
                ],
            ],
        ], $payload);
    }
    // -------------------------------------------------------------------------
    // bulkCreateTenderHistory
    // -------------------------------------------------------------------------

    public function testBulkCreateTenderHistoryReturnsBadRequestWhenRecordsMissing(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $action = $this->createAction($repository);

        $response = $action->bulkCreateTenderHistory($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testBulkCreateTenderHistoryReturnsBadRequestWhenRecordsNotArray(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $action = $this->createAction($repository);
        $action->setRequestData(['records' => 'not-an-array']);

        $response = $action->bulkCreateTenderHistory($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testBulkCreateTenderHistoryDelegatesToRepositoryAndReturnsResult(): void
    {
        $records = [
            ['tender_id' => 3, 'specialist_id' => 10, 'author_id' => 10, 'status_id' => 1, 'tender_history_type' => 'Interest'],
        ];

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())
            ->method('bulkAddTenderHistory')
            ->with(7, $records)
            ->willReturn(['inserted' => 1, 'skipped' => []]);

        $action = $this->createAction($repository);
        $action->setRequestData(['records' => $records]);

        $response = $action->bulkCreateTenderHistory($this->createRequest(), $this->createResponse(), ['id' => 7]);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame(1, $payload['data']['inserted']);
        self::assertSame([], $payload['data']['skipped']);
    }

    // -------------------------------------------------------------------------
    // constants
    // -------------------------------------------------------------------------

    public function testConstantsReturnsRepositoryConstants(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())->method('constants')->willReturn(['tender' => ['status' => []]]);

        $action = $this->createAction($repository);
        $response = $action->constants($this->createRequest(), $this->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"tender"', (string) $response->getBody());
    }

    // -------------------------------------------------------------------------
    // updateTenderHistoryById
    // -------------------------------------------------------------------------

    public function testUpdateTenderHistoryByIdReturnsNoContentWhenFound(): void
    {
        $builder = $this->createBuilder(['where', 'exists', 'update']);
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->expects(self::once())->method('update')->with(['status_id' => 2]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tenderHistory')->willReturn($builder);

        $action = $this->createAction($repository);
        $action->setRequestData(['status_id' => 2]);
        $response = $action->updateTenderHistoryById($this->createRequest(), $this->createResponse(), ['hid' => 5]);

        self::assertSame(203, $response->getStatusCode());
    }

    public function testUpdateTenderHistoryByIdReturnsNotFoundWhenMissing(): void
    {
        $builder = $this->createBuilder(['where', 'exists']);
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tenderHistory')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->updateTenderHistoryById($this->createRequest(), $this->createResponse(), ['hid' => 5]);

        self::assertSame(404, $response->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // createTenderHistory
    // -------------------------------------------------------------------------

    public function testCreateTenderHistoryReturnsIdWhenTenderExists(): void
    {
        $fakeHistory = $this->getMockBuilder(AbstractModel::class)
            ->disableOriginalConstructor()
            ->getMock();
        $fakeHistory->method('getId')->willReturn(99);

        $tenderBuilder = $this->createBuilder(['where', 'exists']);
        $tenderBuilder->method('where')->willReturnSelf();
        $tenderBuilder->method('exists')->willReturn(true);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($tenderBuilder);
        $repository->expects(self::once())
            ->method('addTenderHistory')
            ->with(self::callback(fn(array $d) => $d['tender_id'] === '12' && $d['specialist_id'] === 5))
            ->willReturn($fakeHistory);

        $action = $this->createAction($repository);
        $action->setRequestData(['specialist_id' => 5]);
        $response = $action->createTenderHistory(
            $this->createRequest(),
            $this->createResponse(),
            ['id' => 5, 'tid' => '12']
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 99', (string) $response->getBody());
    }

    public function testCreateTenderHistoryReturnsNotFoundWhenTenderMissing(): void
    {
        $tenderBuilder = $this->createBuilder(['where', 'exists']);
        $tenderBuilder->method('where')->willReturnSelf();
        $tenderBuilder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($tenderBuilder);

        $action = $this->createAction($repository);
        $response = $action->createTenderHistory(
            $this->createRequest(),
            $this->createResponse(),
            ['id' => 5, 'tid' => 7]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // createTender
    // -------------------------------------------------------------------------

    public function testCreateTenderReturnsBadRequestWhenBodyMissing(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $action = $this->createAction($repository);

        $response = $action->createTender($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testCreateTenderReturnsBadRequestWhenLabelMissing(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $action = $this->createAction($repository);
        $action->setRequestData(['packages' => [1, 2]]);

        $response = $action->createTender($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testCreateTenderReturnsIdWhenValid(): void
    {
        $group = $this->createBuilder(['getId']);
        $group->method('getId')->willReturn(55);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())
            ->method('createTender')
            ->with(3, 'Concrete', self::anything(), [10, 11])
            ->willReturn($group);

        $action = $this->createAction($repository);
        $action->setRequestData(['label' => 'Concrete', 'packages' => [10, 11]]);

        $response = $action->createTender($this->createRequest(), $this->createResponse(), ['id' => 3]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 55', (string) $response->getBody());
    }

    // -------------------------------------------------------------------------
    // bulkCreateTender
    // -------------------------------------------------------------------------

    public function testBulkCreateTenderReturnsBadRequestWhenTendersMissing(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $action = $this->createAction($repository);

        $response = $action->bulkCreateTender($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testBulkCreateTenderReturnsBadRequestWhenTendersNotArray(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $action = $this->createAction($repository);
        $action->setRequestData(['tenders' => 'not-an-array']);

        $response = $action->bulkCreateTender($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testBulkCreateTenderReturnsRepositoryResult(): void
    {
        $tenders = [
            ['label' => 'Concrete', 'packages' => [10, 11]],
            ['label' => 'Steel', 'packages' => [12]],
        ];

        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())
            ->method('bulkCreateTender')
            ->with(3, $tenders)
            ->willReturn(['created' => [55, 56], 'skipped' => []]);

        $action = $this->createAction($repository);
        $action->setRequestData(['tenders' => $tenders]);

        $response = $action->bulkCreateTender($this->createRequest(), $this->createResponse(), ['id' => 3]);

        self::assertSame(201, $response->getStatusCode());
        self::assertStringContainsString('"created"', (string) $response->getBody());
        self::assertStringContainsString('55', (string) $response->getBody());
    }

    // -------------------------------------------------------------------------
    // bulkDeleteTender
    // -------------------------------------------------------------------------

    public function testBulkDeleteTenderReturnsBadRequestWhenTenderIdsMissing(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::never())->method('bulkDeleteTender');

        $action = $this->createAction($repository);
        $response = $action->bulkDeleteTender($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testBulkDeleteTenderReturnsBadRequestWhenTenderIdsNotArray(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::never())->method('bulkDeleteTender');

        $action = $this->createAction($repository);
        $action->setRequestData(['tender_ids' => 'not-an-array']);

        $response = $action->bulkDeleteTender($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testBulkDeleteTenderDelegatesToRepositoryAndReturnsNoContent(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())
            ->method('bulkDeleteTender')
            ->with(3, [11, 15]);

        $action = $this->createAction($repository);
        $action->setRequestData(['tender_ids' => [11, 15]]);

        $response = $action->bulkDeleteTender($this->createRequest(), $this->createResponse(), ['id' => 3]);

        self::assertSame(203, $response->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // deleteTenderById
    // -------------------------------------------------------------------------

    public function testDeleteTenderByIdReturnsNoContent(): void
    {
        $model = $this->createBuilder(['deleteBy']);
        $model->expects(self::once())->method('deleteBy')->with(['id' => 4]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($model);

        $action = $this->createAction($repository);
        $response = $action->deleteTenderById($this->createRequest(), $this->createResponse(), ['tid' => 4]);

        self::assertSame(203, $response->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // togglePublishedState
    // -------------------------------------------------------------------------

    public function testTogglePublishedStatePublishesTenders(): void
    {
        $builder = $this->createBuilder(['where', 'update']);
        $builder->method('where')->willReturnSelf();
        $builder->expects(self::once())->method('update')->with(['state' => ProjectAction::TENDER_PUBLISHED_ID]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $action = $this->createAction($repository);
        $action->setRequestData(['toggle' => true]);
        $response = $action->togglePublishedState($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(203, $response->getStatusCode());
    }

    public function testTogglePublishedStateDraftsTenders(): void
    {
        $builder = $this->createBuilder(['where', 'update']);
        $builder->method('where')->willReturnSelf();
        $builder->expects(self::once())->method('update')->with(['state' => ProjectAction::TENDER_DRAFT_ID]);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($builder);

        $action = $this->createAction($repository);
        $action->setRequestData(['toggle' => false]);
        $response = $action->togglePublishedState($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(203, $response->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // generateSlug
    // -------------------------------------------------------------------------

    public function testGenerateSlugReturnsSlugFromRepository(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $repository->expects(self::once())->method('generateSlug')->with('Brickwork')->willReturn('brickwork');

        $action = $this->createAction($repository);
        $response = $action->generateSlug($this->createRequest(), $this->createResponse(), ['name' => 'Brickwork']);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('brickwork', (string) $response->getBody());
    }

    // -------------------------------------------------------------------------
    // getDependency
    // -------------------------------------------------------------------------

    public function testGetDependencyReturnsParentsByDefault(): void
    {
        $tenderBuilder = $this->createBuilder(['select', 'where', 'get']);
        $tenderBuilder->method('select')->willReturnSelf();
        $tenderBuilder->method('where')->willReturnSelf();
        $tenderBuilder->method('get')->willReturn(new FakeCollection([['id' => 5], ['id' => 6]]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($tenderBuilder);
        $repository->method('getProjectDependenciesByTenderIds')
            ->with([5, 6], 'parent')
            ->willReturn([5 => ['p1'], 6 => ['p2']]);

        $action = $this->createAction($repository);
        $response = $action->getDependency($this->createRequest(), $this->createResponse(), ['id' => 3]);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame(['p1'], $payload['data'][5]);
        self::assertSame(['p2'], $payload['data'][6]);
    }

    public function testGetDependencyReturnsChildrenWhenTypeIsChild(): void
    {
        $tenderBuilder = $this->createBuilder(['select', 'where', 'get']);
        $tenderBuilder->method('select')->willReturnSelf();
        $tenderBuilder->method('where')->willReturnSelf();
        $tenderBuilder->method('get')->willReturn(new FakeCollection([['id' => 9]]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($tenderBuilder);
        $repository->method('getProjectDependenciesByTenderIds')
            ->with([9], 'child')
            ->willReturn([9 => ['c1']]);

        $action = $this->createAction($repository);
        $response = $action->getDependency(
            $this->createRequest(['type' => 'child']),
            $this->createResponse(),
            ['id' => 3]
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame(['c1'], $payload['data'][9]);
    }

    public function testGetDependencyReturnsEmptyWhenNoTenders(): void
    {
        $tenderBuilder = $this->createBuilder(['select', 'where', 'get']);
        $tenderBuilder->method('select')->willReturnSelf();
        $tenderBuilder->method('where')->willReturnSelf();
        $tenderBuilder->method('get')->willReturn(new FakeCollection([]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('tender')->willReturn($tenderBuilder);
        $repository->method('getProjectDependenciesByTenderIds')
            ->with([], 'parent')
            ->willReturn([]);

        $action = $this->createAction($repository);
        $response = $action->getDependency($this->createRequest(), $this->createResponse(), ['id' => 3]);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame([], $payload['data']);
    }

    // -------------------------------------------------------------------------
    // getTeam
    // -------------------------------------------------------------------------

    public function testGetTeamReturnsNotFoundWhenProjectMissing(): void
    {
        $builder = $this->createBuilder(['where', 'first']);
        $builder->method('where')->willReturnSelf();
        $builder->method('first')->willReturn(null);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getTeam($this->createRequest(), $this->createResponse(), ['id' => 1]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetTeamReturnsTeamData(): void
    {
        $roleRelation = $this->createBuilder(['with', 'get']);
        $roleRelation->method('with')->willReturnSelf();
        $roleRelation->method('get')->willReturn(new FakeCollection([['role' => 'Admin']]));

        $model = $this->createBuilder(['teamMemberRoleMapping']);
        $model->method('teamMemberRoleMapping')->willReturn($roleRelation);

        $builder = $this->createBuilder(['where', 'first']);
        $builder->method('where')->willReturnSelf();
        $builder->method('first')->willReturn($model);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->getTeam($this->createRequest(), $this->createResponse(), ['id' => 5]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"role": "Admin"', (string) $response->getBody());
    }

    // -------------------------------------------------------------------------
    // addTeamMember
    // -------------------------------------------------------------------------

    public function testAddTeamMemberReturnsNotFoundWhenProjectMissing(): void
    {
        $projectModel = $this->createBuilder(['load', 'isLoaded']);
        $projectModel->method('load')->willReturnSelf();
        $projectModel->method('isLoaded')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('project')->willReturn($projectModel);

        $action = $this->createAction($repository);
        $action->setRequestData(['user_id' => 1, 'role_id' => 2]);
        $response = $action->addTeamMember($this->createRequest(), $this->createResponse(), ['id' => 99]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testAddTeamMemberReturnsIdWhenProjectExists(): void
    {
        $projectModel = $this->createBuilder(['load', 'isLoaded']);
        $projectModel->method('load')->willReturnSelf();
        $projectModel->method('isLoaded')->willReturn(true);

        $storedMapping = $this->createBuilder(['getId']);
        $storedMapping->method('getId')->willReturn(77);

        $teamMapping = $this->createBuilder(['store']);
        $teamMapping->expects(self::once())
            ->method('store')
            ->with(['project_id' => 5, 'user_id' => 20, 'role_id' => 3])
            ->willReturn($storedMapping);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')
            ->willReturnCallback(function (string $name) use ($projectModel, $teamMapping) {
                return match ($name) {
                    'project' => $projectModel,
                    'teamMemberRoleMapping' => $teamMapping,
                    default => throw new \RuntimeException("Unexpected model: $name"),
                };
            });

        $action = $this->createAction($repository);
        $action->setRequestData(['user_id' => 20, 'role_id' => 3]);
        $response = $action->addTeamMember($this->createRequest(), $this->createResponse(), ['id' => 5]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 77', (string) $response->getBody());
    }

    // -------------------------------------------------------------------------
    // updateTeamMember
    // -------------------------------------------------------------------------

    public function testUpdateTeamMemberReturnsNotFoundWhenMappingMissing(): void
    {
        $builder = $this->createBuilder(['where', 'first']);
        $builder->method('where')->willReturnSelf();
        $builder->method('first')->willReturn(null);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('teamMemberRoleMapping')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->updateTeamMember($this->createRequest(), $this->createResponse(), ['id' => 1, 'member' => 2]);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testUpdateTeamMemberReturnsNoContentWhenFound(): void
    {
        $mapping = $this->createBuilder(['store']);
        $mapping->expects(self::once())->method('store')->with(['role_id' => 4]);

        $builder = $this->createBuilder(['where', 'first']);
        $builder->method('where')->willReturnSelf();
        $builder->method('first')->willReturn($mapping);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('teamMemberRoleMapping')->willReturn($builder);

        $action = $this->createAction($repository);
        $action->setRequestData(['role_id' => 4]);
        $response = $action->updateTeamMember($this->createRequest(), $this->createResponse(), ['id' => 1, 'member' => 2]);

        self::assertSame(203, $response->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // removeTeamMember
    // -------------------------------------------------------------------------

    public function testRemoveTeamMemberDeletesMappingAndReturnsNoContent(): void
    {
        $whereBuilder = $this->createBuilder(['where']);
        $whereBuilder->method('where')->willReturnSelf();

        $deleteModel = $this->createBuilder(['deleteById']);
        $deleteModel->expects(self::once())->method('deleteById')->with(8);

        $callCount = 0;
        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')
            ->with('teamMemberRoleMapping')
            ->willReturnCallback(function () use ($whereBuilder, $deleteModel, &$callCount) {
                return $callCount++ === 0 ? $whereBuilder : $deleteModel;
            });

        $action = $this->createAction($repository);
        $response = $action->removeTeamMember($this->createRequest(), $this->createResponse(), ['id' => 3, 'member' => 8]);

        self::assertSame(203, $response->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // deleteTeamMemberRoleMappingByMember
    // -------------------------------------------------------------------------

    public function testDeleteTeamMemberRoleMappingByMemberReturnsNoContent(): void
    {
        $builder = $this->createBuilder(['where', 'delete']);
        $builder->method('where')->willReturnSelf();
        $builder->expects(self::once())->method('delete');

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('teamMemberRoleMapping')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->deleteTeamMemberRoleMappingByMember(
            $this->createRequest(),
            $this->createResponse(),
            ['member' => 10]
        );

        self::assertSame(203, $response->getStatusCode());
    }

    // -------------------------------------------------------------------------
    // listTeamRoles
    // -------------------------------------------------------------------------

    public function testListTeamRolesReturnsRoles(): void
    {
        $builder = $this->createBuilder(['get']);
        $builder->method('get')->willReturn(new FakeCollection([['label' => 'Site Manager']]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('teamMemberRole')->willReturn($builder);

        $action = $this->createAction($repository);
        $response = $action->listTeamRoles($this->createRequest(), $this->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('Site Manager', (string) $response->getBody());
    }

    private function createAction(ProjectRepository $repository, ?LoggerInterface $logger = null): TestableProjectAction
    {
        return new TestableProjectAction($logger ?? $this->createMock(LoggerInterface::class), $repository);
    }

    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)->addMethods($methods)->getMock();
    }

    private function createRequest(array $query = []): \Psr\Http\Message\ServerRequestInterface
    {
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/v1/project');
        if ($query) {
            $request = $request->withQueryParams($query);
        }

        return $request;
    }

    private function createResponse(): \Psr\Http\Message\ResponseInterface
    {
        return $this->responseFactory->createResponse();
    }
}

class TestableProjectAction extends ProjectAction
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

class TenderPackageMappingDeleteDouble
{
    public static ?int $deletedTenderId = null;
    public static array $existingPackageIds = [];
    public static ?array $removedPackageIds = null;
    public static ?array $insertedRows = null;

    public static function reset(): void
    {
        self::$deletedTenderId = null;
        self::$existingPackageIds = [];
        self::$removedPackageIds = null;
        self::$insertedRows = null;
    }

    public static function where(string $column, $value): self
    {
        self::$deletedTenderId = $value;
        return new self();
    }

    public function pluck(string $column): self
    {
        return $this;
    }

    public function map(callable $fn): self
    {
        return $this;
    }

    public function all(): array
    {
        return self::$existingPackageIds;
    }

    public function whereIn(string $column, array $values): self
    {
        self::$removedPackageIds = $values;
        return $this;
    }

    public function delete(): void
    {
    }

    public static function insert(array $rows): void
    {
        self::$insertedRows = $rows;
    }
}
