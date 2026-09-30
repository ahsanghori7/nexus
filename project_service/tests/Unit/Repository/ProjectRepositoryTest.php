<?php

declare(strict_types=1);

namespace Tests\Unit\Repository;

use App\Domain\Project\Package;
use App\Domain\Project\ProjectOwnerMapping;
use App\Domain\Project\ProjectRepository;
use App\Domain\Transaction\TransactionDocument;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeCollection;

class ProjectRepositoryTest extends TestCase
{

  public function testSummary()
  {

    $project = new ProjectRepository();

    $prices = [
      'gia' => 8366,
      'budget' => 1800,
      'forecast_cost' => 502238,
    ];

    $expected = [
      'profit_loss' => '-500,438.00',
      'budget' => '1,800.00',
      'forecast_cost' => '502,238.00',
      'profit_loss_percent' => '-27,802',
      'budget_cost' => '279.02',
      'forecast_cost_per_ft2' => '60.03',
    ];

    $summary = $project->summary($prices);

    self::assertTrue(arrays_are_similar($summary, $expected, false));

    $prices = [
      'gia' => 1000,
      'budget' => 2000,
      'forecast_cost' => 4000,
    ];

    $expected = [
      'budget' => '2,000.00',
      'forecast_cost' => '4,000.00',
      'profit_loss' => '-2,000.00',
      'profit_loss_percent' => '-100',
      'budget_cost' => '2.00',
      'forecast_cost_per_ft2' => '4.00',
    ];

    $summary = $project->summary($prices);
    self::assertTrue(arrays_are_similar($summary, $expected, false));


    $prices = [
      'gia' => 1000,
      'budget' => 100,
      'forecast_cost' => 400,
    ];

    $expected = [
      'budget' => '100.00',
      'forecast_cost' => '400.00',
      'profit_loss' => '-300.00',
      'profit_loss_percent' => '-300',
      'budget_cost' => '4.00',
      'forecast_cost_per_ft2' => '0.40',
    ];

    $summary = $project->summary($prices);

    self::assertTrue(arrays_are_similar($summary, $expected, false));
  }

  public function testGenerateSlug()
  {

    $project = new ProjectRepository();

    $name = 'SUPER MEGA POTATO NAME';
    $slug = $project->generateSlug($name);
    $this->assertEquals('super-mega-potato-name', $slug);


    $name = 'super mega potato name';
    $slug = $project->generateSlug($name);
    $this->assertEquals('super-mega-potato-name', $slug);


    $name = '  super    mega     potato    name   ';
    $slug = $project->generateSlug($name);
    $this->assertEquals('super-mega-potato-name', $slug);


    $name = '  super  -----  mega     potato    name   ';
    $slug = $project->generateSlug($name);
    $this->assertEquals('super-mega-potato-name', $slug);


    $name = '----------  super  -----  mega     potato    name   ';
    $slug = $project->generateSlug($name);
    $this->assertEquals('super-mega-potato-name', $slug);


    $name = '!@#$%^&*(()_+-=  super    mega     potato    name   ';
    $slug = $project->generateSlug($name);
    $this->assertEquals('super-mega-potato-name', $slug);


    $name = '!@#$%^&*(()_+-=  super    mega     potato    name   !@#$%^&*(()_+-=';
    $slug = $project->generateSlug($name);
    $this->assertEquals('super-mega-potato-name', $slug);

  }

  public function testCreateProjectMappingAppliesDefaultType(): void
  {
      ProjectOwnerMappingDouble::$lastCreated = null;
      $repository = new class extends ProjectRepository {
          public function overrideModel(string $name, string $class): void
          {
              $this->models[$name] = $class;
          }
      };
      $repository->overrideModel('projectOwnerMapping', ProjectOwnerMappingDouble::class);

      $repository->createProjectMapping(['project_id' => 9, 'owner_id' => 3]);

      self::assertSame([
          'project_id' => 9,
          'owner_id' => 3,
          'type' => ProjectOwnerMapping::DEFAULT_TYPE,
      ], ProjectOwnerMappingDouble::$lastCreated);
  }

  // -------------------------------------------------------------------------
  // bulkAddTenderHistory
  // -------------------------------------------------------------------------

