<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Action;

use App\Infrastructure\Action\SqlPaginator;
use App\Domain\AbstractModel;
use Tests\TestCase;

final class SqlPaginatorTest extends TestCase
{
    public function testGetCountCachesDatabaseResult(): void
    {
        $model = new SqlPaginatorModelStub();
        $model->dbCount = 18;

        $paginator = new SqlPaginator(
            $this->createRequest('GET', '/resource'),
            $model,
            'SELECT COUNT(*) FROM resource'
        );

        self::assertSame(18, $paginator->getCount());
        self::assertSame(18, $paginator->getCount(), 'cached count should be reused');
        self::assertSame(1, $model->dbFetches);
    }

    public function testGetCountUsesCachedValueWhenDatabaseLacksGetRow(): void
    {
        $model = new SqlPaginatorNoGetRowModelStub();
        $request = $this->createRequest('GET', '/resource');
        $paginator = new SqlPaginator($request, $model, 'SELECT');

        $prop = new \ReflectionProperty(SqlPaginator::class, 'countCache');
        $prop->setAccessible(true);
        $prop->setValue($paginator, 12);

        self::assertSame(12, $paginator->getCount());
        self::assertSame(0, $model->dbFetches);
    }

    public function testJsonSerializeBuildsLinksWithQueryParams(): void
    {
        $model = new SqlPaginatorModelStub();
        $model->dbCount = 26;

        $request = $this->createRequest('GET', '/items')
            ->withQueryParams([
                'limit' => '5',
                'offset' => '10',
                'term' => 'steel',
            ]);

        $paginator = new SqlPaginator($request, $model, 'SELECT');
        $links = $paginator->jsonSerialize();

        self::assertSame('/items?limit=5&offset=15&term=steel', $links['next']);
        self::assertSame('/items?limit=5&offset=5&term=steel', $links['prev']);
        self::assertSame(2, $links['page']);
        self::assertSame(6, $links['pages']);
        self::assertSame(26, $links['total']);
    }

    public function testLimitIsCappedAtMaximum(): void
    {
        $model = new SqlPaginatorModelStub();
        $request = $this->createRequest('GET', '/large')
            ->withQueryParams(['limit' => '9999']);

        $paginator = new SqlPaginator($request, $model, 'SELECT');
        self::assertSame(200, $paginator->getLimit());
    }

    public function testEmptyDatasetProducesNoLinks(): void
    {
        $model = new SqlPaginatorModelStub();
        $model->dbCount = 0;

        $request = $this->createRequest('GET', '/items')
            ->withQueryParams(['limit' => '5', 'offset' => '0']);

        $paginator = new SqlPaginator($request, $model, 'SELECT');
        $links = $paginator->jsonSerialize();

        self::assertSame('', $links['next']);
        self::assertSame('', $links['prev']);
        self::assertSame(0, $links['pages']);
        self::assertSame(0, $links['total']);
    }
}

final class SqlPaginatorModelStub extends AbstractModel
{
    public int $dbCount = 0;
    public int $dbFetches = 0;

    public function getCount(array $where = []): int
    {
        return $this->dbCount;
    }

    public function getName(): string
    {
        return 'stub';
    }

    public function getDb()
    {
        SqlPaginatorDbStub::$model = $this;
        return SqlPaginatorDbStub::class;
    }
}

final class SqlPaginatorDbStub
{
    public static ?SqlPaginatorModelStub $model = null;

    public static function getRow(string $sql): array
    {
        if (self::$model) {
            self::$model->dbFetches++;
            return ['c' => self::$model->dbCount];
        }
        return ['c' => 0];
    }
}

final class SqlPaginatorNoGetRowModelStub extends AbstractModel
{
    public int $dbFetches = 0;

    public function getCount(array $where = []): int
    {
        return 0;
    }

    public function getName(): string
    {
        return 'stub';
    }

    public function getDb()
    {
        $this->dbFetches++;
        return new class {
        };
    }
}
