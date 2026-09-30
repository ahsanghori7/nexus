<?php
declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Template;

use App\Application\Actions\Template\TemplateAction;
use Illuminate\Database\Eloquent\Builder;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

final class TemplateActionTest extends TestCase
{
    public function testListFiltersTemplatesByParams(): void
    {
        $repository = new TemplateRepositoryStub(
            templates: [
                ['id' => 1, 'name' => 'General', 'type_id' => 1],
                ['id' => 2, 'name' => 'Contracts', 'type_id' => 2],
            ],
            mappings: [],
            types: []
        );
        $action = $this->createAction($repository);

        $request = $this->createConfiguredMock(Request::class, [
            'getQueryParams' => ['type_id' => 2],
        ]);

        $response = $action->list($request, new Response());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame([['id' => 2, 'name' => 'Contracts', 'type_id' => 2]], $payload['data']);
    }

    public function testListByUserFallsBackToDefaultMapping(): void
    {
        $defaultRows = [
            ['user_id' => 0, 'templates' => [['id' => 9, 'type_id' => 3, 'name' => 'Default']]],
        ];
        $defaultBuilder = $this->getMockBuilder(Builder::class)
            ->disableOriginalConstructor()
            ->onlyMethods(['get'])
            ->getMock();
        $defaultBuilder->method('get')->willReturn(new class($defaultRows) {
            public function __construct(private array $rows)
            {
            }

            public function toArray(): array
            {
                return $this->rows;
            }
        });

        $repository = new TemplateRepositoryStub(templates: [], mappings: [], types: []);
        $action = new class($this->createMock(LoggerInterface::class), $repository, $defaultBuilder) extends TemplateAction {
            public function __construct(
                LoggerInterface $logger,
                private TemplateRepositoryStub $stub,
                private Builder $defaultBuilder
            ) {
                $this->logger = $logger;
                $this->repository = $this->stub;
            }

            public function getDefaultTemplates(): Builder
            {
                return $this->defaultBuilder;
            }
        };

        $request = $this->createConfiguredMock(Request::class, [
            'getQueryParams' => [],
        ]);

        $response = $action->listByUser($request, new Response(), ['user_id' => 99]);
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame([['id' => 9, 'type_id' => 3, 'name' => 'Default']], $payload['data']);
    }

    public function testListByUserAppliesTypeFilter(): void
    {
        $repository = new TemplateRepositoryStub(
            templates: [],
            mappings: [
                [
                    'user_id' => 7,
                    'templates' => [
                        ['id' => 10, 'type_id' => 1, 'name' => 'General'],
                        ['id' => 11, 'type_id' => 2, 'name' => 'Special'],
                    ],
                ],
            ],
            types: []
        );
        $action = $this->createAction($repository);

        $request = $this->createConfiguredMock(Request::class, [
            'getQueryParams' => ['type_id' => 2],
        ]);

        $response = $action->listByUser($request, new Response(), ['user_id' => 7]);
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame([['id' => 11, 'type_id' => 2, 'name' => 'Special']], $payload['data']);
    }

    public function testGetTypesReturnsIdLabelMap(): void
    {
        $repository = new TemplateRepositoryStub(
            templates: [],
            mappings: [],
            types: [
                ['id' => 1, 'label' => 'PDF'],
                ['id' => 2, 'label' => 'Docx'],
            ]
        );
        $action = $this->createAction($repository);

        $response = $action->getTypes($this->createMock(Request::class), new Response(), []);
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame([1 => 'PDF', 2 => 'Docx'], $payload['data']);
    }

    private function createAction(TemplateRepositoryStub $repository): TemplateAction
    {
        return new class($this->createMock(LoggerInterface::class), $repository) extends TemplateAction {
            public function __construct(LoggerInterface $logger, private TemplateRepositoryStub $stub)
            {
                $this->logger = $logger;
                $this->repository = $this->stub;
            }
        };
    }
}

final class TemplateRepositoryStub
{
    public function __construct(
        private array $templates,
        private array $mappings,
        private array $types
    ) {
    }

    public function getModel(string $name = 'template'): TemplateModelStub
    {
        return match ($name) {
            'mapping' => new TemplateModelStub($this->mappings),
            'type' => new TemplateModelStub($this->types),
            default => new TemplateModelStub($this->templates),
        };
    }
}

final class TemplateModelStub
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
