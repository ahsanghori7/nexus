<?php
declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Category;

use App\Application\Actions\Category\v2\CategoryAction;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

final class CategoryActionV2Test extends TestCase
{
    public function testListFiltersByEntityIdAndParent(): void
    {
        $repository = new CategoryRepositoryStub([
            ['id' => 1, 'entity_id' => 5, 'parent_id' => 0, 'documents' => [['id' => 10]]],
            ['id' => 2, 'entity_id' => 9, 'parent_id' => 5, 'documents' => []],
            ['id' => 3, 'entity_id' => 8, 'parent_id' => 7, 'documents' => []],
        ]);

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends CategoryAction {
            public function __construct(LoggerInterface $logger, private CategoryRepositoryStub $stub)
            {
                $this->logger = $logger;
                $this->repository = $this->stub;
            }
        };

        $request = $this->createConfiguredMock(Request::class, [
            'getQueryParams' => ['entity_id' => 5],
        ]);
        $response = $action->list($request, new Response());

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertCount(2, $payload['data']);
        $ids = array_column($payload['data'], 'id');
        sort($ids);
        self::assertSame([1, 2], $ids);
    }
}

final class CategoryRepositoryStub
{
    public function __construct(private array $categories)
    {
    }

    public function getModel(): CategoryModelStub
    {
        return new CategoryModelStub($this->categories);
    }
}

final class CategoryModelStub
{
    private array $baseRows;
    private array $rows;

    public function __construct(array $rows)
    {
        $this->baseRows = $rows;
        $this->rows = $rows;
    }

    public function with(string $relation): self
    {
        return $this;
    }

    public function where($columnOrCallback, $operator = null, $value = null): self
    {
        if (is_callable($columnOrCallback)) {
            $columnOrCallback($this);
            return $this;
        }

        if (is_array($columnOrCallback)) {
            $this->rows = array_values(array_filter($this->rows, static function (array $row) use ($columnOrCallback) {
                foreach ($columnOrCallback as $key => $val) {
                    if (!array_key_exists($key, $row) || $row[$key] !== $val) {
                        return false;
                    }
                }
                return true;
            }));
            return $this;
        }

        $comparisonValue = $value ?? $operator;
        $this->rows = array_values(array_filter($this->rows, static function (array $row) use ($columnOrCallback, $comparisonValue) {
            return array_key_exists($columnOrCallback, $row) && $row[$columnOrCallback] === $comparisonValue;
        }));
        return $this;
    }

    public function orWhere(string $column, $operator = null, $value = null): self
    {
        $comparisonValue = $value ?? $operator;
        $matching = array_filter($this->baseRows, static function (array $row) use ($column, $comparisonValue) {
            return array_key_exists($column, $row) && $row[$column] === $comparisonValue;
        });
        $this->rows = array_values(array_unique(array_merge($this->rows, $matching), SORT_REGULAR));
        return $this;
    }

    public function get(): object
    {
        return new class($this->rows) {
            public function __construct(private array $rows)
            {
            }

            public function toArray(): array
            {
                return $this->rows;
            }
        };
    }
}
