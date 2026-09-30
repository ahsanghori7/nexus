<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Document;

use App\Application\Actions\ActionPayload;
use App\Application\Actions\Document\v2\DocumentAction;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;

class DocumentActionV2Test extends TestCase
{
    public function testCreateThrowsWhenOwnerMissing(): void
    {
        $action = $this->createAction([], $this->createMock(TestDocumentRepository::class));

        $this->expectException(\Exception::class);
        $action->create($this->createMock(Request::class), new Response());
    }

    public function testCreatePersistsOwnerAndCategoryMappings(): void
    {
        $repository = $this->createMock(TestDocumentRepository::class);
        $repository->expects($this->once())->method('create')->with([
            'owner_id' => 4,
            'category' => 9,
        ])->willReturn(12);
        $repository->expects($this->once())
            ->method('createCategoryMapping')
            ->with(['document_id' => 12, 'category_id' => 9]);
        $repository->expects($this->once())
            ->method('createDocumentOwnerMapping')
            ->with(['document_id' => 12, 'owner_id' => 4]);

        $action = $this->createAction(['owner_id' => 4, 'category' => 9], $repository);

        $response = $action->create($this->createMock(Request::class), new Response());

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 12', (string)$response->getBody());
    }

    public function testCreateReturnsBadRequestWhenCreateFails(): void
    {
        $repository = $this->createMock(TestDocumentRepository::class);
        $repository->expects($this->once())->method('create')->willReturn(null);
        $repository->expects($this->never())->method('createCategoryMapping');
        $repository->expects($this->never())->method('createDocumentOwnerMapping');

        $action = $this->createAction(['owner_id' => 7], $repository);

        $response = $action->create($this->createMock(Request::class), new Response());

        self::assertSame(400, $response->getStatusCode());
    }

    private function createAction(array $data, TestDocumentRepository $repository): DocumentAction
    {
        $action = new class($this->createMock(LoggerInterface::class), $repository) extends DocumentAction {
            public function __construct(LoggerInterface $logger, private TestDocumentRepository $repo)
            {
                parent::__construct($logger);
                $this->repository = $this->repo;
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

class TestDocumentRepository
{
    public function create(array $data)
    {
        return null;
    }

    public function createCategoryMapping(array $data): void
    {
    }

    public function createDocumentOwnerMapping(array $data): void
    {
    }
}
