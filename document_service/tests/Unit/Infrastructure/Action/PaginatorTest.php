<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Action;

use App\Domain\AbstractModel;
use App\Infrastructure\Action\Paginator;
use App\Infrastructure\Environment;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UriInterface;

class PaginatorTest extends TestCase
{
    protected function setUp(): void
    {
        $this->resetEnvironment();
    }

    protected function tearDown(): void
    {
        $this->resetEnvironment();
    }

    public function testLimitDefaultsToEnvironmentValue(): void
    {
        $this->setEnvironmentValues(['REQUEST_PAGE_SIZE' => 50]);
        $paginator = $this->createPaginator([], 10);

        self::assertSame(50, $paginator->getLimit());
    }

    public function testLimitIsCappedAtMax(): void
    {
        $paginator = $this->createPaginator(['limit' => 500], 10);

        self::assertSame(Paginator::MAX_LIMIT, $paginator->getLimit());
    }

    public function testLinksExposePagingInformation(): void
    {
        $paginator = $this->createPaginator(['limit' => 10, 'offset' => 10], 35);

        self::assertSame(1, $paginator->getCurrentPage());
        self::assertSame(4, $paginator->getTotalPages());
        self::assertSame(10, $paginator->getLimit());
        self::assertSame(10, $paginator->getOffset());

        self::assertSame([
            'next' => '/documents?limit=10&offset=20',
            'prev' => '',
            'page' => 1,
            'pages' => 4,
            'total' => 35,
        ], $paginator->getLinks());
    }

    private function createPaginator(array $queryParams, int $count): Paginator
    {
        /** @var AbstractModel&MockObject $model */
        $model = $this->getMockBuilder(AbstractModel::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['getCount'])
            ->getMock();
        $model->method('getCount')->willReturn($count);

        $uri = $this->createMock(UriInterface::class);
        $uri->method('getPath')->willReturn('/documents');

        $request = $this->createMock(ServerRequestInterface::class);
        $request->method('getQueryParams')->willReturn($queryParams);
        $request->method('getUri')->willReturn($uri);

        return new Paginator($request, $model);
    }

    private function resetEnvironment(): void
    {
        $this->setEnvironmentValues([]);
    }

    private function setEnvironmentValues(array $values): void
    {
        $ref = new \ReflectionClass(Environment::class);
        $property = $ref->getProperty('values');
        $property->setAccessible(true);
        $property->setValue($values);
    }
}
