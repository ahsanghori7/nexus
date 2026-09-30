<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeCollection;
use Tests\TestDoubles\StubProjectRepository;

class ProjectRepositoryTest extends TestCase
{
    protected function tearDown(): void
    {
        BulkInsertPackageModelDouble::$insertedRows = [];
        AccumulatingPackageModelDouble::$insertedRows = [];
        parent::tearDown();
    }

    public function testFindAllDelegatesToModel(): void
    {
        $model = new class {
            public array $lastFilters = [];
            public function findAll(array $filters, int $limit, int $offset): array
            {
                $this->lastFilters = $filters;
                return [['id' => 1]];
            }
        };

        $repository = new StubProjectRepository();
        $repository->setModel('project', $model);

        $result = $repository->findAll(['status' => 1], 10, 5);
        self::assertSame([['id' => 1]], $result);
        self::assertSame(['status' => 1], $model->lastFilters);
    }

    public function testCreateReturnsStoredId(): void
    {
        $model = new class {
            public array $stored = [];
            public int $nextId = 99;
            public function store(array $data)
            {
                $this->stored = $data;
                $id = $this->nextId;
                return new class($id) {
                    public function __construct(private int $id) {}
                    public function getId(): int { return $this->id; }
                };
            }
        };

        $repository = new StubProjectRepository();
        $repository->setModel('project', $model);

        $result = $repository->create(['name' => 'Demo']);
        self::assertSame(99, $result);
        self::assertSame(['name' => 'Demo'], $model->stored);
    }

    public function testUpdateByIdInjectsIdField(): void
    {
        $model = new class {
            public array $stored = [];
            public function getIdField(): string
            {
                return 'id';
            }
            public function store(array $data): bool
            {
                $this->stored = $data;
                return true;
            }
        };

        $repository = new StubProjectRepository();
        $repository->setModel('project', $model);

        $repository->updateById(7, ['name' => 'Updated']);
        self::assertSame(['name' => 'Updated', 'id' => 7], $model->stored);
    }

    public function testDeleteByIdDelegatesToModel(): void
    {
        $model = new class {
            public ?int $deleted = null;
            public function deleteById(int $id): bool
            {
                $this->deleted = $id;
                return true;
            }
        };

        $repository = new StubProjectRepository();
        $repository->setModel('project', $model);

        $repository->deleteById(4);
        self::assertSame(4, $model->deleted);
    }

    public function testGetModelThrowsForUnknownModel(): void
    {
        $this->expectException(\RuntimeException::class);
        $repository = new StubProjectRepository();
        $repository->getModel('missing');
    }

    public function testCreateTenderBulkInsertsPackageMappings(): void
    {
        $tender = new class {
            public array $filled = [];
            public function fill(array $data): self
            {
                $this->filled = $data;
                return $this;
            }
            public function save(): void
            {
            }
            public function getId(): int
            {
                return 55;
            }
        };

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tender);
        $repository->setModel('package', new BulkInsertPackageModelDouble());

        $result = $repository->createTender(
            9,
            'Updated package',
            ['reference_no' => 'PKG-001', 'state' => 1],
            [7, 8]
        );

