<?php
declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Document;

use App\Application\Actions\Document\v1\DocumentAction;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\StreamFactory;
use Slim\Psr7\Factory\UploadedFileFactory;
use Slim\Psr7\Response;

final class DocumentActionV1AdditionalTest extends TestCase
{
    public function testGetUploadedDocumentReturnsFile(): void
    {
        $action = $this->createAction(new DocumentActionRepositoryFake());
        $stream = (new StreamFactory())->createStream('payload');
        $upload = (new UploadedFileFactory())->createUploadedFile(
            $stream,
            (int) $stream->getSize(),
            UPLOAD_ERR_OK,
            'doc.txt',
            'text/plain'
        );

        $request = $this->createMock(Request::class);
        $request->method('getUploadedFiles')->willReturn([DocumentAction::DOCUMENT_UPLOAD_KEY => $upload]);

        self::assertSame($upload, $action->getUploadedDocument($request));
    }

    public function testGetUploadedDocumentThrowsWhenMissing(): void
    {
        $action = $this->createAction(new DocumentActionRepositoryFake());
        $request = $this->createMock(Request::class);
        $request->method('getUploadedFiles')->willReturn([]);

        $this->expectException(\Exception::class);
        $action->getUploadedDocument($request);
    }

    public function testGetOwnerReturnsOwnerIds(): void
    {
        $repository = new DocumentActionRepositoryFake(ownerMappingRows: [
            ['document_id' => 5, 'owner_id' => 3],
            ['document_id' => 5, 'owner_id' => 7],
        ]);
        $action = $this->createAction($repository);

        $response = $action->getOwner($this->createMock(Request::class), new Response(), ['id' => 5]);
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame([3, 7], $payload['data']);
    }

