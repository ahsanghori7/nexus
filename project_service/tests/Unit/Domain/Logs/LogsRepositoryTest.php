<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Logs;

use App\Domain\Logs\LogsRepository;
use PHPUnit\Framework\TestCase;

/**
 * Captures the rows handed to the model instead of reaching a database.
 */
class InsertSpy
{
    public array $inserted = [];
    public int $calls = 0;

    public function insert(array $rows): bool
    {
        $this->calls++;
        $this->inserted = $rows;

        return true;
    }
}

class SpyingLogsRepository extends LogsRepository
{
    public InsertSpy $spy;

    public function __construct()
    {
        $this->spy = new InsertSpy();
    }

    public function getModel(string $name = "")
    {
        return $this->spy;
    }
}

class LogsRepositoryTest extends TestCase
{
    private SpyingLogsRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repository = new SpyingLogsRepository();
    }

    private function record(array $overrides = []): array
    {
        return array_merge([
            'user_id'     => 0,
            'entity_type' => 'tender_document_download',
            'entity_id'   => 44498,
            'type'        => 'Downloaded',
            'meta'        => ['filename' => 'a.pdf'],
        ], $overrides);
    }

    /**
     * The reason this method exists: one action can produce an entry per file,
     * and those must reach the table together rather than one write each.
     */
    public function testWritesEveryRecordInASingleInsert(): void
    {
        $result = $this->repository->bulkCreate([
            $this->record(['meta' => ['filename' => 'a.pdf']]),
            $this->record(['meta' => ['filename' => 'b.pdf']]),
            $this->record(['meta' => ['filename' => 'c.pdf']]),
        ]);

        self::assertSame(['inserted' => 3, 'skipped' => 0], $result);
        self::assertCount(3, $this->repository->spy->inserted);
        self::assertSame(1, $this->repository->spy->calls);
    }

    public function testEncodesMetaAndLeavesAnAlreadyEncodedMetaAlone(): void
    {
        $this->repository->bulkCreate([
            $this->record(['meta' => ['filename' => 'a.pdf']]),
            $this->record(['meta' => '{"filename":"b.pdf"}']),
            $this->record(['meta' => null]),
        ]);

        self::assertSame('{"filename":"a.pdf"}', $this->repository->spy->inserted[0]['meta']);
        self::assertSame('{"filename":"b.pdf"}', $this->repository->spy->inserted[1]['meta']);
        self::assertSame('[]', $this->repository->spy->inserted[2]['meta']);
    }

    /**
     * A malformed entry must not cost the rest of the batch, which is the whole
     * point of writing them together.
     *
     * @dataProvider incompleteRecords
     */
    public function testSkipsIncompleteRecordsWithoutLosingTheRest(array $incomplete): void
    {
        $result = $this->repository->bulkCreate([$this->record(), $incomplete]);

        self::assertSame(['inserted' => 1, 'skipped' => 1], $result);
        self::assertCount(1, $this->repository->spy->inserted);
    }

    public static function incompleteRecords(): array
    {
        return [
            'no entity type' => [['entity_type' => '', 'entity_id' => 1, 'type' => 'Downloaded']],
            'no entity id'   => [['entity_type' => 'x', 'entity_id' => 0, 'type' => 'Downloaded']],
            'no type'        => [['entity_type' => 'x', 'entity_id' => 1, 'type' => '']],
            'blank entity type' => [['entity_type' => '   ', 'entity_id' => 1, 'type' => 'Downloaded']],
            'empty record'   => [[]],
        ];
    }

    public function testNothingIsWrittenWhenEveryRecordIsUnusable(): void
    {
        $result = $this->repository->bulkCreate([[], ['entity_type' => 'x']]);

        self::assertSame(['inserted' => 0, 'skipped' => 2], $result);
        self::assertSame(0, $this->repository->spy->calls);
    }

    public function testAnEmptyBatchIsHarmless(): void
    {
        self::assertSame(['inserted' => 0, 'skipped' => 0], $this->repository->bulkCreate([]));
        self::assertSame(0, $this->repository->spy->calls);
    }

    /**
     * Rows are inserted directly, so anything the table has no column for would
     * be rejected by the database rather than ignored.
     */
    public function testRowsCarryOnlyTheColumnsTheTableHas(): void
    {
        $this->repository->bulkCreate([$this->record(['created_at' => '2026-01-01', 'unexpected' => 'x'])]);

        self::assertSame(
            ['user_id', 'entity_type', 'entity_id', 'type', 'meta'],
            array_keys($this->repository->spy->inserted[0])
        );
    }

    public function testCoercesIdentifiersAndDefaultsAnAbsentUser(): void
    {
        $this->repository->bulkCreate([[
            'entity_type' => 'tender_document_download',
            'entity_id'   => '44498',
            'type'        => 'Downloaded',
        ]]);

        $row = $this->repository->spy->inserted[0];
        self::assertSame(44498, $row['entity_id']);
        self::assertSame(0, $row['user_id']);
    }
}
