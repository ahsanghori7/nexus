<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\Project\BoQ\Entity;
use App\Domain\Project\BoQ\Item;
use App\Domain\Project\BoQ\ItemMapping;
use App\Domain\Project\BoQ\ItemVersion;
use App\Domain\Project\BoQ\QuoteItem;
use App\Domain\Project\BoQ\Resource;
use App\Domain\Project\BoQ\ResourceMapping;
use App\Domain\Project\BoQ\ResourceType;
use App\Domain\Project\BoQ\ResourceVersion;
use App\Domain\Project\BoQ\Unit;
use App\Domain\Project\Tender;
use App\Domain\Transaction\Transaction;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use PHPUnit\Framework\TestCase;

class BoQModelsTest extends TestCase
{
    /**
     * @dataProvider cleanProvider
     *
     * @param class-string $class
     * @param array<string, mixed> $input
     * @param array<string, mixed> $expected
     */
    public function testCleanAndSerialize(string $class, array $input, array $expected): void
    {
        $model = new $class();

        self::assertSame($expected, $model->clean($input));

        $seed = ['id' => 1] + $expected;
        $model->setData($seed);
        self::assertSame($seed, $model->jsonSerialize());
    }

    /**
     * @return array<int, array{string, array<string, mixed>, array<string, mixed>}>
     */
    public static function cleanProvider(): array
    {
        return [
            [Entity::class, ['tender_id' => 5, 'junk' => true], ['tender_id' => 5]],
            [Item::class, ['boq_entity_id' => 9, 'unused' => 'x'], ['boq_entity_id' => 9]],
            [ItemMapping::class, ['description' => 'Demo', 'parent_id' => 2, 'extra' => 3], ['parent_id' => 2, 'description' => 'Demo']],
            [ItemVersion::class, ['version' => 1, 'status' => 2, 'ignored' => false], ['version' => 1, 'status' => 2]],
            [QuoteItem::class, ['boq_item_id' => 1, 'rate' => 12.5, 'transaction_id' => 44, 'foo' => 'bar'], ['boq_item_id' => 1, 'rate' => 12.5, 'transaction_id' => 44]],
            [Resource::class, ['text' => 'Note', 'id_account' => 'acct', 'skip' => 1], ['text' => 'Note', 'id_account' => 'acct']],
            [ResourceMapping::class, ['boq_resource_id' => 7, 'boq_id' => 8, 'unused' => null], ['boq_resource_id' => 7, 'boq_id' => 8]],
            [ResourceVersion::class, ['version' => 3, 'status' => 1, 'bogus' => 5], ['version' => 3, 'status' => 1]],
            [ResourceType::class, ['label' => 'Drawing', 'irrelevant' => 'x'], ['label' => 'Drawing']],
            [Unit::class, ['name' => 'Metre', 'symbol' => 'm', 'skip' => true], ['name' => 'Metre', 'symbol' => 'm']],
        ];
    }