        self::assertSame($tender, $result);
        self::assertSame([
            'reference_no' => 'PKG-001',
            'state' => 1,
            'project_id' => 9,
            'label' => 'Updated package',
            'status' => 'in_progress',
        ], $tender->filled);
        self::assertSame([
            ['package_id' => 7, 'tender_id' => 55],
            ['package_id' => 8, 'tender_id' => 55],
        ], BulkInsertPackageModelDouble::$insertedRows);
    }

    /**
     * @dataProvider tenderStatusFactorsProvider
     */
    public function testCreateTenderComputesStatusFromServiceStartOnSiteAndPackages(
        ?string $service,
        ?string $startOnSite,
        array $packages,
        string $expectedStatus
    ): void {
        $tender = new class {
            public array $filled = [];
            public function fill(array $data): self
            {
                $this->filled = $data;
                return $this;
            }
            public function save(): void
            {
            }
            public function getId(): int
            {
                return 55;
            }
        };

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tender);
        $repository->setModel('package', new BulkInsertPackageModelDouble());

        $repository->createTender(9, 'Tender label', [
            'reference_no' => 'PKG-001',
            'service' => $service,
            'start_on_site' => $startOnSite,
        ], $packages);

        self::assertSame($expectedStatus, $tender->filled['status']);
    }

    public static function tenderStatusFactorsProvider(): array
    {
        return [
            'no factors present' => [null, null, [], 'needs_setup'],
            'only service present' => ['Consultant', null, [], 'in_progress'],
            'only start_on_site present' => [null, '2026-01-01', [], 'in_progress'],
            'only packages present' => [null, null, [7], 'in_progress'],
            'service and start_on_site present' => ['Consultant', '2026-01-01', [], 'in_progress'],
            'all factors present' => ['Consultant', '2026-01-01', [7], 'ready'],
        ];
    }

    /**
     * @dataProvider tenderStatusFactorsProvider
     */
    public function testResolveTenderStatus(
        ?string $service,
        ?string $startOnSite,
        array $packages,
        string $expectedStatus
    ): void {
        $repository = new StubProjectRepository();

        self::assertSame(
            $expectedStatus,
            $repository->resolveTenderStatus($service, $startOnSite, !empty($packages))
        );
    }

    public function testBulkCreateTenderCreatesValidEntriesAndSkipsInvalid(): void
    {
        $tender = new BulkCreateTenderModelDouble();

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tender);
        $repository->setModel('package', new AccumulatingPackageModelDouble());

        $result = $repository->bulkCreateTender(9, [
            ['label' => 'Package A', 'reference_no' => 'PKG-001', 'packages' => [7, 8]],
            ['packages' => [9]],
            ['label' => 'Package B', 'reference_no' => 'PKG-002', 'packages' => [10]],
            ['label' => 'Package C', 'reference_no' => 'PKG-003', 'packages' => 'not-an-array'],
        ]);

        self::assertSame([100, 101], $result);
        self::assertSame([
            ['package_id' => 7, 'tender_id' => 100],
            ['package_id' => 8, 'tender_id' => 100],
            ['package_id' => 10, 'tender_id' => 101],
        ], AccumulatingPackageModelDouble::$insertedRows);
        self::assertArrayNotHasKey(
            'packages',
            $tender->filledCalls[0],
            'raw package ids must not leak into the tender fill() payload'
        );
        self::assertArrayNotHasKey(
            'packages',
            $tender->filledCalls[1],
            'raw package ids must not leak into the tender fill() payload'
        );
    }

    public function testBulkCreateTenderSkipsLabelAlreadyExistingInDatabase(): void
    {
        $tender = new BulkCreateTenderModelDouble(existingLabels: ['Package A']);

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tender);
        $repository->setModel('package', new AccumulatingPackageModelDouble());

        $result = $repository->bulkCreateTender(9, [
            ['label' => 'Package A', 'reference_no' => 'PKG-001', 'packages' => []],
            ['label' => 'Package B', 'reference_no' => 'PKG-002', 'packages' => []],
        ]);

        self::assertSame([100], $result);
        self::assertSame([['project_id', 9]], $tender->whereCalls);
    }

    public function testBulkCreateTenderSkipsDuplicateLabelWithinSameBatch(): void
    {
        $tender = new BulkCreateTenderModelDouble();

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tender);
        $repository->setModel('package', new AccumulatingPackageModelDouble());

        $result = $repository->bulkCreateTender(9, [
            ['label' => 'Package A', 'reference_no' => 'PKG-001', 'packages' => []],
            ['label' => 'Package A', 'reference_no' => 'PKG-002', 'packages' => []],
            ['label' => 'Package B', 'reference_no' => 'PKG-003', 'packages' => []],
        ]);

        self::assertSame([100, 101], $result);
        self::assertSame('PKG-001', $tender->filledCalls[0]['reference_no']);
        self::assertSame('PKG-003', $tender->filledCalls[1]['reference_no']);
    }

    public function testBulkCreateTenderSkipsLabelAlreadyExistingInDatabaseCaseInsensitive(): void
    {
        $tender = new BulkCreateTenderModelDouble(existingLabels: ['Package A']);

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tender);
        $repository->setModel('package', new AccumulatingPackageModelDouble());

        $result = $repository->bulkCreateTender(9, [
            ['label' => 'package a', 'reference_no' => 'PKG-001', 'packages' => []],
            ['label' => 'Package B', 'reference_no' => 'PKG-002', 'packages' => []],
        ]);

        self::assertSame([100], $result);
        self::assertSame('PKG-002', $tender->filledCalls[0]['reference_no']);
    }

    public function testBulkCreateTenderSkipsDuplicateLabelWithinSameBatchCaseInsensitive(): void
    {
        $tender = new BulkCreateTenderModelDouble();

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tender);
        $repository->setModel('package', new AccumulatingPackageModelDouble());

        $result = $repository->bulkCreateTender(9, [
            ['label' => 'Package A', 'reference_no' => 'PKG-001', 'packages' => []],
            ['label' => 'PACKAGE A', 'reference_no' => 'PKG-002', 'packages' => []],
            ['label' => 'Package B', 'reference_no' => 'PKG-003', 'packages' => []],
        ]);

        self::assertSame([100, 101], $result);
        self::assertSame('PKG-001', $tender->filledCalls[0]['reference_no']);
        self::assertSame('PKG-003', $tender->filledCalls[1]['reference_no']);
    }

    public function testBulkDeleteTenderDeletesValidTenderIdsScopedToProject(): void
    {
        $tenderModel = new BulkDeleteTenderModelDouble(['11', '15']);

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tenderModel);

        $result = $repository->bulkDeleteTender(9, [11, 15, 999]);

        self::assertSame([11, 15], $result);
        self::assertSame([['project_id', 9]], $tenderModel->whereCalls);
        self::assertSame([
            ['id', [11, 15, 999]],
            ['id', [11, 15]],
        ], $tenderModel->whereInCalls);
        self::assertTrue($tenderModel->deleteCalled);
    }

    public function testBulkDeleteTenderSkipsDeleteAndReturnsEmptyArrayWhenNoValidIds(): void
    {
        $tenderModel = new BulkDeleteTenderModelDouble([]);

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tenderModel);

        $result = $repository->bulkDeleteTender(9, [999]);

        self::assertSame([], $result);
        self::assertFalse($tenderModel->deleteCalled);
        self::assertCount(1, $tenderModel->whereInCalls, 'delete must not be attempted when no valid ids are found');
    }

    public function testGetProjectDependenciesByTenderIdsReturnsParentDependencies(): void
    {
        $dependencyModel = new BulkDependencyModelDouble(
            parentRows: [
                ['tender_id' => 30, 'tender_parent_id' => 11, 'tender_dependency_key' => 1, 'tender_dependency_parent_key' => 2],
                ['tender_id' => 31, 'tender_parent_id' => 11, 'tender_dependency_key' => 3, 'tender_dependency_parent_key' => 4],
            ],
            childRows: [],
            activeRows: [
                ['tender_id' => 11],
            ]
        );

        $repository = new StubProjectRepository();
        $repository->setModel('tenderDependency', $dependencyModel);

        $result = $repository->getProjectDependenciesByTenderIds([11, 12], 'parent');

        self::assertSame([
            11 => [
                [
                    'tender_parent_id' => 30,
                    'tender_dependency_key' => 1,
                    'tender_dependency_parent_key' => 2,
                ],
                [
                    'tender_parent_id' => 31,
                    'tender_dependency_key' => 3,
                    'tender_dependency_parent_key' => 4,
                ],
            ],
            12 => [],
        ], $result);
    }

    public function testGetProjectDependenciesByTenderIdsFallsBackToChildrenForUnknownType(): void
    {
        $dependencyModel = new BulkDependencyModelDouble(
            parentRows: [],
            childRows: [
                ['tender_id' => 11, 'tender_parent_id' => 50, 'tender_dependency_key' => 7, 'tender_dependency_parent_key' => 8],
                ['tender_id' => 12, 'tender_parent_id' => 60, 'tender_dependency_key' => 9, 'tender_dependency_parent_key' => 10],
            ],
            activeRows: [
                ['tender_id' => 50],
            ]
        );

        $repository = new StubProjectRepository();
        $repository->setModel('tenderDependency', $dependencyModel);

        $result = $repository->getProjectDependenciesByTenderIds([11, 12], 'invalid');

        self::assertSame([
            11 => [
                [
                    'tender_child_id' => 50,
                    'tender_dependency_key' => 7,
                    'tender_dependency_child_key' => 8,
                ],
            ],
            12 => [],
        ], $result);
    }

    public function testGetBoqQuoteDocumentsByProjectReturnsTenderTransactionEntityMap(): void
    {
        $entityModel = $this->createBuilder(['select', 'whereHas', 'with', 'get']);
        $entityModel->method('select')->with('id', 'tender_id')->willReturnSelf();
        $entityModel->method('whereHas')->willReturnSelf();
        $entityModel->method('with')->willReturnSelf();
        $entityModel->method('get')->willReturn(new ProjectRepositoryIterableCollection([
            ProjectRepositoryRecord::make([
                'id' => 100,
                'tender_id' => 10,
                'entries' => [
                    ProjectRepositoryRecord::make(['id' => 1]),
                    ProjectRepositoryRecord::make(['id' => 2]),
                ],
            ]),
            ProjectRepositoryRecord::make([
                'id' => 200,
                'tender_id' => 20,
                'entries' => [
                    ProjectRepositoryRecord::make(['id' => 3]),
                ],
            ]),
        ]));

        $quoteItemModel = $this->createBuilder(['select', 'whereIn', 'get']);
        $quoteItemModel->method('select')->with('transaction_id', 'boq_item_id')->willReturnSelf();
        $quoteItemModel->expects(self::once())
            ->method('whereIn')
            ->with('boq_item_id', [1, 2, 3])
            ->willReturnSelf();
        $quoteItemModel->method('get')->willReturn(new ProjectRepositoryIterableCollection([
            ProjectRepositoryRecord::make(['transaction_id' => 500, 'boq_item_id' => 1]),
            ProjectRepositoryRecord::make(['transaction_id' => 501, 'boq_item_id' => 3]),
        ]));

        $documentModel = $this->createBuilder(['select', 'whereIn', 'distinct', 'pluck']);
        $documentModel->method('select')->with('transaction_id')->willReturnSelf();
        $documentModel->expects(self::once())
            ->method('whereIn')
            ->with('transaction_id', [500, 501])
            ->willReturnSelf();
        $documentModel->method('distinct')->willReturnSelf();
        $documentModel->method('pluck')->with('transaction_id')->willReturn(new ProjectRepositoryValueCollection([500, 501]));

        $transactionModel = $this->createBuilder(['select', 'whereIn', 'get']);
        $transactionModel->method('select')->with('id', 'tender_id')->willReturnSelf();
        $transactionModel->expects(self::once())
            ->method('whereIn')
            ->with('id', [500, 501])
            ->willReturnSelf();
        $transactionModel->method('get')->willReturn(new ProjectRepositoryIterableCollection([
            ProjectRepositoryRecord::make(['id' => 500, 'tender_id' => 10]),
            ProjectRepositoryRecord::make(['id' => 501, 'tender_id' => 20]),
        ]));

        $repository = new StubProjectRepository();
        $repository->setModel('boqEntity', $entityModel);
        $repository->setModel('boqQuoteItem', $quoteItemModel);
        $repository->setModel('transactionDocument', $documentModel);
        $repository->setModel('transaction', $transactionModel);

        self::assertSame([
            10 => [
                500 => 100,
            ],
            20 => [
                501 => 200,
            ],
        ], $repository->getBoqQuoteDocumentsByProject(7));
    }

    public function testGetBoqQuoteDocumentsByProjectReturnsEmptyWhenProjectHasNoBoqEntities(): void
    {
        $entityModel = $this->createBuilder(['select', 'whereHas', 'with', 'get']);
        $entityModel->method('select')->with('id', 'tender_id')->willReturnSelf();
        $entityModel->method('whereHas')->willReturnSelf();
        $entityModel->method('with')->willReturnSelf();
        $entityModel->method('get')->willReturn(new ProjectRepositoryIterableCollection([]));

        $repository = new StubProjectRepository();
        $repository->setModel('boqEntity', $entityModel);

        self::assertSame([], $repository->getBoqQuoteDocumentsByProject(7));
    }

    public function testGetBoqQuoteDocumentsByProjectReturnsEmptyWhenEntitiesHaveNoEntries(): void
    {
        $entityModel = $this->createBuilder(['select', 'whereHas', 'with', 'get']);
        $entityModel->method('select')->with('id', 'tender_id')->willReturnSelf();
        $entityModel->method('whereHas')->willReturnSelf();
        $entityModel->method('with')->willReturnSelf();
        $entityModel->method('get')->willReturn(new ProjectRepositoryIterableCollection([
            ProjectRepositoryRecord::make([
                'id' => 100,
                'tender_id' => 10,
                'entries' => [],
            ]),
        ]));

        $repository = new StubProjectRepository();
        $repository->setModel('boqEntity', $entityModel);

        self::assertSame([], $repository->getBoqQuoteDocumentsByProject(7));
    }

    public function testGetBoqQuoteDocumentsByProjectReturnsEmptyWhenQuoteTransactionsHaveNoDocuments(): void
    {
        $entityModel = $this->createBuilder(['select', 'whereHas', 'with', 'get']);
        $entityModel->method('select')->with('id', 'tender_id')->willReturnSelf();
        $entityModel->method('whereHas')->willReturnSelf();
        $entityModel->method('with')->willReturnSelf();
        $entityModel->method('get')->willReturn(new ProjectRepositoryIterableCollection([
            ProjectRepositoryRecord::make([
                'id' => 100,
                'tender_id' => 10,
                'entries' => [
                    ProjectRepositoryRecord::make(['id' => 1]),
                ],
            ]),
        ]));

        $quoteItemModel = $this->createBuilder(['select', 'whereIn', 'get']);
        $quoteItemModel->method('select')->with('transaction_id', 'boq_item_id')->willReturnSelf();
        $quoteItemModel->method('whereIn')->with('boq_item_id', [1])->willReturnSelf();
        $quoteItemModel->method('get')->willReturn(new ProjectRepositoryIterableCollection([
            ProjectRepositoryRecord::make(['transaction_id' => 500, 'boq_item_id' => 1]),
        ]));

        $documentModel = $this->createBuilder(['select', 'whereIn', 'distinct', 'pluck']);
        $documentModel->method('select')->with('transaction_id')->willReturnSelf();
        $documentModel->method('whereIn')->with('transaction_id', [500])->willReturnSelf();
        $documentModel->method('distinct')->willReturnSelf();
        $documentModel->method('pluck')->with('transaction_id')->willReturn(new ProjectRepositoryValueCollection([]));

        $repository = new StubProjectRepository();
        $repository->setModel('boqEntity', $entityModel);
        $repository->setModel('boqQuoteItem', $quoteItemModel);
        $repository->setModel('transactionDocument', $documentModel);

        self::assertSame([], $repository->getBoqQuoteDocumentsByProject(7));
    }

    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)->addMethods($methods)->getMock();
    }

    public function testGetProjectInterestsBuildsDedicatedInterestQuery(): void
    {
        $historyModel = new ProjectInterestsHistoryModelDouble([
            ['id' => 11, 'label' => 'Groundworks', 'cid' => 44],
            ['id' => 15, 'label' => 'Brickwork', 'cid' => 51],
        ]);

        $repository = new StubProjectRepository();
        $repository->setModel('tenderHistory', $historyModel);

        $result = $repository->getProjectInterests(9);

        self::assertSame([
            ['id' => 11, 'label' => 'Groundworks', 'cid' => 44],
            ['id' => 15, 'label' => 'Brickwork', 'cid' => 51],
        ], $result);
        self::assertContains(['tender.project_id', 9], $historyModel->whereEqualsCalls);
        self::assertContains(['tender_history.tender_history_type', 'Interest'], $historyModel->whereEqualsCalls);
        self::assertContains(['tender_history.specialist_id'], $historyModel->whereNotNullCalls);
        self::assertContains(['ranked_interest.rn', 1], $historyModel->whereEqualsCalls);
        self::assertContains(['ranked_interest.status_uid', ['viewed', 'sent']], $historyModel->whereInCalls);
        self::assertSame(1, $historyModel->fromSubCalls);
    }

    public function testGetProjectDashboardSummaryBuildsDedicatedSummaryCounts(): void
    {
        $tenderModel = new DashboardSummaryTenderModelDouble([11, 15]);
        $historyModel = new DashboardSummaryHistoryModelDouble([
            ['tender_id' => 11, 'tender_history_type' => 'Interest', 'history_count' => 2],
            ['tender_id' => 11, 'tender_history_type' => 'Enquiry', 'history_count' => 1],
            ['tender_id' => 15, 'tender_history_type' => 'Enquiry', 'history_count' => 4],
        ]);
        $transactionModel = new DashboardSummaryTransactionModelDouble([
            ['tender_id' => 11, 'subcontractor_id' => 50, 'quote_count' => 3],
            ['tender_id' => 11, 'subcontractor_id' => 51, 'quote_count' => 1],
            ['tender_id' => 15, 'subcontractor_id' => 60, 'quote_count' => 2],
        ]);

        $repository = new StubProjectRepository();
        $repository->setModel('tender', $tenderModel);
        $repository->setModel('tenderHistory', $historyModel);
        $repository->setModel('transaction', $transactionModel);

        $result = $repository->getProjectDashboardSummary(9);

        self::assertSame([
            11 => [
                'interest_count' => 2,
                'enquiries_sent' => 1,
                'unique_quote_count' => 2,
                'total_quote_count' => 4,
            ],
            15 => [
                'interest_count' => 0,
                'enquiries_sent' => 4,
                'unique_quote_count' => 1,
                'total_quote_count' => 2,
            ],
        ], $result);
        self::assertContains(['project_id', 9], $tenderModel->whereEqualsCalls);
        self::assertContains(['tender.project_id', 9], $historyModel->whereEqualsCalls);
        self::assertContains(['tender_history.tender_history_type', ['Interest', 'Enquiry']], $historyModel->whereInCalls);
        self::assertContains(['tender_history_status.uid', ['dismissed', 'deleted', 'added']], $historyModel->whereNotInCalls);
        self::assertContains(['ranked_history.rn', 1], $historyModel->whereEqualsCalls);
        self::assertSame(1, $historyModel->fromSubCalls);
        self::assertContains(['tender.project_id', 9], $transactionModel->whereEqualsCalls);
    }
}
class BulkInsertPackageModelDouble
{
    public static array $insertedRows = [];