  public function testBulkAddTenderHistoryReturnsZeroInsertedWhenRecordsEmpty(): void
  {
      $repository = new ProjectRepository();

      $result = $repository->bulkAddTenderHistory(5, []);

      self::assertSame(0, $result['inserted']);
      self::assertSame([], $result['skipped']);
  }

  public function testBulkAddTenderHistoryInsertsAllRowsWhenAllTendersValid(): void
  {
      $tenderBuilder = $this->getMockBuilder(\stdClass::class)
          ->addMethods(['where', 'whereIn', 'get'])
          ->getMock();
      $tenderBuilder->method('where')->willReturnSelf();
      $tenderBuilder->method('whereIn')->willReturnSelf();
      $tenderBuilder->method('get')->willReturn([['id' => 1], ['id' => 2]]);

      $insertedRows = null;
      $historyModel = $this->getMockBuilder(\stdClass::class)
          ->addMethods(['insert'])
          ->getMock();
      $historyModel->expects(self::once())
          ->method('insert')
          ->willReturnCallback(function (array $rows) use (&$insertedRows): bool {
              $insertedRows = $rows;
              return true;
          });

      $repo = new class($tenderBuilder, $historyModel) extends ProjectRepository {
          private object $tender;
          private object $history;

          public function __construct(object $tender, object $history)
          {
              $this->tender  = $tender;
              $this->history = $history;
          }

          public function getModel(string $name = ''): object
          {
              if ($name === 'tender') {
                  return $this->tender;
              }
              if ($name === 'tenderHistory') {
                  return $this->history;
              }
              return parent::getModel($name);
          }
      };

      $records = [
          ['tender_id' => 1, 'specialist_id' => 10, 'author_id' => 10, 'status_id' => 1, 'tender_history_type' => 'Interest', 'meta' => ['key' => 'val']],
          ['tender_id' => 2, 'specialist_id' => 20, 'author_id' => 20, 'status_id' => 2, 'tender_history_type' => 'Enquiry', 'meta' => null],
      ];

      $result = $repo->bulkAddTenderHistory(5, $records);

      self::assertSame(2, $result['inserted']);
      self::assertSame([], $result['skipped']);
      self::assertCount(2, $insertedRows);
      self::assertSame(1, $insertedRows[0]['tender_id']);
      self::assertSame(10, $insertedRows[0]['specialist_id']);
      self::assertSame(json_encode(['key' => 'val']), $insertedRows[0]['meta']);
      self::assertSame(2, $insertedRows[1]['tender_id']);
      // null meta coalesces to "" via the ?? "" in bulkAddTenderHistory
      self::assertSame(json_encode(''), $insertedRows[1]['meta']);
  }

  public function testBulkAddTenderHistorySkipsRowsForTendersNotBelongingToProject(): void
  {
      $tenderBuilder = $this->getMockBuilder(\stdClass::class)
          ->addMethods(['where', 'whereIn', 'get'])
          ->getMock();
      $tenderBuilder->method('where')->willReturnSelf();
      $tenderBuilder->method('whereIn')->willReturnSelf();
      // Only tender 1 is valid; tender 99 is not returned
      $tenderBuilder->method('get')->willReturn([['id' => 1]]);

      $insertedRows = null;
      $historyModel = $this->getMockBuilder(\stdClass::class)
          ->addMethods(['insert'])
          ->getMock();
      $historyModel->expects(self::once())
          ->method('insert')
          ->willReturnCallback(function (array $rows) use (&$insertedRows): bool {
              $insertedRows = $rows;
              return true;
          });

      $repo = new class($tenderBuilder, $historyModel) extends ProjectRepository {
          private object $tender;
          private object $history;

          public function __construct(object $tender, object $history)
          {
              $this->tender  = $tender;
              $this->history = $history;
          }

          public function getModel(string $name = ''): object
          {
              if ($name === 'tender') {
                  return $this->tender;
              }
              if ($name === 'tenderHistory') {
                  return $this->history;
              }
              return parent::getModel($name);
          }
      };

      $records = [
          ['tender_id' => 1,  'specialist_id' => 5,  'author_id' => 5,  'status_id' => 1, 'tender_history_type' => 'Interest', 'meta' => ''],
          ['tender_id' => 99, 'specialist_id' => 6,  'author_id' => 6,  'status_id' => 1, 'tender_history_type' => 'Interest', 'meta' => ''],
      ];

      $result = $repo->bulkAddTenderHistory(5, $records);

      self::assertSame(1, $result['inserted']);
      self::assertSame([99], $result['skipped']);
      self::assertCount(1, $insertedRows);
      self::assertSame(1, $insertedRows[0]['tender_id']);
  }

