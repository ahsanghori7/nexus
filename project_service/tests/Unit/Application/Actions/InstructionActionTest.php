<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\Instruction\InstructionAction;
use App\Domain\Project\ProjectRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Tests\TestDoubles\FakeCollection;

class InstructionActionTest extends TestCase
{
    private ResponseFactory $responses;

    protected function setUp(): void
    {
        $this->responses = new ResponseFactory();
    }

    public function testListInstructionReturnsResults(): void
    {
        $builder = $this->createBuilder(['where', 'exists', 'get']);
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(true);
        $builder->method('get')->willReturn(new FakeCollection([
            ['id' => 1],
        ]));

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('instruction')->willReturn($builder);

        $action = $this->createAction($repository);
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/instruction');
        $response = $action->listInstruction($request, $this->responses->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());
    }

    public function testListInstructionReturnsNotFoundWhenMissing(): void
    {
        $builder = $this->createBuilder(['where', 'exists']);
        $builder->method('where')->willReturnSelf();
        $builder->method('exists')->willReturn(false);

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('instruction')->willReturn($builder);

        $action = $this->createAction($repository);
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/instruction');
        $response = $action->listInstruction($request, $this->responses->createResponse(), []);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testCreateInstructionReturnsNewId(): void
    {
        $model = $this->createBuilder(['store']);
        $model->expects(self::once())->method('store')->willReturn(new class {
            public function getId(): int
            {
                return 77;
            }
        });

        $repository = $this->createMock(ProjectRepository::class);
        $repository->method('getModel')->with('instruction')->willReturn($model);

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends InstructionAction {
            protected $data = ['foo' => 'bar'];
            public function getData($k = null, $default = null)
            {
                return $this->data;
            }
        };

        $response = $action->createInstruction((new ServerRequestFactory())->createServerRequest('POST', '/instruction'), $this->responses->createResponse());
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('77', (string) $response->getBody());
    }

    private function createAction(ProjectRepository $repository): InstructionAction
    {
        return new InstructionAction($this->createMock(LoggerInterface::class), $repository);
    }

    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)->addMethods($methods)->getMock();
    }
}
