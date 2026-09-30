<?php
declare(strict_types=1);

namespace Tests\Domain\Base;

use App\Domain\AbstractModel;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;
use Tests\TestDoubles\FakeRedBeanEntity;
use Tests\TestDoubles\MockModel;

class AbstractModelTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::addConnection('r', FakeRedBean::class);
        FakeRedBean::reset();
    }

    public function testGetStaticNameUsesConstant(): void
    {
        $this->assertSame('mock_model', MockModel::getStaticName());
    }

    public function testGetStaticNameFallsBackToClassName(): void
    {
        $this->assertSame('modelwithoutname', ModelWithoutName::getStaticName());
    }

    public function testGetNameFormatsCamelCase(): void
    {
        $model = new MockModel();
        $this->assertSame('mock_model', $model->getName());
        $this->assertSame('sample_camel_case_model', (new SampleCamelCaseModel())->getName());
    }

    public function testFormatTableNameInsertsUnderscores(): void
    {
        $model = new MockModel();
        $this->assertSame('account', $model->formatTblName('Account'));
        $this->assertSame('account_action', $model->formatTblName('AccountAction'));
    }

    public function testGetIdCastsToInteger(): void
    {
        $model = (new MockModel())->setData(['id' => '42']);
        $this->assertSame(42, $model->getId());
        $this->assertFalse((new MockModel())->getId());
    }

    public function testGetTableDispensesWhenIdMissing(): void
    {
        $model = new MockModel();
        $bean = $model->getTable();

        $this->assertInstanceOf(FakeRedBeanEntity::class, $bean);
        $this->assertSame([['xdispense', 'mock_model']], FakeRedBean::$calls);
    }

    public function testGetTableLoadsExistingRecordWhenIdPresent(): void
    {
        FakeRedBean::$loadHook = static function (string $name, $id) {
            $bean = new FakeRedBeanEntity($name);
            $bean->loaded = $id;
            return $bean;
        };

        $model = (new MockModel())->setData(['id' => '7']);
        $bean = $model->getTable();

        $this->assertSame(7, $bean->loaded);
        $this->assertSame([['load', 'mock_model', 7]], FakeRedBean::$calls);
    }

    public function testPopulateFiltersUnknownFields(): void
    {
        $model = new MockModel();
        $result = $model->populate([
            'name' => 'Acme',
            'email' => 'acme@example.com',
            'status' => 'live',
            'ignored' => 'value',
        ]);

        $this->assertSame([
            'name' => 'Acme',
            'email' => 'acme@example.com',
            'status' => 'live',
        ], $result);
    }

    public function testPopulatePreservesExistingValues(): void
    {
        $model = (new MockModel())->setData(['type' => 'supplier']);
        $result = $model->populate(['email' => 'foo@bar.test']);

        $this->assertArrayNotHasKey('name', $result);
        $this->assertSame('foo@bar.test', $result['email']);
        $this->assertSame('supplier', $result['type']);
    }

    public function testCanFilterSupportsAssociativeAndListColumns(): void
    {
        $model = new MockModel();
        $this->assertTrue($model->canFilter('name'));
        $this->assertTrue($model->canFilter('status'));
        $this->assertFalse($model->canFilter('missing'));
    }

    public function testGetColumnNamesAppliesAliasAndBlacklist(): void
    {
        $model = new MockModel();
        $this->assertSame(
            ['mock_model.id', 'mock_model.name', 'mock_model.email', 'mock_model.0', 'mock_model.1'],
            $model->getColumnNames('mock_model')
        );

        $this->assertSame(
            ['mock_model.id', 'mock_model.email', 'mock_model.0', 'mock_model.1'],
            $model->getColumnNames('mock_model', ['name', 'status'])
        );
    }

    public function testSanitizeValueStripsTagsAndBoundsLength(): void
    {
        $model = new MockModel();
        $sanitized = $model->sanitizeValue("<h1>O'Hara & Co</h1>");
        $this->assertSame("'O\\'Hara & Co'", $sanitized);
    }

    public function testSanitizeValueRejectsOversizedInput(): void
    {
        $model = new MockModel();
        $this->expectException(\Exception::class);
        $model->sanitizeValue(str_repeat('a', 300));
    }

    public function testTypeCastValueCastsKnownTypes(): void
    {
        $model = new MockModel();
        $value = '123';
        $model->typeCastValue($value, 'int');
        $this->assertSame(123, $value);

        $value = 'true';
        $model->typeCastValue($value, 'bool');
        $this->assertTrue($value);
    }

    public function testTypeCastValueIgnoresUnsupportedTypes(): void
    {
        $model = new MockModel();
        $value = '10';
        $model->typeCastValue($value, 'resource');
        $this->assertSame('10', $value);
    }

    public function testApplyFiltersBuildsClausesForScalarArrayAndInSyntax(): void
    {
        $model = new MockModel();
        $sql = $model->applyFilters('SELECT * FROM mock_model', [
            'name' => "O'Hara",
            'id' => ['>', 10],
            'status' => '[1,2,3]',
        ]);

        $this->assertSame(
            "SELECT * FROM mock_model WHERE name = 'O\\'Hara' AND id > '10' AND status IN(1,2,3)",
            $sql
        );
    }

    public function testApplyLimitCapsMaximumAndAddsOffset(): void
    {
        $model = new class extends MockModel {
            public function getMaxLimit(): int
            {
                return 25;
            }
        };

        $sql = $model->applyLimit('SELECT * FROM mock_model', 50, 10);
        $this->assertSame('SELECT * FROM mock_model LIMIT 10,25', $sql);
    }
}

class ModelWithoutName extends AbstractModel
{
}

class SampleCamelCaseModel extends AbstractModel
{
}
