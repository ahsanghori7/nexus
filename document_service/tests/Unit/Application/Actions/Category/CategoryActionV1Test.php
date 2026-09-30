<?php
declare(strict_types=1);

namespace Tests\Unit\Application\Actions\Category;

use App\Application\Actions\ActionError;
use App\Application\Actions\Category\v1\CategoryAction;
use App\Application\Handlers\HttpErrorHandler;
use App\Domain\DomainException;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use Slim\CallableResolver;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

final class CategoryActionV1Test extends TestCase
{
    public function testCreateReturnsIdWhenPayloadValid(): void
    {
        $repository = new CategoryActionRepositoryFake();
        $action = $this->createAction($repository, [
            'entity_id' => 9,
            'label' => 'Specs',
            'parent_id' => 3,
        ]);

        $response = $action->create($this->createMock(Request::class), new Response());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['id' => 101], $payload['data']);
        self::assertSame(
            [
                'entity_id' => 9,
                'label' => 'Specs',
                'entity_type' => CategoryAction::DEFAULT_ENTITY_TYPE,
                'parent_id' => 3,
            ],
            $repository->lastPayload
        );
    }

    public function testCreateReturnsBadRequestWhenFieldsMissing(): void
    {
        $repository = new CategoryActionRepositoryFake();
        $action = $this->createAction($repository, ['entity_id' => 5]);

        $response = $action->create($this->createMock(Request::class), new Response());

        self::assertSame(400, $response->getStatusCode());
        self::assertNull($repository->lastPayload);
    }

    public function testCreateDomainExceptionReturnsErrorPayload(): void
    {
        $repository = new CategoryActionRepositoryFake(new DomainException('duplicate category'));
        $action = $this->createAction($repository, ['entity_id' => 1, 'label' => 'Drawings']);
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/categories');
        $response = null;

        try {
            $action->create($request, new Response());
            self::fail('Expected DomainException to be thrown');
        } catch (DomainException $exception) {
            $handler = new HttpErrorHandler(new CallableResolver(null), new ResponseFactory());
            $response = $handler($request, $exception, true, false, false);
        }

        self::assertNotNull($response);
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(500, $response->getStatusCode());
        self::assertSame(ActionError::DOMAIN_ERROR, $payload['error']['type']);
        self::assertSame('duplicate category', $payload['error']['friendly']);
        self::assertSame('duplicate category', $payload['error']['description']);
    }

    private function createAction(CategoryActionRepositoryFake $repository, array $data): CategoryAction
    {
        $action = new class($this->createMock(LoggerInterface::class), $repository) extends CategoryAction {
            public function __construct(LoggerInterface $logger, private CategoryActionRepositoryFake $repositoryStub)
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

final class CategoryActionRepositoryFake
{
    public ?array $lastPayload = null;

    public function __construct(private ?\Throwable $exception = null, private int $id = 101)
    {
    }

    public function addCategory(array $data)
    {
        $this->lastPayload = $data;

        if ($this->exception) {
            throw $this->exception;
        }

        return new class($this->id) {
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
