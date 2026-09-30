<?php
declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Document;

use App\Application\Actions\Document\v1\DocumentAction;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

final class DocumentActionV1Test extends TestCase
{
    public function testCreateThrowsWhenOwnerMissing(): void
    {
        $action = $this->createAction([], new DocumentRepositoryStub());

        $this->expectException(\Exception::class);
        $action->create($this->createMock(Request::class), new Response());
    }

    public function testCreateEncodesMetaAndCreatesMappings(): void
    {
        $repository = new DocumentRepositoryStub(42);
        $action = $this->createAction(
            [
                'owner_id' => 3,
                'category' => 7,
                'meta' => ['foo' => 'bar'],
                'name' => 'Contract',
            ],
            $repository
        );

        $response = $action->create($this->createMock(Request::class), new Response());

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['id' => 42], $payload['data']);
        self::assertSame(json_encode(['foo' => 'bar']), $repository->createdPayloads[0]['meta']);
        self::assertSame([['document_id' => 42, 'category_id' => 7]], $repository->categoryMappings);
        self::assertSame([['document_id' => 42, 'owner_id' => 3]], $repository->ownerMappings);
    }

    public function testCreateReturnsBadRequestWhenRepositoryFails(): void
    {
        $repository = new DocumentRepositoryStub(null);
        $action = $this->createAction(['owner_id' => 99], $repository);

        $response = $action->create($this->createMock(Request::class), new Response());

        self::assertSame(400, $response->getStatusCode());
        self::assertSame([], $repository->categoryMappings);
        self::assertSame([], $repository->ownerMappings);
    }

    private function createAction(array $data, DocumentRepositoryStub $repository): DocumentAction
    {
        $action = new class($this->createMock(LoggerInterface::class), $repository) extends DocumentAction {
            public function __construct(LoggerInterface $logger, private DocumentRepositoryStub $repositoryStub)
            {
                $this->logger = $logger;
                $this->repository = $this->repositoryStub;
            }

            public function setData(array $data): void
            {
                $this->data = $data;
            }
        };

        $action->setData($data);

        return $action;
    }
}

final class DocumentRepositoryStub
{
    public array $categoryMappings = [];
    public array $ownerMappings = [];
    public array $createdPayloads = [];

    public function __construct(private $createReturn = 1)
    {
    }

    public function create(array $data)
    {
        $this->createdPayloads[] = $data;
        return $this->createReturn;
    }

    public function createCategoryMapping(array $data): void
    {
        $this->categoryMappings[] = $data;
    }

    public function createDocumentOwnerMapping(array $data): void
    {
        $this->ownerMappings[] = $data;
    }
}
