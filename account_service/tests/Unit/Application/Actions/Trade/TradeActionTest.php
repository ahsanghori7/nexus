<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Trade;

use App\Application\Actions\Trade\TradeAction;
use App\Application\Actions\Action;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class TradeActionTest extends TestCase
{
    public function testDeleteByIdRemovesTrade(): void
    {
        $repository = new TradeRepositoryStub();

        $action = $this->createAction($repository);
        $response = $action->deleteById(
            $this->createRequest('DELETE', '/v1/trade/4'),
            new Response(),
            ['id' => '4']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([[ 'trade_id' => 4 ]], $repository->tradeCategoryDeleteCalls);
        self::assertSame([4], $repository->tradeDeleteCalls);
    }

    public function testUpdateTradesPersistsEachTradeId(): void
    {
        $repository = new TradeRepositoryStub();

        $action = $this->createAction($repository);
        $this->setActionData($action, [7, 9]);
        $response = $action->updateTrades(
            $this->createRequest('PATCH', '/v1/account/3/trades'),
            new Response(),
            ['id' => '3']
        );

        self::assertSame(203, $response->getStatusCode());
        self::assertSame([[ 'account_id' => 3 ]], $repository->tradeMappingDeleteCalls);
        self::assertSame(
            [
                ['account_id' => 3, 'trade_id' => 7],
                ['account_id' => 3, 'trade_id' => 9],
            ],
            $repository->tradeMappingSaveCalls
        );
    }

    public function testGetTradeGroupReturnsRepositoryData(): void
    {
        $repository = new TradeRepositoryStub();
        $repository->tradeGroupResults = [
            ['id' => 1, 'type_id' => 2, 'trade_id' => 10, 'trade' => ['id' => 10, 'label' => 'Tiling']],
        ];

        $action = $this->createAction($repository);
        $response = $action->getTradeGroup(
            $this->createRequest('GET', '/v1/trade/group/2'),
            new Response(),
            ['type' => '2']
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->tradeGroupResults, $payload['data']);
        self::assertSame([['type_id' => 2]], $repository->tradeGroupFilters);
    }

    public function testGetTradesReturnsMappingData(): void
    {
        $repository = new TradeRepositoryStub();
        $repository->tradeMappingResults = [
            ['account_id' => 3, 'trade_id' => 9],
        ];

        $action = $this->createAction($repository);
        $response = $action->getTrades(
            $this->createRequest('GET', '/v1/account/3/trades'),
            new Response(),
            ['id' => '3']
        );

        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(200, $response->getStatusCode());
        self::assertSame($repository->tradeMappingResults, $payload['data']);
    }

    private function createAction(TradeRepositoryStub $repository): TradeActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new TradeActionUnderTest($logger, $repository);
    }

    private function setActionData(Action $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class TradeActionUnderTest extends TradeAction
{
    public function __construct(LoggerInterface $logger, private TradeRepositoryStub $repositoryStub)
    {
        parent::__construct($logger);
        $this->repository = $repositoryStub;
    }
}

final class TradeRepositoryStub
{
    public array $tradeCategoryDeleteCalls = [];
    public array $tradeDeleteCalls = [];
    public array $tradeMappingDeleteCalls = [];
    public array $tradeMappingSaveCalls = [];
    public array $tradeGroupResults = [];
    public array $tradeGroupFilters = [];
    public array $tradeMappingResults = [];

    public function getModel(string $name = '')
    {
        return match ($name) {
            'tradeCategoryMapping' => new TradeCategoryMappingModelStub($this),
            'tradeMapping' => new TradeMappingModelStub($this),
            default => new TradeModelStub($this),
        };
    }

    public function getTradeGroup(array $filters): array
    {
        $this->tradeGroupFilters[] = $filters;
        return $this->tradeGroupResults;
    }
}

final class TradeCategoryMappingModelStub
{
    public function __construct(private TradeRepositoryStub $repository)
    {
    }

    public function deleteWhere(array $conditions): void
    {
        $this->repository->tradeCategoryDeleteCalls[] = $conditions;
    }
}

final class TradeMappingModelStub
{
    public function __construct(private TradeRepositoryStub $repository)
    {
    }

    public function deleteWhere(array $conditions): void
    {
        $this->repository->tradeMappingDeleteCalls[] = $conditions;
    }

    public function save(array $data): void
    {
        $this->repository->tradeMappingSaveCalls[] = $data;
    }

    public function all(array $filters = []): array
    {
        return $this->repository->tradeMappingResults;
    }
}

final class TradeModelStub
{
    public function __construct(private TradeRepositoryStub $repository)
    {
    }

    public function delete(int $id): void
    {
        $this->repository->tradeDeleteCalls[] = $id;
    }
}
