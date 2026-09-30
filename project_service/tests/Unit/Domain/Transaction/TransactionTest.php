<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Transaction;

use App\Domain\Project\BoQ\QuoteItem;
use App\Domain\Project\Project;
use App\Domain\Project\Tender;
use App\Domain\Transaction\Transaction;
use App\Domain\Transaction\TransactionDocument;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use PHPUnit\Framework\TestCase;

class TransactionTest extends TestCase
{
    public function testRelationshipMethodsInvokeEloquentBuilders(): void
    {
        $belongsToCalls = [];
        $hasManyCalls = [];
        $belongsTo = $this->createMock(BelongsTo::class);
        $hasMany = $this->createMock(HasMany::class);
        $transaction = $this->getMockBuilder(Transaction::class)->onlyMethods(['belongsTo', 'hasMany'])->getMock();
        $transaction->expects(self::exactly(2))
            ->method('belongsTo')
            ->willReturnCallback(static function () use (&$belongsToCalls, $belongsTo) {
                $belongsToCalls[] = func_get_args();
                return $belongsTo;
            });
        $transaction->expects(self::exactly(2))
            ->method('hasMany')
            ->willReturnCallback(static function () use (&$hasManyCalls, $hasMany) {
                $hasManyCalls[] = func_get_args();
                return $hasMany;
            });

        self::assertSame($belongsTo, $transaction->tender());
        self::assertSame($hasMany, $transaction->quote());
        self::assertSame($hasMany, $transaction->document());
        self::assertSame($belongsTo, $transaction->project());

        self::assertSame([
            [Tender::class, 'tender_id', null, null],
            [Project::class, 'project_id', null, null],
        ], $belongsToCalls);
        self::assertSame([
            [QuoteItem::class, 'transaction_id', null],
            [TransactionDocument::class, 'transaction_id', null],
        ], $hasManyCalls);
    }

    public function testGetLatestQuotesBuildsExpectedQuery(): void
    {
        $transaction = new TransactionBuilderSpy();
        $result = $transaction->getLatestQuotes(25);

        self::assertSame($transaction, $result);
        self::assertSame(['selectRaw', 'subcontractor_id,tender_id, MAX(transaction.id) as last_id, t.*', []], $transaction->calls[0]);
        self::assertSame(['leftJoin', 'tender as t', 't.id', '=', 'transaction.tender_id'], $transaction->calls[1]);
        self::assertSame(['groupBy', ['subcontractor_id', 'tender_id']], $transaction->calls[2]);
        self::assertSame(['where', 't.project_id', 25, null, 'and'], $transaction->calls[3]);
    }

    public function testCleanRemovesUnknownFields(): void
    {
        $transaction = new Transaction();

        $data = $transaction->clean([
            'tender_id' => 9,
            'subcontractor_id' => 10,
            'price' => 5000,
            'unknown' => 'ignore',
        ]);

        self::assertSame([
            'tender_id' => 9,
            'subcontractor_id' => 10,
            'price' => 5000,
        ], $data);
    }
}

class TransactionBuilderSpy extends Transaction
{
    /** @var array<int, array<int, mixed>> */
    public array $calls = [];

    public function selectRaw($expression, $bindings = [])
    {
        $this->calls[] = ['selectRaw', $expression, $bindings];
        return $this;
    }

    public function leftJoin($table, $first, $operator = null, $second = null)
    {
        $this->calls[] = ['leftJoin', $table, $first, $operator, $second];
        return $this;
    }

    public function groupBy($columns)
    {
        $this->calls[] = ['groupBy', $columns];
        return $this;
    }

    public function where($column, $operator = null, $value = null, $boolean = 'and')
    {
        $this->calls[] = ['where', $column, $operator, $value, $boolean];
        return $this;
    }
}