  public function testAggregateTenderHistoryKeepsFullHistoryArrayByDefault(): void
  {
      $repository = $this->createRepositoryWithPackageDouble();
      $model = $this->createRowsModel($this->buildHistoryRows());

      $result = $repository->aggregateTenderHistory($model);

      $entry = $result[1]["tender"][10]["Interest"][5];
      self::assertArrayHasKey('history', $entry);
      self::assertCount(2, $entry['history']);
      self::assertArrayNotHasKey('last_history', $entry);
      self::assertSame(2, $entry['last_status']);
  }

  public function testAggregateTenderHistoryReturnsOnlyLatestHistoryWhenRequested(): void
  {
      $repository = $this->createRepositoryWithPackageDouble();
      $model = $this->createRowsModel($this->buildHistoryRows());

      $result = $repository->aggregateTenderHistory($model, true);

      $entry = $result[1]["tender"][10]["Interest"][5];
      self::assertArrayNotHasKey('history', $entry);
      self::assertSame(2, $entry['last_status']);
      self::assertSame(2, $entry['last_history']['status_id']);
      self::assertSame('{"a":2}', $entry['last_history']['meta']);
  }

  /**
   * @return array[] Two history rows for the same tender/type/specialist, the second more recent than the first.
   */
  private function buildHistoryRows(): array
  {
      $base = [
          'project_id' => 1,
          'pca' => '2024-01-01 00:00:00',
          'tid' => 10,
          'decision_date' => null,
          'subcontract_work_finish' => null,
          'project_creator' => 2,
          'group_id' => 3,
          'tender_history_type' => 'Interest',
          'specialist_id' => 5,
          'author_id' => 9,
          'archived' => false,
      ];

      return [
          array_merge($base, ['status_id' => 1, 'meta' => '{"a":1}', 'ca' => '2024-01-01 00:00:00']),
          array_merge($base, ['status_id' => 2, 'meta' => '{"a":2}', 'ca' => '2024-02-01 00:00:00']),
      ];
  }

  private function createRepositoryWithPackageDouble(): ProjectRepository
  {
      PackageDouble::$rows = [];
      $repository = new class extends ProjectRepository {
          public function overrideModel(string $name, string $class): void
          {
              $this->models[$name] = $class;
          }
      };
      $repository->overrideModel('package', PackageDouble::class);

      return $repository;
  }

  private function createRowsModel(array $rows)
  {
      return new class($rows) {
          public function __construct(private array $rows)
          {
          }

          public function get(): self
          {
              return $this;
          }

          public function toArray(): array
          {
              return $this->rows;
          }
      };
  }

  public function testGetTransactionDocumentsByProjectGroupsByTenderAndTransaction(): void
  {
      TransactionDocumentDouble::$rows = [
          ['id' => 1, 'transaction_id' => 9, 'name' => 'a.pdf', 'quote_version' => 1, 'created_at' => '2026-01-01 10:00:00', 'tender_id' => 4],
          ['id' => 2, 'transaction_id' => 9, 'name' => 'b.xlsx', 'quote_version' => 1, 'created_at' => '2026-01-02 10:00:00', 'tender_id' => 4],
          ['id' => 3, 'transaction_id' => 12, 'name' => 'c.pdf', 'quote_version' => 2, 'created_at' => '2026-01-03 10:00:00', 'tender_id' => 5],
      ];

      $repository = new class extends ProjectRepository {
          public function overrideModel(string $name, string $class): void
          {
              $this->models[$name] = $class;
          }
      };
      $repository->overrideModel('transactionDocument', TransactionDocumentDouble::class);

      $result = $repository->getTransactionDocumentsByProject(7);

      self::assertSame(7, TransactionDocumentDouble::$builder->projectId);
      self::assertSame(['transaction', 'tender'], TransactionDocumentDouble::$builder->joins);
      self::assertSame([
          4 => [
              9 => [
                  'count' => 2,
                  'documents' => [
                      ['id' => 1, 'name' => 'a.pdf', 'quote_version' => 1, 'created_at' => '2026-01-01 10:00:00'],
                      ['id' => 2, 'name' => 'b.xlsx', 'quote_version' => 1, 'created_at' => '2026-01-02 10:00:00'],
                  ],
              ],
          ],
          5 => [
              12 => [
                  'count' => 1,
                  'documents' => [
                      ['id' => 3, 'name' => 'c.pdf', 'quote_version' => 2, 'created_at' => '2026-01-03 10:00:00'],
                  ],
              ],
          ],
      ], $result);
  }

