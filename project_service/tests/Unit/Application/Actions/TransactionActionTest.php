<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\Transaction\TransactionAction;
use App\Domain\Project\ProjectRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Tests\TestDoubles\FakeCollection;

class TransactionActionTest extends TestCase
{
    private ResponseFactory $responses;

    protected function setUp(): void
    {
        $this->responses = new ResponseFactory();
    }

    protected function tearDown(): void
    {
        $_FILES = [];
    }

    public function testListTransactionReturnsData(): void
    {
        $builder = $this->createBuilder(['with', 'where', 'exists', 'get']);
        $builder->method('with')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 10],
        ]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('transaction')->willReturn($builder);

        $action = $this->createAction($repository);
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/transaction');
        $response = $action->listTransaction($request, $this->responses->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());
    }

    public function testListTransactionReturnsNotFound(): void
    {
        $builder = $this->createBuilder(['with', 'where', 'exists']);
        $builder->method('with')->willReturnSelf();
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('transaction')->willReturn($builder);

        $action = $this->createAction($repository);
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/transaction');
        $response = $action->listTransaction($request, $this->responses->createResponse(), []);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testCreateTransactionReturnsNewId(): void
    {
        $model = $this->createBuilder(['store']);
        $model->expects(self::once())->method('store')->with([
            'amount' => 10,
            'tender_id' => 5,
        ])->willReturn(new class {
            public function getId(): int { return 99; }
        });

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('transaction')->willReturn($model);

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends TransactionAction {
            protected $data = ['amount' => 10];
            public function getData($k = null, $default = null)
            {
                return $this->data;
            }
        };

        $response = $action->create((new ServerRequestFactory())->createServerRequest('POST', '/transaction'), $this->responses->createResponse(), ['tid' => 5]);
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('99', (string) $response->getBody());
    }

    public function testAddFileReturnsBadRequestWhenFileMissing(): void
    {
        $repository = $this->createMock(ProjectRepository::class);
        $action = $this->createAction($repository);
        $_FILES = [];
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/transaction');
        $response = $action->addFile($request, $this->responses->createResponse(), []);
        self::assertSame(400, $response->getStatusCode());
    }

    private function createAction(ProjectRepository $repository): TransactionAction
    {
        return new TransactionAction($this->createMock(LoggerInterface::class), $repository);
    }

    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)->addMethods($methods)->getMock();
    }
}
