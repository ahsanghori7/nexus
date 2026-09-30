<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\TenderRecommendation\TenderRecommendationAction;
use App\Domain\TenderRecommendation\TenderRecommendationRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class TenderRecommendationActionTest extends TestCase
{
    private ResponseFactory $responses;

    protected function setUp(): void
    {
        $this->responses = new ResponseFactory();
    }

    public function testGetAllRequiresProjectId(): void
    {
        $action = new TenderRecommendationAction(
            $this->createMock(LoggerInterface::class),
            $this->createMock(TenderRecommendationRepository::class)
        );

        $response = $action->getAll(
            (new ServerRequestFactory())->createServerRequest('GET', '/tender-recommendation'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testGetAllReturnsRecommendations(): void
    {
        $repository = $this->createMock(TenderRecommendationRepository::class);
        $repository->expects(self::once())->method('getByProjectId')->with(5)->willReturn([['id' => 1]]);

        $action = new TenderRecommendationAction($this->createMock(LoggerInterface::class), $repository);
        $response = $action->getAll(
            (new ServerRequestFactory())->createServerRequest('GET', '/tender-recommendation'),
            $this->responses->createResponse(),
            ['project_id' => 5]
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 1', (string) $response->getBody());
    }

    public function testGetByIdReturnsNotFoundWhenMissing(): void
    {
        $repository = $this->createMock(TenderRecommendationRepository::class);
        $repository->expects(self::once())->method('getByProjectAndId')->with(3, 9)->willReturn([]);

        $action = new TenderRecommendationAction($this->createMock(LoggerInterface::class), $repository);
        $response = $action->getById(
            (new ServerRequestFactory())->createServerRequest('GET', '/tender-recommendation/9'),
            $this->responses->createResponse(),
            ['project_id' => 3, 'id' => 9]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testGetRecommendationStatusByProjectReturnsData(): void
    {
        $repository = $this->createMock(TenderRecommendationRepository::class);
        $repository->expects(self::once())
            ->method('getRecommendationStatusByProject')
            ->with(4)
            ->willReturn([['id' => 5]]);

        $action = new TenderRecommendationAction($this->createMock(LoggerInterface::class), $repository);

        $response = $action->getRecommendationStatusByProject(
            (new ServerRequestFactory())->createServerRequest('GET', '/tender-recommendation/status'),
            $this->responses->createResponse(),
            ['project_id' => 4]
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 5', (string) $response->getBody());
    }

    public function testGetActiveRecommendationsReadsQueryParams(): void
    {
        $repository = $this->createMock(TenderRecommendationRepository::class);
        $repository->expects(self::once())
            ->method('getActiveRecommendationsByProject')
            ->with(10)
            ->willReturn([['id' => 1]]);

        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/tender-recommendation/active')
            ->withQueryParams(['tender_id' => 10]);

        $action = new TenderRecommendationAction($this->createMock(LoggerInterface::class), $repository);
        $response = $action->getActiveRecommendations($request, $this->responses->createResponse(), []);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 1', (string) $response->getBody());
    }

    public function testSaveAsDraftValidatesId(): void
    {
        $action = new class($this->createMock(LoggerInterface::class), $this->createMock(TenderRecommendationRepository::class)) extends TenderRecommendationAction {
            public function getData($k = null, $default = null)
            {
                return [];
            }
        };

        $response = $action->saveAsDraft(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/tender-recommendation/1'),
            $this->responses->createResponse(),
            ['id' => 0]
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testSaveAsDraftReturnsNotFoundWhenModelMissing(): void
    {
        $model = $this->createBuilder(['load', 'isLoaded', 'store']);
        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(false);

        $repository = $this->createMock(TenderRecommendationRepository::class);
        $repository->method('getModel')->willReturn($model);

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends TenderRecommendationAction {
            public function getData($k = null, $default = null)
            {
                return ['forecasts' => []];
            }
        };

        $response = $action->saveAsDraft(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/tender-recommendation/1'),
            $this->responses->createResponse(),
            ['id' => 1]
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testSaveAsDraftValidatesForecastShape(): void
    {
        $model = $this->createBuilder(['load', 'isLoaded', 'store']);
        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(true);
        $model->method('store')->willReturn(true);

        $repository = $this->createMock(TenderRecommendationRepository::class);
        $repository->method('getModel')->willReturn($model);
        $repository->expects(self::never())->method('updateTransactionForecast');

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends TenderRecommendationAction {
            public function getData($k = null, $default = null)
            {
                return ['forecasts' => [['transaction_id' => null]]];
            }
        };

        $response = $action->saveAsDraft(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/tender-recommendation/1'),
            $this->responses->createResponse(),
            ['id' => 1]
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testSaveAsDraftUpdatesForecasts(): void
    {
        $model = $this->createBuilder(['load', 'isLoaded', 'store']);
        $model->method('load')->willReturnSelf();
        $model->method('isLoaded')->willReturn(true);
        $model->expects(self::once())->method('store')->with([
            'status' => 'Draft',
            'forecasts' => [
                ['transaction_id' => 11, 'forecast' => 250.5],
                ['transaction_id' => 12, 'forecast' => 300.0],
            ],
        ])->willReturn(true);

        $repository = $this->createMock(TenderRecommendationRepository::class);
        $repository->method('getModel')->willReturn($model);
        $forecastCalls = [];
        $repository->expects(self::exactly(2))
            ->method('updateTransactionForecast')
            ->willReturnCallback(static function ($transactionId, $forecast) use (&$forecastCalls) {
                $forecastCalls[] = [$transactionId, $forecast];
                return true;
            });

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends TenderRecommendationAction {
            public function getData($k = null, $default = null)
            {
                return [
                    'status' => 'Draft',
                    'forecasts' => [
                        ['transaction_id' => 11, 'forecast' => 250.5],
                        ['transaction_id' => 12, 'forecast' => 300.0],
                    ],
                ];
            }
        };

        $response = $action->saveAsDraft(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/tender-recommendation/1'),
            $this->responses->createResponse(),
            ['id' => 1]
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('success', (string) $response->getBody());
        self::assertSame([
            [11, 25050.0],
            [12, 30000.0],
        ], $forecastCalls);
    }

    private function createBuilder(array $methods)
    {
        return $this->getMockBuilder(\stdClass::class)->addMethods($methods)->getMock();
    }
}
