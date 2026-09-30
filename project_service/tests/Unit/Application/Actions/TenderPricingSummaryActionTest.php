<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Actions;

use App\Application\Actions\TenderRecommendation\TenderPricingSummaryAction;
use App\Domain\TenderRecommendation\TenderPricingSummaryRepository;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;

class TenderPricingSummaryActionTest extends TestCase
{
    private ResponseFactory $responses;

    protected function setUp(): void
    {
        $this->responses = new ResponseFactory();
    }

    public function testGetQuotesReturnsResults(): void
    {
        $repository = $this->createMock(TenderPricingSummaryRepository::class);
        $repository->expects(self::once())
            ->method('getQuotesByPackage')
            ->with(5, 9)
            ->willReturn([['id' => 1]]);

        $action = new TenderPricingSummaryAction($this->createMock(LoggerInterface::class), $repository);
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/quotes');

        $response = $action->getQuotes($request, $this->responses->createResponse(), ['project_id' => 5, 'package_id' => 9]);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('"id": 1', (string) $response->getBody());
    }

    public function testGetQuotesRequiresIdentifiers(): void
    {
        $action = new TenderPricingSummaryAction(
            $this->createMock(LoggerInterface::class),
            $this->createMock(TenderPricingSummaryRepository::class)
        );

        $response = $action->getQuotes(
            (new ServerRequestFactory())->createServerRequest('GET', '/quotes'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUpdateQuoteRequiresTransactionId(): void
    {
        $action = new class($this->createMock(LoggerInterface::class), $this->createMock(TenderPricingSummaryRepository::class)) extends TenderPricingSummaryAction {
            public function getData($k = null, $default = null)
            {
                return ['forecast' => 99];
            }
        };

        $response = $action->updateQuote(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/quotes'),
            $this->responses->createResponse(),
            []
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUpdateQuoteRejectsUnknownFields(): void
    {
        $repository = $this->createMock(TenderPricingSummaryRepository::class);
        $repository->expects(self::never())->method('updateForecastAndNote');

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends TenderPricingSummaryAction {
            public function getData($k = null, $default = null)
            {
                return ['other' => 'value'];
            }
        };

        $response = $action->updateQuote(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/quotes/5'),
            $this->responses->createResponse(),
            ['transaction_id' => 5]
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUpdateQuoteReturnsBadRequestWhenUpdateFails(): void
    {
        $repository = $this->createMock(TenderPricingSummaryRepository::class);
        $repository->expects(self::once())
            ->method('updateForecastAndNote')
            ->with(5, ['forecast' => 123])
            ->willReturn(false);

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends TenderPricingSummaryAction {
            public function getData($k = null, $default = null)
            {
                return ['forecast' => 123];
            }
        };

        $response = $action->updateQuote(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/quotes/5'),
            $this->responses->createResponse(),
            ['transaction_id' => 5]
        );

        self::assertSame(400, $response->getStatusCode());
    }

    public function testUpdateQuoteUpdatesAllowedFields(): void
    {
        $repository = $this->createMock(TenderPricingSummaryRepository::class);
        $repository->expects(self::once())
            ->method('updateForecastAndNote')
            ->with(55, ['forecast' => 500, 'note' => 'review'])
            ->willReturn(true);

        $action = new class($this->createMock(LoggerInterface::class), $repository) extends TenderPricingSummaryAction {
            public function getData($k = null, $default = null)
            {
                return ['forecast' => 500, 'note' => 'review', 'other' => 'ignore'];
            }
        };

        $response = $action->updateQuote(
            (new ServerRequestFactory())->createServerRequest('PATCH', '/quotes/55'),
            $this->responses->createResponse(),
            ['transaction_id' => 55]
        );

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('Quote updated successfully', (string) $response->getBody());
    }
}
