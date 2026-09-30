<?php

declare(strict_types=1);

namespace Tests\Unit\Action;

use App\Application\Actions\Transaction\TransactionActionV2;
use App\Domain\Project\ProjectRepository;
use App\Domain\Transaction\TransactionRepository;
use PHPUnit\Framework\TestCase;
use Tests\Helpers\Http;
use Tests\Helpers\Mocks;
use Tests\TestDoubles\FakeCollection;

class TransactionActionV2Test extends TestCase
{
    private TransactionRepository $transactions;
    private ProjectRepository $projects;
    private TransactionActionV2 $action;

    protected function setUp(): void
    {
        $this->transactions = $this->createMock(TransactionRepository::class);
        $this->projects = $this->createMock(ProjectRepository::class);
        $this->action = new TransactionActionV2(Mocks::logger());
        Mocks::setProperty($this->action, 'repository', $this->transactions);
        Mocks::setProperty($this->action, 'projectRepository', $this->projects);
    }

    public function testListTransactionAppliesFilters(): void
    {
        $builder = Mocks::builder($this, ['with', 'where', 'get']);
        $builder->method('with')->willReturnSelf();
        $builder->expects(self::once())->method('where')->with([
            'transaction.id' => 5,
            'transaction.subcontractor_id' => 6,
            'transaction.tender_id' => 7,
        ])->willReturnSelf();
        $builder->method('get')->willReturn(new FakeCollection([['id' => 1]]));
        $this->transactions->method('getModel')->with('transaction')->willReturn($builder);

        $request = Http::jsonRequest('GET', '/transactions', null, ['id' => 5, 'sid' => 6, 'tid' => 7]);
        $response = $this->action->listTransaction($request, Http::response(), []);
        $decoded = Http::decode($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([['id' => 1]], $decoded['data'] ?? null);
    }

    public function testCreateReturnsIdentifier(): void
    {
        $transactionModel = Mocks::builder($this, ['store']);
        $transactionModel->expects(self::once())->method('store')->with(['field' => 'value'])->willReturn(
            new class {
                public function getId(): int
                {
                    return 44;
                }
            }
        );
        $this->transactions->method('getModel')->with('transaction')->willReturn($transactionModel);
        Mocks::seedActionData($this->action, ['field' => 'value']);

        $response = $this->action->create(Http::jsonRequest('POST', '/transactions'), Http::response(), []);
        $decoded = Http::decode($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['id' => 44], $decoded['data'] ?? null);
    }

    public function testHandleTransactionItemsTracksIdsAndFailures(): void
    {
        $quoteItemModel = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['clean', 'store', 'where'])
            ->getMock();
        $quoteItemModel->method('clean')->willReturnCallback(static fn ($payload) => $payload);
        $quoteItemModel->method('store')->willReturn(
            new class {
                public function getId(): int
                {
                    return 91;
                }
            }
        );
        $updateBuilder = $this->getMockBuilder(\stdClass::class)->addMethods(['update'])->getMock();
        $updateBuilder->method('update')->willReturn(false);
        $quoteItemModel->method('where')->willReturn($updateBuilder);

        $this->projects->method('getModel')->with('boqQuoteItem')->willReturn($quoteItemModel);
        Mocks::seedActionData($this->action, [
            ['boq_item_id' => 10, 'value' => 'new item'],
            ['id' => 5, 'boq_item_id' => 11, 'value' => 'update'],
            ['value' => 'missing id'],
        ]);

        $response = $this->action->handleTransactionItems(Http::jsonRequest('POST', '/transactions/9/items'), Http::response(), ['tid' => 9]);
        $decoded = Http::decode($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(91, $decoded['data']['ids']['10'] ?? null);
        self::assertArrayHasKey('Failed_to_update_item', $decoded['data']['failed'] ?? []);
        self::assertArrayHasKey('Item_Missing_boq_item_id', $decoded['data']['failed'] ?? []);
    }

    public function testAddDocumentPersistsPayload(): void
    {
        $document = Mocks::builder($this, ['store']);
        $document->expects(self::once())->method('store')->with([
            'name' => 'quote.pdf',
            's3_key' => 'development/documents/quote-documents/3/quote.pdf',
            'transaction_id' => 3,
            'quote_version' => 1,
        ])->willReturn(
            new class {
                public function getId(): int
                {
                    return 12;
                }
            }
        );
        $this->transactions->method('getModel')->with('transactionDocument')->willReturn($document);
        Mocks::seedActionData($this->action, [
            'name' => 'quote.pdf',
            's3_key' => 'development/documents/quote-documents/3/quote.pdf',
        ]);

        $response = $this->action->addDocument(Http::jsonRequest('POST', '/transactions/3/document'), Http::response(), ['tid' => 3]);
        $decoded = Http::decode($response);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['id' => 12], $decoded['data'] ?? null);
    }

    public function testAddDocumentKeepsExplicitQuoteVersion(): void
    {
        $document = Mocks::builder($this, ['store']);
        $document->expects(self::once())
            ->method('store')
            ->with(self::callback(static fn (array $data): bool => $data['quote_version'] === 2))
            ->willReturn(
                new class {
                    public function getId(): int
                    {
                        return 13;
                    }
                }
            );
        $this->transactions->method('getModel')->with('transactionDocument')->willReturn($document);
        Mocks::seedActionData($this->action, ['name' => 'quote.pdf', 's3_key' => 'key', 'quote_version' => '2']);

        $response = $this->action->addDocument(Http::jsonRequest('POST', '/transactions/3/document'), Http::response(), ['tid' => 3]);

        self::assertSame(200, $response->getStatusCode());
    }

    public function testAddDocumentRejectsMissingName(): void
    {
        $this->transactions->expects(self::never())->method('getModel');
        Mocks::seedActionData($this->action, ['s3_key' => 'key']);

        $response = $this->action->addDocument(Http::jsonRequest('POST', '/transactions/3/document'), Http::response(), ['tid' => 3]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testAddDocumentRejectsMissingS3Key(): void
    {
        $this->transactions->expects(self::never())->method('getModel');
        Mocks::seedActionData($this->action, ['name' => 'quote.pdf']);

        $response = $this->action->addDocument(Http::jsonRequest('POST', '/transactions/3/document'), Http::response(), ['tid' => 3]);

        self::assertSame(400, $response->getStatusCode());
    }

    public function testDeleteDocumentDelegatesToRepository(): void
    {
        $document = Mocks::builder($this, ['deleteById']);
        $document->expects(self::once())->method('deleteById')->with(5);
        $this->transactions->method('getModel')->with('transactionDocument')->willReturn($document);

        $response = $this->action->deleteDocument(Http::jsonRequest('DELETE', '/transactions/doc/5'), Http::response(), ['tid' => 5]);

        self::assertSame(200, $response->getStatusCode());
    }
}
