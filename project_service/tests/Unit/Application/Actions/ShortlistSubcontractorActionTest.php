<?php
declare(strict_types=1);

namespace Tests\Application\Actions;

use App\Application\Actions\ShortlistSubcontractor\ShortlistSubcontractorAction;
use App\Domain\ShortlistSubcontractor\ShortlistSubcontractorRepository;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Psr\Log\LoggerInterface;

class ShortlistSubcontractorActionTest extends TestCase
{
    private ShortlistSubcontractorAction $action;
    private ShortlistSubcontractorRepository $repository;
    protected LoggerInterface $logger;

    protected function setUp(): void
    {
        $this->logger = $this->createMock(LoggerInterface::class);
        $this->repository = $this->createMock(ShortlistSubcontractorRepository::class);

        $this->action = new ShortlistSubcontractorAction(
            $this->logger,
            $this->repository
        );
    }

    /**
     * ✅ GET shortlisted subcontractors – success
     */
    public function testGetShortlistSubcontractorSuccess(): void
    {
        $request  = $this->createMock(ServerRequestInterface::class);
        $response = (new ResponseFactory())->createResponse();

        $args = [
            'project_id' => 1,
            'tender_id'  => 10,
        ];

        $expectedData = [
            [
                'tender_id'  => 10,
                'account_id' => 5,
                'status'     => 'approved',
            ]
        ];

        $this->repository
            ->expects($this->once())
            ->method('getByTenderId')
            ->with(1, 10)
            ->willReturn($expectedData);

        $result = $this->action->getShortlistSubcontractor(
            $request,
            $response,
            $args
        );

        // HTTP status code
        $this->assertSame(200, $result->getStatusCode());

        // Response body
        $body = json_decode((string) $result->getBody(), true);
        $this->assertArrayHasKey('data', $body);
        $this->assertSame($expectedData, $body['data']);
    }

    /**
     * ❌ GET shortlisted subcontractors – bad request
     */
    public function testGetShortlistSubcontractorBadRequest(): void
    {
        $request  = $this->createMock(ServerRequestInterface::class);
        $response = (new ResponseFactory())->createResponse();

        $args = [
            'project_id' => 0,
            'tender_id'  => 0,
        ];

        $result = $this->action->getShortlistSubcontractor(
            $request,
            $response,
            $args
        );

        $this->assertSame(400, $result->getStatusCode());
    }

  /**
     * ✅ POST create shortlisted subcontractors – success
     */
    public function testCreateShortlistSubcontractorsSuccess(): void
    {
        $request  = $this->createMock(ServerRequestInterface::class);
        $response = (new ResponseFactory())->createResponse();

        $payload = [
            'data' => [
                [
                    'tender_id'  => 10,
                    'account_id' => 20,
                    'author_id'  => 1,
                    'status'     => 'approved',
                ],
                [
                    'tender_id'  => 10,
                    'account_id' => 21,
                    'status'     => 'pending',
                ],
            ],
        ];

        // 🔑 MOCK getData()
        $this->action = $this->getMockBuilder(ShortlistSubcontractorAction::class)
            ->setConstructorArgs([$this->logger, $this->repository])
            ->onlyMethods(['getData'])
            ->getMock();

        $this->action
            ->expects($this->once())
            ->method('getData')
            ->willReturn($payload);

        // Mock the model and its create() method
        $model = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['create'])
            ->getMock();

        $model
            ->expects($this->exactly(2))
            ->method('create')
            ->with($this->callback(function ($data) {
                return isset(
                    $data['tender_id'],
                    $data['account_id'],
                    $data['status'],
                    $data['created_at'],
                    $data['updated_at']
                );
            }))
            ->willReturnOnConsecutiveCalls(
                (object) ['id' => 1001],
                (object) ['id' => 1002]
            );

        $this->repository
            ->expects($this->once())
            ->method('getModel')
            ->willReturn($model);

        // Execute
        $result = $this->action->createShortlistuSbcontractors(
            $request,
            $response,
            []
        );

        $this->assertSame(201, $result->getStatusCode());

        $body = json_decode((string) $result->getBody(), true);
        $this->assertTrue($body['data']['success']);
    }

    public function testGetShortlistSubcontractorsByTenderIdsSuccess(): void
    {
        $request  = $this->createMock(ServerRequestInterface::class);
        $response = (new ResponseFactory())->createResponse();

        $request
            ->method('getQueryParams')
            ->willReturn(['is_approved' => 'true']);

        $args = [
            'project_id' => 1,
            'ids'        => '[10,20,0]'
        ];

        $expectedData = [
            ['tender_id' => 10, 'account_id' => 5, 'status' => 'approved'],
        ];

        $this->repository
            ->expects($this->once())
            ->method('getByTenderIds')
            ->with(1, [10, 20], true)
            ->willReturn($expectedData);

        $result = $this->action->getShortlistSubcontractorsByTenderIds(
            $request,
            $response,
            $args
        );

        $this->assertSame(200, $result->getStatusCode());
        $this->assertSame($expectedData, json_decode((string) $result->getBody(), true)['data']);
    }

    public function testGetShortlistSubcontractorsByTenderIdsBadRequest(): void
    {
        $request  = $this->createMock(ServerRequestInterface::class);
        $response = (new ResponseFactory())->createResponse();

        $args = [
            'project_id' => 1,
            'ids'        => '',
        ];

        $result = $this->action->getShortlistSubcontractorsByTenderIds(
            $request,
            $response,
            $args
        );

        $this->assertSame(400, $result->getStatusCode());
    }

    public function testUpdateByIdReturnsSuccess(): void
    {
        $request  = $this->createMock(ServerRequestInterface::class);
        $response = (new ResponseFactory())->createResponse();
        $args = ['id' => 123];

        $model = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['load', 'isLoaded', 'store'])
            ->getMock();

        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(true);
        $model->expects($this->once())->method('store')->willReturn(new class {
            public function getId(): int
            {
                return 123;
            }

            public function getData(string $key)
            {
                return $key === 'account_id' ? 987 : null;
            }
        });

        $this->repository
            ->expects($this->once())
            ->method('getModel')
            ->willReturn($model);

        $this->action = $this->getMockBuilder(ShortlistSubcontractorAction::class)
            ->setConstructorArgs([$this->logger, $this->repository])
            ->onlyMethods(['getData'])
            ->getMock();

        $this->action
            ->method('getData')
            ->willReturn(['status' => 'approved']);

        $result = $this->action->updateById(
            $request,
            $response,
            $args
        );

        $this->assertSame(200, $result->getStatusCode());
        $body = json_decode((string) $result->getBody(), true);
        $this->assertSame(['id' => 123, 'sid' => 987], $body['data']['result']);
    }

    public function testUpdateByIdReturnsNotFound(): void
    {
        $request  = $this->createMock(ServerRequestInterface::class);
        $response = (new ResponseFactory())->createResponse();
        $args = ['id' => 123];

        $model = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['load', 'isLoaded', 'store'])
            ->getMock();

        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(false);

        $this->repository
            ->expects($this->once())
            ->method('getModel')
            ->willReturn($model);

        $result = $this->action->updateById(
            $request,
            $response,
            $args
        );

        $this->assertSame(404, $result->getStatusCode());
    }
}