    public static function insert(array $rows): void
    {
        self::$insertedRows = $rows;
    }
}

class AccumulatingPackageModelDouble
{
    public static array $insertedRows = [];

    public static function insert(array $rows): void
    {
        self::$insertedRows = array_merge(self::$insertedRows, $rows);
    }
}

class BulkDeleteTenderModelDouble
{
    /** @var array<int, array{0: string, 1: mixed}> */
    public array $whereCalls = [];
    /** @var array<int, array{0: string, 1: array}> */
    public array $whereInCalls = [];
    public bool $deleteCalled = false;

    public function __construct(private array $pluckResult)
    {
    }

    public function where(string $column, $value): self
    {
        $this->whereCalls[] = [$column, $value];
        return $this;
    }

    public function whereIn(string $column, array $values): self
    {
        $this->whereInCalls[] = [$column, $values];
        return $this;
    }

    public function pluck(string $column): \Illuminate\Support\Collection
    {
        return new \Illuminate\Support\Collection($this->pluckResult);
    }

    public function delete(): void
    {
        $this->deleteCalled = true;
    }
}

class BulkCreateTenderModelDouble
{
    /** @var array<int, array{0: string, 1: mixed}> */
    public array $whereCalls = [];
    /** @var array<int, array> */
    public array $filledCalls = [];
    private int $nextId = 100;
    private int $currentId = 0;

