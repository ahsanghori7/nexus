<?php

declare(strict_types=1);

namespace Tests\Unit\Infrastructure\Action;

use App\Domain\AbstractModel;
use App\Infrastructure\Action\Paginator;
use App\Infrastructure\Environment;
use PHPUnit\Framework\TestCase;
use Slim\Psr7\Factory\ServerRequestFactory;

class PaginatorTest extends TestCase
{
    protected function setUp(): void
    {
        Environment::reset();
    }

    public function testLimitDefaultsToEnvironmentValueAndIsClamped(): void
    {
        $this->setEnvValue('REQUEST_PAGE_SIZE=25');
        $model = new FakeModel(1000);
        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/items')
            ->withQueryParams(['limit' => 1000]);

        $paginator = new Paginator($request, $model);

        self::assertSame(200, $paginator->getLimit());
    }

    public function testOffsetAndCurrentPage(): void
    {
        $model = new FakeModel(300);
        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/items')
            ->withQueryParams(['limit' => 50, 'offset' => 150]);
        $paginator = new Paginator($request, $model);

        self::assertSame(150, $paginator->getOffset());
        self::assertSame(3, $paginator->getCurrentPage());
    }

    public function testLinksIncludeNextAndPrev(): void
    {
        $model = new FakeModel(500);
        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/items')
            ->withQueryParams(['limit' => 80, 'offset' => 80, 'status' => 'open']);
        $paginator = new Paginator($request, $model);

        $links = $paginator->getLinks();

        self::assertSame('/items?limit=80&offset=160&status=open', $links['next']);
        self::assertSame('', $links['prev']);
        self::assertSame(1, $links['page']);
        self::assertSame(7, $links['pages']);
        self::assertSame(500, $links['total']);
    }

    public function testPrevLinkWhenOffsetAllows(): void
    {
        $model = new FakeModel(300);
        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/items')
            ->withQueryParams(['limit' => 50, 'offset' => 120]);
        $paginator = new Paginator($request, $model);

        self::assertSame('/items?limit=50&offset=70', $paginator->getLink('prev'));
    }

    private function setEnvValue(string $contents): void
    {
        $path = tempnam(sys_get_temp_dir(), 'env');
        file_put_contents($path, $contents);
        Environment::loadEnvFile(dirname($path), basename($path));
        unlink($path);
    }
}

class FakeModel extends AbstractModel
{
    public function __construct(private int $count)
    {
    }

    public function getCount(): int
    {
        return $this->count;
    }
}