    public function testUpdateOwnerCreatesMapping(): void
    {
        $repository = new DocumentActionRepositoryFake();
        $action = $this->createAction($repository, ['owner_id' => 44]);

        $response = $action->updateOwner($this->createMock(Request::class), new Response(), ['id' => 10]);

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['success' => true], $payload['data']);
        self::assertSame([['document_id' => 10, 'owner_id' => 44]], $repository->ownerMappingsCreated);
    }

    public function testListTypesAndSubTypesReturnData(): void
    {
        $repository = new DocumentActionRepositoryFake(
            types: [['id' => 1, 'label' => 'Contract']],
            subTypes: [['id' => 2, 'label' => 'RFI']]
        );
        $action = $this->createAction($repository);

        $typesResponse = $action->listTypes($this->createMock(Request::class), new Response(), []);
        $typesPayload = json_decode((string) $typesResponse->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([['id' => 1, 'label' => 'Contract']], $typesPayload['data']);

        $subTypesResponse = $action->listSubTypes($this->createMock(Request::class), new Response(), []);
        $subTypesPayload = json_decode((string) $subTypesResponse->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([['id' => 2, 'label' => 'RFI']], $subTypesPayload['data']);
    }

    public function testGetStatusReturnsFilteredData(): void
    {
        $repository = new DocumentActionRepositoryFake(
            statuses: [
                ['id' => 1, 'label' => 'Pending'],
                ['id' => 2, 'label' => 'Completed'],
            ]
        );
        $action = $this->createAction($repository);

        $request = $this->createConfiguredMock(Request::class, [
            'getQueryParams' => ['id' => 2],
        ]);

        $response = $action->getStatus($request, new Response(), []);
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([['id' => 2, 'label' => 'Completed']], $payload['data']);
    }

    public function testRequestedReturnsMatchingRecords(): void
    {
        $repository = new DocumentActionRepositoryFake(
            requests: [
                ['id' => 1, 'request_fullfilled_at' => null],
                ['id' => 2, 'request_fullfilled_at' => '2023-01-01'],
            ]
        );
        $action = $this->createAction($repository);

        $request = $this->createConfiguredMock(Request::class, [
            'getQueryParams' => ['request_fullfilled_at' => 'isNull'],
        ]);

        $response = $action->requested($request, new Response(), []);
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([['id' => 1, 'request_fullfilled_at' => null]], $payload['data']);
    }

    public function testCreateRequestHandlesSuccessAndFailure(): void
    {
        $successfulRepository = new DocumentActionRepositoryFake();
        $successAction = $this->createAction($successfulRepository, ['foo' => 'bar']);
        $successResponse = $successAction->createRequest($this->createMock(Request::class), new Response(), []);
        $successPayload = json_decode((string) $successResponse->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['id' => 1], $successPayload['data']);

        $failingRepository = new DocumentActionRepositoryFake(requestStoreException: new \Exception('fail'));
        $failAction = $this->createAction($failingRepository, ['foo' => 'bar']);
        $failResponse = $failAction->createRequest($this->createMock(Request::class), new Response(), []);
        self::assertSame(400, $failResponse->getStatusCode());
    }

    public function testMapRequestDocumentHandlesExceptions(): void
    {
        $repository = new DocumentActionRepositoryFake();
        $action = $this->createAction($repository, ['request_id' => 7]);
        $response = $action->mapRequestDocument($this->createMock(Request::class), new Response(), []);
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertTrue($payload['data']['success']);

        $failingRepository = new DocumentActionRepositoryFake(requestMappingException: new \Exception('fail'));
        $failingAction = $this->createAction($failingRepository, ['request_id' => 7]);
        $failResponse = $failingAction->mapRequestDocument($this->createMock(Request::class), new Response(), []);
        self::assertSame(400, $failResponse->getStatusCode());
    }

    public function testDeleteChecksOwnerPermission(): void
    {
        $repository = new DocumentActionRepositoryFake(ownerCheck: [12 => false]);
        $action = $this->createAction($repository, ['owner_id' => 3]);

        $response = $action->delete($this->createMock(Request::class), new Response(), ['id' => 12]);

        self::assertSame(401, $response->getStatusCode());
    }

    public function testDeleteRemovesDocument(): void
    {
        $repository = new DocumentActionRepositoryFake(ownerCheck: [9 => true]);
        $action = $this->createAction($repository, ['owner_id' => 3]);

        $response = $action->delete($this->createMock(Request::class), new Response(), ['id' => 9]);
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(203, $response->getStatusCode());
        self::assertTrue($payload['data']['success']);
    }

    public function testCreateCategoryAddsNewCategory(): void
    {
        $repository = new DocumentActionRepositoryFake();
        $action = $this->createAction($repository, ['category_label' => 'Specs', 'category_pid' => 8]);

        $response = $action->createCategory($this->createMock(Request::class), new Response(), []);

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([['label' => 'Specs', 'entity_id' => 8]], $repository->categoriesAdded);
    }

    public function testCreateCategoryReturnsBadRequestWhenMissingFields(): void
    {
        $repository = new DocumentActionRepositoryFake();
        $action = $this->createAction($repository, ['category_label' => 'Specs']);

        $response = $action->createCategory($this->createMock(Request::class), new Response(), []);

        self::assertSame(400, $response->getStatusCode());
    }

    private function createAction(DocumentActionRepositoryFake $repository, array $data = []): DocumentAction
    {
        $action = new class($this->createMock(LoggerInterface::class), $repository) extends DocumentAction {
            public function __construct(LoggerInterface $logger, private DocumentActionRepositoryFake $repositoryStub)
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

final class DocumentActionRepositoryFake
{
    public array $ownerMappingsCreated = [];
    public array $requestMappingsCreated = [];
    public array $requestsStored = [];
    public array $categoriesAdded = [];

    public function __construct(
        private array $ownerMappingRows = [],
        private array $types = [],
        private array $subTypes = [],
        private array $statuses = [],
        private array $requests = [],
        private ?\Throwable $requestStoreException = null,
        private ?\Throwable $requestMappingException = null,
        private array $ownerCheck = []
    ) {
    }

    public function getModel(string $name = 'document'): DocumentActionModelStub
    {
        return match ($name) {
            'documentOwnerMapping' => new DocumentActionModelStub($this->ownerMappingRows),
            'documentType' => new DocumentActionModelStub($this->types),
            'documentSubType' => new DocumentActionModelStub($this->subTypes),
            'documentSignatoryStatus' => new DocumentActionModelStub($this->statuses),
            'documentRequest' => new DocumentActionModelStub(
                $this->requests,
                function (array $data) {
                    if ($this->requestStoreException) {
                        throw $this->requestStoreException;
                    }
                    $this->requestsStored[] = $data;
                    $id = $data['id'] ?? count($this->requestsStored);
                    return new class($id) {
                        public function __construct(private int $id)
                        {
                        }

                        public function getId(): int
                        {
                            return $this->id;
                        }
                    };
                }
            ),
            'documentRequestMapping' => new DocumentActionModelStub(
                [],
                function (array $data) {
                    if ($this->requestMappingException) {
                        throw $this->requestMappingException;
                    }
                    $this->requestMappingsCreated[] = $data;
                    return new class {
                        public function getId(): int
                        {
                            return 1;
                        }
                    };
                }
            ),
            default => new DocumentActionModelStub([]),
        };
    }

    public function createDocumentOwnerMapping(array $data): void
    {
        $this->ownerMappingsCreated[] = $data;
    }

    public function addDocumentCategory(array $data): void
    {
        $this->categoriesAdded[] = $data;
    }

    public function documentHasOwner(int $id, int $owner_id): bool
    {
        return $this->ownerCheck[$id] ?? true;
    }
}

final class DocumentActionModelStub
{
    public function __construct(private array $rows = [], private $onStore = null)
    {
    }

    public function where(array $params): self
    {
        $filtered = array_values(array_filter($this->rows, static function (array $row) use ($params) {
            foreach ($params as $key => $value) {
                if (!array_key_exists($key, $row) || $row[$key] !== $value) {
                    return false;
                }
            }
            return true;
        }));

        return new self($filtered, $this->onStore);
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

    public function delete(): void
    {
        $this->rows = [];
    }

    public function store(array $data)
    {
        if ($this->onStore) {
            return ($this->onStore)($data);
        }

        $id = $data['id'] ?? 1;
        return new class($id) {
            public function __construct(private int $id)
            {
            }

            public function getId(): int
            {
                return $this->id;
            }
        };
    }
}
