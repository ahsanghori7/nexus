<?php
declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Instruction;

use App\Application\Actions\Instruction\InstructionAction;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

final class InstructionActionTest extends TestCase
{
    public function testGetInstructionByIdFiltersDocumentsByMeta(): void
    {
        $categories = [
            [
                'id' => 12,
                'parent_id' => 5,
                'entity_type' => 'instruction',
                'documents' => [
                    ['id' => 201, 'meta' => json_encode(['instruction_id' => 9, 'other' => 'x'])],
                    ['id' => 202, 'meta' => json_encode(['other' => 'skip'])],
                ],
            ],
        ];
        $repository = new InstructionRepositoryStub($categories);

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends InstructionAction {
            public function __construct(LoggerInterface $logger, private InstructionRepositoryStub $stub)
            {
                $this->logger = $logger;
                $this->repository = $this->stub;
            }
        };

        $response = $action->getInstructionById($this->createMock(Request::class), new Response(), ['id' => 5]);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(9, $payload['data']['documents'][0]['instruction_id']);
        self::assertSame(12, $payload['data']['documents'][0]['category_id']);
        self::assertCount(1, $payload['data']['documents']);
    }

    public function testGetInstructionByIdReturnsEmptyWhenNoCategories(): void
    {
        $action = new class($this->createMock(LoggerInterface::class)) extends InstructionAction {
            public function __construct(LoggerInterface $logger)
            {
                $this->logger = $logger;
                $this->repository = new InstructionRepositoryStub([]);
            }
        };

        $response = $action->getInstructionById($this->createMock(Request::class), new Response(), ['id' => 99]);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([], $payload['data']);
    }
}

final class InstructionRepositoryStub
{
    public function __construct(private array $categories)
    {
    }

    public function getModel(string $name = 'category'): InstructionModelStub
    {
        return new InstructionModelStub($this->categories);
    }
}

final class InstructionModelStub
{
    public function __construct(private array $rows)
    {
    }

    public function with(string $relation): self
    {
        return $this;
    }

    public function where(array $filter): self
    {
        $filtered = array_filter($this->rows, static function (array $row) use ($filter) {
            foreach ($filter as $key => $value) {
                if (!array_key_exists($key, $row) || $row[$key] !== $value) {
                    return false;
                }
            }
            return true;
        });

        return new self(array_values($filtered));
    }

    public function exists(): bool
    {
        return (bool) count($this->rows);
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