    public function __construct(private array $existingLabels = [])
    {
    }

    public function where(string $column, $value): self
    {
        $this->whereCalls[] = [$column, $value];
        return $this;
    }

    public function pluck(string $column): \Illuminate\Support\Collection
    {
        return new \Illuminate\Support\Collection($this->existingLabels);
    }

    public function fill(array $data): self
    {
        $this->filledCalls[] = $data;
        return $this;
    }

    public function save(): void
    {
        $this->currentId = $this->nextId++;
    }

    public function getId(): int
    {
        return $this->currentId;
    }
}

class BulkDependencyModelDouble
{
    private ?string $whereColumn = null;
    private bool $grouped = false;

    public function __construct(
        private array $parentRows,
        private array $childRows,
        private array $activeRows
    ) {
    }

    public function select(array $columns): self
    {
        return $this;
    }

    public function whereIn(string $column, array $values): self
    {
        $this->whereColumn = $column;
        $this->grouped = false;
        return $this;
    }

    public function groupBy(string $column): self
    {
        $this->grouped = true;
        return $this;
    }

    public function get(): FakeCollection
    {
        if ($this->whereColumn === 'tender_parent_id') {
            return new FakeCollection($this->parentRows);
        }

        if ($this->whereColumn === 'tender_id' && $this->grouped) {
            return new FakeCollection($this->activeRows);
        }

        return new FakeCollection($this->childRows);
    }
}

