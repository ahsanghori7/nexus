<?php

declare(strict_types=1);

namespace Tests\Unit\Domain;

use App\Domain\AbstractModel;
use App\Domain\AbstractTypeModel;
use App\Domain\AbstractTypedModel;
use App\Domain\DomainException;
use PHPUnit\Framework\TestCase;

class BaseModelTest extends TestCase
{
    public function testStoreCastsValuesAndPersists(): void
    {
        $model = new ExampleModel();
        $model->store(['name' => 'Abc', 'count' => '5']);

        self::assertSame('5', $model->getData('count'));
        self::assertSame(123, $model->getId());
        self::assertSame(['name' => 'Abc', 'count' => '5', 'id' => 123], $model->jsonSerialize());
    }

    public function testStoreThrowsOnValidationFailure(): void
    {
        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Max length exceeded for name');

        $model = new ExampleModel();
        $model->store(['name' => 'toolong', 'count' => 1]);
    }

    public function testCleanDropsUnknownFields(): void
    {
        $model = new ExampleModel();

        self::assertSame([
            'name' => 'Ok',
            'count' => 3,
        ], $model->clean([
            'name' => 'Ok',
            'count' => 3,
            'ignored' => 9,
        ]));
    }

    public function testTypedModelConvertsTypeToIdentifier(): void
    {
        ExampleTypeModel::$fakeCache = [5 => ['label' => 'Quote']];

        $model = new ExampleTypedModel();
        self::assertSame([
            'type_id' => 5,
        ], $model->populate(['type' => 'quote']));
    }

    public function testTypedModelThrowsWhenTypeUnknown(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid Type Unknown');

        ExampleTypeModel::$fakeCache = [];

        $model = new ExampleTypedModel();
        $model->populate(['type' => 'Unknown']);
    }

    public function testTypeModelLookupIsCaseInsensitive(): void
    {
        ExampleTypeModel::$fakeCache = [8 => ['label' => 'Order']];
        $type = new ExampleTypeModel();

        self::assertSame('Order', $type->getLabel(8));
        self::assertSame(8, $type->getLabelId('order'));
    }

    public function testApplyFiltersBuildsWhereClause(): void
    {
        $model = new ExampleModel();
        $sql = $model->applyFilters('SELECT * FROM example', [
            'name' => 'Alpha',
            'count' => ['>=', 10],
            'ignored' => 'value',
        ]);

        self::assertSame("SELECT * FROM example WHERE name = 'Alpha' AND count >= '10'", $sql);
    }

    public function testSanitizeValueRejectsLongStrings(): void
    {
        $model = new ExampleModel();
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('invalid string length value');
        $model->sanitizeValue(str_repeat('a', 300));
    }

    public function testApplyLimitCapsMaximum(): void
    {
        $model = new class extends ExampleModel {
            public function getMaxLimit(): int
            {
                return 25;
            }
        };

        self::assertSame('SELECT * LIMIT 5,25', $model->applyLimit('SELECT *', 100, 5));
    }

    public function testFindOneThrowsWhenMultipleRecordsReturned(): void
    {
        $model = new class extends ExampleModel {
            public function findAll(array $filters = [], int $limit = 0, int $offset = 0): array
            {
                return [['id' => 1], ['id' => 2]];
            }
        };

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('multiple records found for findOne');
        $model->findOne(['name' => 'Duplicate']);
    }

    public function testFindOneThrowsWhenNoRecordsFound(): void
    {
        $model = new class extends ExampleModel {
            public function findAll(array $filters = [], int $limit = 0, int $offset = 0): array
            {
                return [];
            }
        };

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('no records found');
        $model->findOne(['name' => 'Missing']);
    }

    public function testFindOneHydratesModelWithSingleRecord(): void
    {
        $model = new class extends ExampleModel {
            public function findAll(array $filters = [], int $limit = 0, int $offset = 0): array
            {
                return [['id' => 5, 'name' => 'Stored']];
            }
        };

        $result = $model->findOne(['id' => 5]);
        self::assertSame(5, $result->getId());
        self::assertSame('Stored', $result->getData('name'));
    }
}

class ExampleModel extends AbstractModel
{
    protected $fillable = ['name', 'count'];

    protected $columns = [
        'id' => ['type' => 'int'],
        'name' => ['type' => 'string', 'validate' => 'maxlength:5|minlength:2'],
        'count' => ['type' => 'int'],
    ];

    public array $lastStored = [];

    public function getTableModel()
    {
        return new class($this)
        {
            private ExampleModel $model;

            public function __construct(ExampleModel $model)
            {
                $this->model = $model;
            }

            public function __set($name, $value): void
            {
                $this->model->lastStored[$name] = $value;
            }

            public function save(): void
            {
            }

            public function getId(): int
            {
                return 123;
            }
        };
    }
}

class ExampleTypeModel extends AbstractTypeModel
{
    /** @var array<int, array<string, string>> */
    public static array $fakeCache = [1 => ['label' => 'Default']];

    public function getCache()
    {
        return self::$fakeCache;
    }
}

class ExampleTypedModel extends AbstractTypedModel
{
    protected $typeModel = ExampleTypeModel::class;

    protected $columns = [
        'type_id' => ['type' => 'int'],
    ];
}