    public function testEntityTenderRelationUsesBelongsTo(): void
    {
        $relation = $this->createMock(BelongsTo::class);
        $entity = $this->getMockBuilder(Entity::class)->onlyMethods(['belongsTo'])->getMock();
        $entity->expects(self::once())
            ->method('belongsTo')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame(Tender::class, $related);
                self::assertSame('tender_id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $entity->tender());
    }

    public function testEntityEntriesRelationUsesHasMany(): void
    {
        $relation = $this->createMock(HasMany::class);
        $entity = $this->getMockBuilder(Entity::class)->onlyMethods(['hasMany'])->getMock();
        $entity->expects(self::once())
            ->method('hasMany')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame(Item::class, $related);
                self::assertSame('boq_entity_id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $entity->entries());
    }

    public function testEntityNoteRelationFiltersResourceType(): void
    {
        $relation = $this->getMockBuilder(HasManyThrough::class)
            ->disableOriginalConstructor()
            ->addMethods(['where'])
            ->getMock();
        $relation->expects(self::once())
            ->method('where')
            ->with('boq_resource_type_id', 1)
            ->willReturnSelf();

        $entity = $this->getMockBuilder(Entity::class)->onlyMethods(['hasManyThrough'])->getMock();
        $entity->expects(self::once())
            ->method('hasManyThrough')
            ->willReturnCallback(static function (...$args) use ($relation) {
                self::assertSame(
                    [Resource::class, ResourceMapping::class, 'boq_id', 'id', 'id', 'boq_resource_id'],
                    $args
                );
                return $relation;
            });

        self::assertSame($relation, $entity->note());
    }

    public function testItemRelationshipsUseExpectedForeignKeys(): void
    {
        $belongsTo = $this->createMock(BelongsTo::class);
        $hasMany = $this->createMock(HasMany::class);
        $item = $this->getMockBuilder(Item::class)->onlyMethods(['belongsTo', 'hasMany'])->getMock();
        $item->expects(self::once())
            ->method('belongsTo')
            ->willReturnCallback(static function ($related, $foreignKey) use ($belongsTo) {
                self::assertSame(Entity::class, $related);
                self::assertSame('boq_entity_id', $foreignKey);
                return $belongsTo;
            });
        $item->expects(self::once())
            ->method('hasMany')
            ->willReturnCallback(static function ($related, $foreignKey) use ($hasMany) {
                self::assertSame(ItemMapping::class, $related);
                self::assertSame('boq_item_id', $foreignKey);
                return $hasMany;
            });

        self::assertSame($belongsTo, $item->entity());
        self::assertSame($hasMany, $item->itemMappings());
    }

    public function testItemMappingRelationshipsUseExpectedKeys(): void
    {
        $calls = [];
        $relation = $this->createMock(BelongsTo::class);
        $itemMapping = $this->getMockBuilder(ItemMapping::class)->onlyMethods(['belongsTo'])->getMock();
        $itemMapping->expects(self::exactly(2))
            ->method('belongsTo')
            ->willReturnCallback(static function () use (&$calls, $relation) {
                $calls[] = func_get_args();
                return $relation;
            });

        $itemMapping->item();
        $itemMapping->itemVersion();

        self::assertSame([
            [Item::class, null, null, null],
            [ItemVersion::class, 'id', 'boq_item_mapping_id', null],
        ], $calls);
    }

    public function testQuoteItemRelationshipsLinkToTransactionAndMapping(): void
    {
        $belongsTo = $this->createMock(BelongsTo::class);
        $hasOne = $this->createMock(HasOne::class);
        $quoteItem = $this->getMockBuilder(QuoteItem::class)->onlyMethods(['belongsTo', 'hasOne'])->getMock();
        $quoteItem->expects(self::once())
            ->method('belongsTo')
            ->willReturnCallback(static function ($related, $foreignKey) use ($belongsTo) {
                self::assertSame(Transaction::class, $related);
                self::assertSame('id', $foreignKey);
                return $belongsTo;
            });
        $quoteItem->expects(self::once())
            ->method('hasOne')
            ->willReturnCallback(static function ($related, $foreignKey, $localKey) use ($hasOne) {
                self::assertSame(ItemMapping::class, $related);
                self::assertSame('boq_item_id', $foreignKey);
                self::assertSame('boq_item_id', $localKey);
                return $hasOne;
            });

        self::assertSame($belongsTo, $quoteItem->transaction());
        self::assertSame($hasOne, $quoteItem->itemMapping());
    }

    public function testResourceRelationshipReturnsMapping(): void
    {
        $relation = $this->createMock(HasOne::class);
        $resource = $this->getMockBuilder(Resource::class)->onlyMethods(['hasOne'])->getMock();
        $resource->expects(self::once())
            ->method('hasOne')
            ->willReturnCallback(static function ($related, $foreignKey) use ($relation) {
                self::assertSame(ResourceMapping::class, $related);
                self::assertSame('boq_resource_id', $foreignKey);
                return $relation;
            });

        self::assertSame($relation, $resource->resourceMappings());
    }

    public function testResourceMappingRelationshipsExposeVersionAndData(): void
    {
        $belongsToCalls = [];
        $hasOneCalls = [];
        $belongsTo = $this->createMock(BelongsTo::class);
        $hasOne = $this->createMock(HasOne::class);

        $mapping = $this->getMockBuilder(ResourceMapping::class)->onlyMethods(['belongsTo', 'hasOne'])->getMock();
        $mapping->expects(self::once())
            ->method('belongsTo')
            ->willReturnCallback(static function () use (&$belongsToCalls, $belongsTo) {
                $belongsToCalls[] = func_get_args();
                return $belongsTo;
            });
        $mapping->expects(self::once())
            ->method('hasOne')
            ->willReturnCallback(static function () use (&$hasOneCalls, $hasOne) {
                $hasOneCalls[] = func_get_args();
                return $hasOne;
            });

        $mapping->resourceVersion();
        $mapping->resourceData();

        self::assertSame([[ResourceVersion::class, 'id', 'boq_resource_mapping_id', null]], $belongsToCalls);
        self::assertSame([[Resource::class, 'id', 'boq_resource_id']], $hasOneCalls);
    }
}