class ProjectRepositoryIterableCollection implements \IteratorAggregate
{
    /** @var array<int, mixed> */
    private array $items;

    public function __construct(array $items)
    {
        $this->items = $items;
    }

    public function isEmpty(): bool
    {
        return empty($this->items);
    }

    public function getIterator(): \Traversable
    {
        return new \ArrayIterator($this->items);
    }
}

class ProjectRepositoryValueCollection
{
    /** @var array<int, mixed> */
    private array $items;

    public function __construct(array $items)
    {
        $this->items = $items;
    }

    public function all(): array
    {
        return $this->items;
    }
}

class ProjectRepositoryRecord
{
    public static function make(array $data): object
    {
        return (object) $data;
    }
}

class ProjectInterestsHistoryModelDouble
{
    public array $whereEqualsCalls = [];
    public array $whereInCalls = [];
    public array $whereNotNullCalls = [];
    public int $fromSubCalls = 0;

    public function __construct(private array $rows)
    {
    }

    public function selectRaw(string $expression): self
    {
        return $this;
    }

    public function select(array $columns): self
    {
        return $this;
    }

    public function join(string $table, string $first, string $operator, string $second): self
    {
        return $this;
    }

    public function fromSub($query, string $as): self
    {
        $this->fromSubCalls++;
        return $this;
    }

