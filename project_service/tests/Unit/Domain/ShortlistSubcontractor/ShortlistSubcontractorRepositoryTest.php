<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\ShortlistSubcontractor;

use App\Domain\ShortlistSubcontractor\ShortlistSubcontractor;
use App\Domain\ShortlistSubcontractor\ShortlistSubcontractorRepository;
use PHPUnit\Framework\TestCase;

class ShortlistSubcontractorRepositoryTest extends TestCase
{
    public function testDefaultModelReturnsShortlistSubcontractor(): void
    {
        $repository = new ShortlistSubcontractorRepository();

        self::assertInstanceOf(ShortlistSubcontractor::class, $repository->getModel());
    }

    public function testGetByTenderIdDelegatesToModel(): void
    {
        $model = $this->createMock(ShortlistSubcontractor::class);
        $model
            ->expects($this->once())
            ->method('getByTenderId')
            ->with(1, 10)
            ->willReturn([['id' => 5]]);

        $repository = $this->repositoryWithModel($model);

        self::assertSame([['id' => 5]], $repository->getByTenderId(1, 10));
    }

    public function testGetByTenderIdsDelegatesToModel(): void
    {
        $model = $this->createMock(ShortlistSubcontractor::class);
        $model
            ->expects($this->once())
            ->method('getByTenderIds')
            ->with(2, [10, 20], true)
            ->willReturn([['id' => 6]]);

        $repository = $this->repositoryWithModel($model);

        self::assertSame([['id' => 6]], $repository->getByTenderIds(2, [10, 20], true));
    }

    public function testGetByProjectAndTenderIdsDelegatesToModel(): void
    {
        $model = $this->createMock(ShortlistSubcontractor::class);
        $model
            ->expects($this->once())
            ->method('getByProjectAndTenderIds')
            ->with(3, [7, 8])
            ->willReturn([['id' => 9]]);

        $repository = $this->repositoryWithModel($model);

        self::assertSame([['id' => 9]], $repository->getByProjectAndTenderIds(3, [7, 8]));
    }

    private function repositoryWithModel(ShortlistSubcontractor $model): ShortlistSubcontractorRepository
    {
        return new class ($model) extends ShortlistSubcontractorRepository {
            public function __construct(private ShortlistSubcontractor $fakeModel)
            {
            }

            public function getModel(string $name = '')
            {
                return $this->fakeModel;
            }
        };
    }
}