  public function testGetTransactionDocumentsByProjectReturnsEmptyWhenNoRows(): void
  {
      TransactionDocumentDouble::$rows = [];

      $repository = new class extends ProjectRepository {
          public function overrideModel(string $name, string $class): void
          {
              $this->models[$name] = $class;
          }
      };
      $repository->overrideModel('transactionDocument', TransactionDocumentDouble::class);

      self::assertSame([], $repository->getTransactionDocumentsByProject(7));
  }

  public function testReplaceTransactionDocumentDeletesSameNameThenStores(): void
  {
      TransactionDocumentReplaceDouble::reset();

      $repository = new class extends ProjectRepository {
          public function overrideModel(string $name, string $class): void
          {
              $this->models[$name] = $class;
          }
      };
      $repository->overrideModel('transactionDocument', TransactionDocumentReplaceDouble::class);

      $id = $repository->replaceTransactionDocument(9, 'quote.pdf', 'development/documents/quote-documents/9/quote.pdf');

      self::assertSame(31, $id);
      self::assertSame(['transaction_id' => 9, 'name' => 'quote.pdf'], TransactionDocumentReplaceDouble::$deletedWhere);
      self::assertSame([
          'transaction_id' => 9,
          'quote_version' => 1,
          'name' => 'quote.pdf',
          's3_key' => 'development/documents/quote-documents/9/quote.pdf',
      ], TransactionDocumentReplaceDouble::$stored);
  }

}

class ProjectOwnerMappingDouble extends ProjectOwnerMapping
{
    public static ?array $lastCreated = null;

    public static function create(array $attributes = [])
    {
        self::$lastCreated = $attributes;
        return new self();
    }
}

class PackageDouble extends Package
{
    public static array $rows = [];

    public function whereIn($column, $values)
    {
        return $this;
    }

    public function get($columns = ['*'])
    {
        return self::$rows;
    }
}

class TransactionDocumentDouble extends TransactionDocument
{
    /** @var array<int, array<string, mixed>> */
    public static array $rows = [];

    public static ?FakeTransactionDocumentBuilder $builder = null;

    public function select(...$columns): FakeTransactionDocumentBuilder
    {
        self::$builder = new FakeTransactionDocumentBuilder(self::$rows);
        return self::$builder;
    }
}

class FakeTransactionDocumentBuilder
{
    /** @var string[] */
    public array $joins = [];

    public ?int $projectId = null;

    /** @var array<int, array<string, mixed>> */
    private array $rows;

    public function __construct(array $rows)
    {
        $this->rows = $rows;
    }

    public function join(string $table, string $first, string $operator, string $second): self
    {
        $this->joins[] = $table;
        return $this;
    }

    public function where(string $column, $value): self
    {
        if ($column === 'tender.project_id') {
            $this->projectId = (int) $value;
        }
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

class TransactionDocumentReplaceDouble extends TransactionDocument
{
    public static ?array $deletedWhere = null;

    public static ?array $stored = null;

    public static function reset(): void
    {
        self::$deletedWhere = null;
        self::$stored = null;
    }

    public function where($where): object
    {
        self::$deletedWhere = $where;
        return new class {
            public function delete(): int
            {
                return 1;
            }
        };
    }

    public function store(array $data)
    {
        self::$stored = $data;
        return new class {
            public function getId(): int
            {
                return 31;
            }
        };
    }
}