    public function where(string $column, $operator = null, $value = null): self
    {
        if (func_num_args() === 2) {
            $this->whereEqualsCalls[] = [$column, $operator];
        } else {
            $this->whereEqualsCalls[] = [$column, $value];
        }
        return $this;
    }

    public function whereNotNull(string $column): self
    {
        $this->whereNotNullCalls[] = [$column];
        return $this;
    }

    public function whereIn(string $column, array $values): self
    {
        $this->whereInCalls[] = [$column, $values];
        return $this;
    }

    public function groupBy(array $columns): self
    {
        return $this;
    }

    public function orderBy(string $column): self
    {
        return $this;
    }

    public function get(): FakeCollection
    {
        return new FakeCollection($this->rows);
    }
}

class DashboardSummaryTenderModelDouble
{
    public array $whereEqualsCalls = [];

    public function __construct(private array $ids)
    {
    }

    public function where(string $column, $operator = null, $value = null): self
    {
        if (func_num_args() === 2) {
            $this->whereEqualsCalls[] = [$column, $operator];
        } else {
            $this->whereEqualsCalls[] = [$column, $value];
        }
        return $this;
    }

    public function pluck(string $column): ProjectRepositoryValueCollection
    {
        return new ProjectRepositoryValueCollection($this->ids);
    }
}

