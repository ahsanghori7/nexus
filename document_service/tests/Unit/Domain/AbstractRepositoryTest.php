<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use App\Domain\AbstractRepository;
use PHPUnit\Framework\TestCase;

class AbstractRepositoryTest extends TestCase
{
    public function testGetModelReturnsDefaultModel(): void
    {
        $repository = new class extends AbstractRepository {
            public const DEFAULT_MODEL = 'sample';
            protected $models = ['sample' => RepositoryModelDouble::class];
        };

        self::assertInstanceOf(RepositoryModelDouble::class, $repository->getModel());
    }

    public function testGetModelThrowsForUnknownModel(): void
    {
        $repository = new class extends AbstractRepository {
        };

        $this->expectException(\Exception::class);
        $repository->getModel('missing');
    }

    public function testFindAllDelegatesToModel(): void
    {
        $model = $this->createMock(RepositoryModelDouble::class);
        $model->expects($this->once())
            ->method('findAll')
            ->with(['k' => 'v'], 5, 2)
            ->willReturn(['ok']);

        $repository = new RepositoryWithInjectedModel($model);

        self::assertSame(['ok'], $repository->findAll(['k' => 'v'], 5, 2));
    }

    public function testDeleteByIdDelegatesToModel(): void
    {
        $model = $this->createMock(RepositoryModelDouble::class);
        $model->expects($this->once())
            ->method('deleteById')
            ->with(42)
            ->willReturn(true);

        $repository = new RepositoryWithInjectedModel($model);

        self::assertTrue($repository->deleteById(42));
    }

    public function testCreateUsesStoreReturnId(): void
    {
        $model = $this->createMock(RepositoryModelDouble::class);
        $model->expects($this->once())
            ->method('store')
            ->with(['a' => 'b'])
            ->willReturnSelf();
        $model->expects($this->once())
            ->method('getId')
            ->willReturn(99);

        $repository = new RepositoryWithInjectedModel($model);

        self::assertSame(99, $repository->create(['a' => 'b']));
    }

    public function testUpdateByIdAddsIdFieldAndDelegates(): void
    {
        $model = $this->createMock(RepositoryModelDouble::class);
        $model->expects($this->once())
            ->method('getIdField')
            ->willReturn('custom_id');
        $model->expects($this->once())
            ->method('store')
            ->with(['field' => 'value', 'custom_id' => 7])
            ->willReturn(true);

        $repository = new RepositoryWithInjectedModel($model);

        self::assertTrue($repository->updateById(7, ['field' => 'value']));
    }
}

class RepositoryModelDouble
{
    public function findAll(array $filters = [], int $limit = 0, int $offset = 0)
    {
    }

    public function deleteById(int $id): bool
    {
        return true;
    }

    public function store(array $args)
    {
        return $this;
    }

    public function getIdField(): string
    {
        return 'id';
    }

    public function getId(): int
    {
        return 1;
    }
}

class RepositoryWithInjectedModel extends AbstractRepository
{
    protected $model;

    public function __construct(RepositoryModelDouble $model)
    {
        $this->model = $model;
    }

    public function getModel(string $name = "")
    {
        return $this->model;
    }
}
