<?php
declare(strict_types=1);

namespace Tests\Domain;

use App\Domain\AbstractModel;
use App\Domain\AbstractRepository;
use PHPUnit\Framework\TestCase;

class DummyModel
{
}

final class RecordingModel
{
    public static array $savedPayloads = [];
    public static array $deletedIds = [];
    public static ?int $nextId = null;

    private int $id = 0;

    public static function reset(): void
    {
        self::$savedPayloads = [];
        self::$deletedIds = [];
        self::$nextId = null;
    }

    public function save(array $payload): self
    {
        self::$savedPayloads[] = $payload;
        $this->id = self::$nextId ?? ($payload['id'] ?? 1);
        return $this;
    }

    public function delete(int $id): bool
    {
        self::$deletedIds[] = $id;
        return true;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getIdField(): string
    {
        return 'id';
    }
}

final class AbstractRepositoryTest extends TestCase
{
    public function testGetModelReturnsMappedClass(): void
    {
        $repo = new class extends AbstractRepository {
            protected $models = [
                'foo' => DummyModel::class,
            ];
        };

        $this->assertInstanceOf(DummyModel::class, $repo->getModel('foo'));
    }

    public function testGetModelUnknownThrows(): void
    {
        $repo = new class extends AbstractRepository {
        };

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Unknown Model nope');

        $repo->getModel('nope');
    }

    public function testGetModelUsesDefaultWhenNoNameProvided(): void
    {
        RecordingModel::reset();
        $repo = new RecordingRepositoryStub();

        $this->assertInstanceOf(RecordingModel::class, $repo->getModel());
    }

    public function testCreatePersistsPayloadAndReturnsModelId(): void
    {
        RecordingModel::reset();
        RecordingModel::$nextId = 77;
        $repo = new RecordingRepositoryStub();

        $result = $repo->create(['name' => 'test']);

        $this->assertSame(77, $result);
        $this->assertSame([['name' => 'test']], RecordingModel::$savedPayloads);
    }

    public function testDeleteByIdDelegatesToModel(): void
    {
        RecordingModel::reset();
        $repo = new RecordingRepositoryStub();

        $this->assertTrue($repo->deleteById(55));
        $this->assertSame([55], RecordingModel::$deletedIds);
    }

    public function testUpdateByIdAddsPrimaryKeyBeforeSaving(): void
    {
        RecordingModel::reset();
        $repo = new RecordingRepositoryStub();

        $repo->updateById(7, ['name' => 'Acme']);

        $this->assertSame([['name' => 'Acme', 'id' => 7]], RecordingModel::$savedPayloads);
    }

    public function testUpdateModelByConditionsExecutesStatement(): void
    {
        UpdateModelExecDb::reset();
        $repo = new UpdateModelRepositoryStub();

        $result = $repo->updateModelByConditions('updatable', ['name' => 'Updated'], ['id' => 9]);

        $this->assertTrue($result);
        $this->assertSame(['UPDATE update_model SET name = Updated WHERE id = 9'], UpdateModelExecDb::$executedSql);
    }

    public function testUpdateModelByConditionsThrowsWhenColumnsUnknown(): void
    {
        $repo = new UpdateModelRepositoryStub();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Unknown columns invalid for table update_model');

        $repo->updateModelByConditions('updatable', ['invalid' => 'invalid'], ['id' => 3]);
    }
}

final class RecordingRepositoryStub extends AbstractRepository
{
    public const DEFAULT_MODEL = 'recording';

    protected $models = [
        'recording' => RecordingModel::class,
    ];
}

final class UpdateModelRepositoryStub extends AbstractRepository
{
    protected $models = [
        'updatable' => UpdateModel::class,
    ];
}

final class UpdateModel extends AbstractModel
{
    protected $columns = [
        'id' => ['type' => 'int'],
        'name' => ['type' => 'string'],
    ];

    public function getDb()
    {
        return UpdateModelExecDb::class;
    }
}

final class UpdateModelExecDb
{
    public static array $executedSql = [];

    public static function reset(): void
    {
        self::$executedSql = [];
    }

    public static function exec(string $sql): int
    {
        self::$executedSql[] = $sql;
        return 1;
    }
}
