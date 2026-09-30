<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\Logs\LogsAction;
use App\Domain\Logs\LogsRepository;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

class LogsActionTest extends TestCase
{
    public function testConstructsWithRepository(): void
    {
        $repository = $this->createMock(LogsRepository::class);
        $action = new LogsAction($this->createMock(LoggerInterface::class), $repository);

        self::assertInstanceOf(LogsAction::class, $action);
    }

    public function testBulkCreateHandsEveryRecordToTheRepositoryAtOnce(): void
    {
        $records = [
            ['entity_type' => 'tender_document_download', 'entity_id' => 1, 'type' => 'Downloaded'],
            ['entity_type' => 'tender_document_download', 'entity_id' => 1, 'type' => 'Downloaded'],
        ];

        $repository = $this->createMock(LogsRepository::class);
        $repository->expects(self::once())
            ->method('bulkCreate')
            ->with($records)
            ->willReturn(['inserted' => 2, 'skipped' => 0]);

        $action = $this->action($repository, ['records' => $records]);
        $response = $action->bulkCreate($this->request(), new Response(), []);

        self::assertSame(200, $response->getStatusCode());

        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame(['inserted' => 2, 'skipped' => 0], $payload['data']);
    }

    /**
     * @dataProvider unusablePayloads
     */
    public function testBulkCreateRejectsAPayloadItCannotActOn(array $data): void
    {
        $repository = $this->createMock(LogsRepository::class);
        $repository->expects(self::never())->method('bulkCreate');

        $action = $this->action($repository, $data);
        $response = $action->bulkCreate($this->request(), new Response(), []);

        self::assertSame(400, $response->getStatusCode());
    }

    public static function unusablePayloads(): array
    {
        return [
            'no records key' => [[]],
            'empty list'     => [['records' => []]],
            'not a list'     => [['records' => 'nope']],
        ];
    }

    private function action(LogsRepository $repository, array $data): LogsAction
    {
        $action = new LogsAction($this->createMock(LoggerInterface::class), $repository);

        $property = (new \ReflectionClass($action))->getParentClass()->getProperty('data');
        $property->setAccessible(true);
        $property->setValue($action, $data);

        return $action;
    }

    private function request(): ServerRequestInterface
    {
        return (new ServerRequestFactory())->createServerRequest('POST', '/v1/logs/bulk');
    }
}
