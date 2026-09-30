<?php
declare(strict_types=1);

namespace Tests\Domain\Base;

use App\Domain\AbstractTypedModel;
use App\Domain\AbstractTypeModel;
use PHPUnit\Framework\TestCase;

class AbstractTypedModelTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        (new FakeTypeLookup())->afterSave(); // clear shared cache
        FakeTypeLookup::$labels = [
            1 => 'Admin',
            2 => 'Member',
        ];
    }

    public function testGetTypeModelReturnsConcreteInstance(): void
    {
        $model = new TypedModelStub();
        $typeModel = $model->getTypeModel();

        $this->assertInstanceOf(FakeTypeLookup::class, $typeModel);
    }

    public function testPopulateConvertsTypeLabelToTypeId(): void
    {
        $model = new TypedModelStub();

        $data = $model->populate([
            'name' => 'Jane',
            'type' => 'Admin',
        ]);

        $this->assertSame(1, $data['type_id']);
        $this->assertArrayNotHasKey('type', $data);
    }

    public function testPopulateRejectsUnknownTypeLabel(): void
    {
        $model = new TypedModelStub();
        $this->expectException(\Exception::class);
        $model->populate(['type' => 'Unknown']);
    }

    public function testGetTypeLabelReturnsCurrentLabel(): void
    {
        $model = (new TypedModelStub())->setData([
            'id' => 10,
            'type_id' => 2,
        ]);

        $this->assertSame('Member', $model->getTypeLabel());
    }

    public function testIsOfTypeComparesCaseInsensitively(): void
    {
        $model = (new TypedModelStub())->setData([
            'id' => 11,
            'type_id' => 1,
        ]);

        $this->assertTrue($model->isOfType('admin'));
        $this->assertFalse($model->isOfType('member'));
    }

    public function testGetTypeModelThrowsWhenClassMissing(): void
    {
        $model = new class extends AbstractTypedModel {
            protected $typeModel = 'Missing\\Type\\ClassName';
        };

        $this->expectException(\Exception::class);
        $model->getTypeModel();
    }

    public function testGetTypeModelThrowsWhenClassIsNotSubtype(): void
    {
        $model = new class extends AbstractTypedModel {
            protected $typeModel = \stdClass::class;
        };

        $this->expectException(\Exception::class);
        $model->getTypeModel();
    }
}

class FakeTypeLookup extends AbstractTypeModel
{
    public static array $labels = [];

    public function findAll(array $filters = [], int $limit = 0, int $offset = 0, bool $assoc_array = false): array
    {
        $rows = [];
        foreach (self::$labels as $id => $label) {
            $rows[] = ['id' => $id, 'label' => $label];
        }
        return $rows;
    }
}

class TypedModelStub extends AbstractTypedModel
{
    protected $typeModel = FakeTypeLookup::class;

    protected $columns = [
        'id' => ['type' => 'int'],
        'name' => ['type' => 'string'],
        'type_id' => ['type' => 'int'],
    ];
}