class DashboardSummaryHistoryModelDouble
{
    public array $whereEqualsCalls = [];
    public array $whereInCalls = [];
    public array $whereNotInCalls = [];
    public int $fromSubCalls = 0;

    public function __construct(private array $rows)
    {
    }

    public function selectRaw(string $expression): self
    {
        return $this;
    }

    public function join(string $table, string $first, string $operator, string $second): self
    {
        return $this;
    }

    public function fromSub($query, string $as): self
    {
        $this->fromSubCalls++;
        return $this;
    }

    public function where(string $column, $operator = null, $value = null): self
    {
        if (func_num_args() === 2) {
            $this->whereEqualsCalls[] = [$column, $operator];
        } else {
            $this->whereEqualsCalls[] = [$column, $value];
        }
        return $this;
    }

    public function whereIn(string $column, array $values): self
    {
        $this->whereInCalls[] = [$column, $values];
        return $this;
    }

    public function whereNotIn(string $column, array $values): self
    {
        $this->whereNotInCalls[] = [$column, $values];
        return $this;
    }

    public function groupBy(array $columns): self
    {
        return $this;
    }

    public function get(): FakeCollection
    {
        return new FakeCollection($this->rows);
    }
}

class DashboardSummaryTransactionModelDouble
{
    public array $whereEqualsCalls = [];

    public function __construct(private array $rows)
    {
    }

    public function selectRaw(string $expression): self
    {
        return $this;
    }

    public function join(string $table, string $first, string $operator, string $second): self
    {
        return $this;
    }

    public function where(string $column, $operator = null, $value = null): self
    {
        if (func_num_args() === 2) {
            $this->whereEqualsCalls[] = [$column, $operator];
        } else {
            $this->whereEqualsCalls[] = [$column, $value];
        }
        return $this;
    }

    public function groupBy(array $columns): self
    {
        return $this;
    }

    public function get(): FakeCollection
    {
        return new FakeCollection($this->rows);
    }
}
