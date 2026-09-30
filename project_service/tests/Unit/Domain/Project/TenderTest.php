<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\Project\BoQ\QuoteItem;
use App\Domain\Project\Package as PackageMapping;
use App\Domain\Project\Project;
use App\Domain\Project\Tender;
use App\Domain\Project\TenderHistory;
use App\Domain\Transaction\Transaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use PHPUnit\Framework\TestCase;

class TenderTest extends TestCase
{
    public function testCleanKeepsOnlyWhitelistedFields(): void
    {
        $tender = new Tender();
        $input = [
            'project_id' => 10,
            'label' => 'Envelope',
            'size' => 5000,
            'unknown' => 'x',
        ];

        self::assertSame([
            'project_id' => 10,
            'label' => 'Envelope',
            'size' => 5000,
        ], $tender->clean($input));
    }

    public function testGetColumnNamesSupportsAlias(): void
    {
        $tender = new Tender();
        $columns = $tender->getColumnNames('t');

        self::assertContains('t.id', $columns);
        self::assertContains('t.project_id', $columns);
    }

    public function testPackagesRelationUsesHasMany(): void
    {
        $relation = $this->createMock(HasMany::class);
        $tender = $this->getMockBuilder(Tender::class)->onlyMethods(['hasMany'])->getMock();
        $tender->expects(self::once())
            ->method('hasMany')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame(PackageMapping::class, $related);
                self::assertSame('tender_id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $tender->packages());
    }

    public function testHistoryRelationUsesHasMany(): void
    {
        $relation = $this->createMock(HasMany::class);
        $tender = $this->getMockBuilder(Tender::class)->onlyMethods(['hasMany'])->getMock();
        $tender->expects(self::once())
            ->method('hasMany')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame(TenderHistory::class, $related);
                self::assertSame('tender_id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $tender->history());
    }

    public function testTransactionRelationUsesHasMany(): void
    {
        $relation = $this->createMock(HasMany::class);
        $tender = $this->getMockBuilder(Tender::class)->onlyMethods(['hasMany'])->getMock();
        $tender->expects(self::once())
            ->method('hasMany')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame(Transaction::class, $related);
                self::assertSame('tender_id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $tender->transaction());
    }

    public function testProjectRelationUsesBelongsTo(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $tender = $this->getMockBuilder(Tender::class)->onlyMethods(['belongsTo'])->getMock();
        $tender->expects(self::once())
            ->method('belongsTo')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame(Project::class, $related);
                self::assertSame('project_id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $tender->project());
    }

    public function testLastQuoteRelationUsesHasMany(): void
    {
        $relation = $this->createMock(HasMany::class);
        $tender = $this->getMockBuilder(Tender::class)->onlyMethods(['hasMany'])->getMock();
        $tender->expects(self::once())
            ->method('hasMany')
            ->willReturnCallback(static function ($related, $foreignKey, $localKey) use ($relation) {
                self::assertSame(QuoteItem::class, $related);
                self::assertSame('transaction_id', $foreignKey);
                self::assertSame('id', $localKey);
                return $relation;
            });

        self::assertSame($relation, $tender->lastQuote());
    }

    public function testGetTenderQuotesBuildsExpectedJoins(): void
    {
        $spy = new TenderQueryBuilderSpy();
        $latestQuotes = $this->getMockBuilder(Builder::class)->disableOriginalConstructor()->getMock();

        $result = $spy->getTenderQuotes(55, $latestQuotes);

        self::assertSame($spy->builder, $result);
        self::assertSame(['select', [
            'tender.*',
            'transaction_history.*',
            'transaction_history.quote_created as qca',
            'transaction_history.order_created as oca',
            'tender.id as tid',
        ]], $spy->builder->calls[0]);
        self::assertSame(['leftJoin', 'transaction as transaction_history', 'tender.id', '=', 'tender_id'], $spy->builder->calls[1]);
        self::assertSame(['leftJoinSub', $latestQuotes, 'transaction'], $spy->builder->calls[2]);
        self::assertSame(['joinClause', [['on', 'transaction_history.id', 'transaction.last_id', null, 'and']]], $spy->builder->calls[3]);
        self::assertSame(['with', 'lastQuote'], $spy->builder->calls[4]);
        self::assertSame(['where', 'tender.project_id', 55, null, 'and'], $spy->builder->calls[5]);
    }
}

class TenderQueryBuilderSpy extends Tender
{
    public FakeTenderBuilder $builder;

    public function __construct()
    {
        parent::__construct();
        $this->builder = new FakeTenderBuilder();
    }

    public function select($columns = ['*'])
    {
        $this->builder->calls[] = ['select', $columns];
        return $this->builder;
    }
}

class FakeTenderBuilder
{
    /** @var array<int, array<int|string, mixed>> */
    public array $calls = [];

    public function leftJoin($table, $first, $operator = null, $second = null)
    {
        $this->calls[] = ['leftJoin', $table, $first, $operator, $second];
        return $this;
    }

    public function leftJoinSub($query, $as, $callback)
    {
        $this->calls[] = ['leftJoinSub', $query, $as];
        $clause = new FakeJoinClause();
        $callback($clause);
        $this->calls[] = ['joinClause', $clause->calls];
        return $this;
    }

    public function with($relation)
    {
        $this->calls[] = ['with', $relation];
        return $this;
    }

    public function where($column, $operator = null, $value = null, $boolean = 'and')
    {
        $this->calls[] = ['where', $column, $operator, $value, $boolean];
        return $this;
    }
}

class FakeJoinClause
{
    /** @var array<int, array<int|string, mixed>> */
    public array $calls = [];

    public function on($first, $operator = null, $second = null, $boolean = 'and')
    {
        $this->calls[] = ['on', $first, $operator, $second, $boolean];
        return $this;
    }
}
