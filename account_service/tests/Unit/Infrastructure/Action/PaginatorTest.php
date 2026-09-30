<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Action;

use App\Infrastructure\Action\Paginator;
use App\Infrastructure\Environment;
use Tests\TestCase;

final class PaginatorTest extends TestCase
{
    private array $originalEnvironment = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->originalEnvironment = $this->getEnvironmentValues();
        $this->setEnvironmentValues([]);
    }

    protected function tearDown(): void
    {
        $this->setEnvironmentValues($this->originalEnvironment);
        parent::tearDown();
    }

    public function testModelCountIsCachedAfterFirstLookup(): void
    {
        $model = new PaginatorModelStub(75);
        $paginator = $this->createPaginator([], 0, $model);

        self::assertSame(75, $paginator->getModelCount());
        self::assertSame(75, $paginator->getModelCount());
        self::assertSame(1, $model->getCountCalls);
    }

    public function testLimitDefaultsToEnvironmentValue(): void
    {
        $this->setEnvironmentValues(['REQUEST_PAGE_SIZE' => 25]);
        $paginator = $this->createPaginator();

        self::assertSame(25, $paginator->getLimit());
    }

    public function testLimitClampsToMaximum(): void
    {
        $paginator = $this->createPaginator(['limit' => '999']);
        self::assertSame(Paginator::MAX_LIMIT, $paginator->getLimit());
    }

    public function testLimitCanBeZeroWithoutTriggeringExceptionsWhenQueriedDirectly(): void
    {
        $paginator = $this->createPaginator(['limit' => '0']);
        self::assertSame(0, $paginator->getLimit());
    }

    public function testOffsetDefaultsToZeroAndRetainsNegativeValues(): void
    {
        $paginator = $this->createPaginator();
        self::assertSame(0, $paginator->getOffset());

        $paginatorWithNegativeOffset = $this->createPaginator(['offset' => '-10']);
        self::assertSame(-10, $paginatorWithNegativeOffset->getOffset());
    }

    public function testLimitOffsetPairUsesComputedValues(): void
    {
        $paginator = $this->createPaginator(['limit' => '15', 'offset' => '30']);

        self::assertSame([15, 30], $paginator->getLimitOffset());
    }

    public function testCurrentPageAndTotalPagesCalculatedFromLimitAndCount(): void
    {
        $paginator = $this->createPaginator(['limit' => '50', 'offset' => '150'], 305);

        self::assertSame(3, $paginator->getCurrentPage());
        self::assertSame(7, $paginator->getTotalPages());
    }

    public function testCurrentPageIsZeroWhenOffsetNotSet(): void
    {
        $paginator = $this->createPaginator(['limit' => '25'], 10);
        self::assertSame(0, $paginator->getCurrentPage());
    }

    public function testNextAndPreviousOffsetsRespectBoundaries(): void
    {
        $paginator = $this->createPaginator(['limit' => '100', 'offset' => '200'], 450);

        self::assertSame(300, $paginator->getNext());
        self::assertSame(100, $paginator->getPrev());
    }

    public function testNextReturnsNullWhenAtEndOfCollection(): void
    {
        $paginator = $this->createPaginator(['limit' => '100', 'offset' => '300'], 350);

        self::assertNull($paginator->getNext());
    }

    public function testPrevReturnsNullWhenOnFirstPage(): void
    {
        $paginator = $this->createPaginator(['limit' => '100', 'offset' => '100'], 400);

        self::assertNull($paginator->getPrev());
    }

    public function testGetLinkBuildsQueryPreservingExistingParameters(): void
    {
        $params = [
            'limit' => '50',
            'offset' => '50',
            'filter' => 'active',
        ];

        $paginator = $this->createPaginator($params, 200);
        $nextLink = $paginator->getLink('next');

        self::assertSame(
            '/users?limit=50&offset=100&filter=active',
            $nextLink
        );
    }

    public function testGetLinkReturnsEmptyStringWhenNoMatchOrUnsupportedType(): void
    {
        $paginator = $this->createPaginator(['limit' => '25'], 10);

        self::assertSame('', $paginator->getLink('next'));
        self::assertSame('', $paginator->getLink('prev'));
        self::assertSame('', $paginator->getLink('first'));
    }

    public function testUpdateParamsOverridesValuesAndLeavesOthersIntact(): void
    {
        $paginator = $this->createPaginator(['limit' => '25', 'offset' => '50', 'search' => 'smith'], 100);

        $updated = $paginator->updateParams(['offset' => 75]);

        self::assertSame(
            ['limit' => '25', 'offset' => 75, 'search' => 'smith'],
            $updated
        );
    }

    public function testGetLinksIncludesPaginationMetadata(): void
    {
        $paginator = $this->createPaginator(['limit' => '40', 'offset' => '80'], 140);

        $links = $paginator->getLinks();

        self::assertSame('/users?limit=40&offset=120', $links['next']);
        self::assertSame('/users?limit=40&offset=40', $links['prev']);
        self::assertSame(2, $links['page']);
        self::assertSame(4, $links['pages']);
        self::assertSame(140, $links['total']);
    }

    public function testJsonSerializeReturnsLinkStructure(): void
    {
        $paginator = $this->createPaginator(['limit' => '30', 'offset' => '0'], 60);

        self::assertSame($paginator->getLinks(), $paginator->jsonSerialize());
    }

    public function testNonNumericQueryValuesAreSafelyCoerced(): void
    {
        $paginator = $this->createPaginator(['limit' => 'invalid', 'offset' => 'ten'], 0);

        self::assertSame(0, $paginator->getLimit());
        self::assertSame(0, $paginator->getOffset());
    }

    private function createPaginator(array $query = [], int $count = 0, ?PaginatorModelStub $model = null): Paginator
    {
        $request = $this->createRequest('GET', '/users')->withQueryParams($query);
        $model ??= new PaginatorModelStub($count);

        return new Paginator($request, $model);
    }

    private function setEnvironmentValues(array $values): void
    {
        $ref = new \ReflectionClass(Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        $prop->setValue(null, $values);
    }

    private function getEnvironmentValues(): array
    {
        $ref = new \ReflectionClass(Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        return $prop->getValue();
    }
}

final class PaginatorModelStub extends \App\Domain\AbstractModel
{
    public int $getCountCalls = 0;

    public function __construct(private int $count)
    {
    }

    public function setCount(int $count): void
    {
        $this->count = $count;
    }

    public function getCount(array $where = []): int
    {
        $this->getCountCalls++;
        return $this->count;
    }
}
