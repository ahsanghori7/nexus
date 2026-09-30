<?php
declare(strict_types=1);

namespace Tests\Domain\Base;

use App\Domain\AbstractTypeModel;
use PHPUnit\Framework\TestCase;

class AbstractTypeModelTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        (new FakeTypeModel())->afterSave(); // clear shared cache
    }

    public function testGetCacheBuildsIndexedResultsAndCaches(): void
    {
        $model = new FakeTypeModel();
        $model->fixtures = [
            ['id' => 1, 'label' => 'Free'],
            ['id' => 2, 'label' => 'Premium'],
        ];

        $cache = $model->getCache();

        $this->assertSame(
            [
                1 => ['id' => 1, 'label' => 'Free'],
                2 => ['id' => 2, 'label' => 'Premium'],
            ],
            $cache
        );
        $this->assertSame(1, $model->findAllCalls);

        $model->getCache();
        $this->assertSame(1, $model->findAllCalls, 'Cache should prevent additional queries');
    }

    public function testGetLabelReadsFromCache(): void
    {
        $model = new FakeTypeModel();
        $model->fixtures = [
            ['id' => 5, 'label' => 'Manager'],
        ];

        $this->assertSame('Manager', $model->getLabel(5));
    }

    public function testAfterSaveClearsCache(): void
    {
        $model = new FakeTypeModel();
        $model->fixtures = [
            ['id' => 1, 'label' => 'Initial'],
        ];
        $model->getCache();

        $model->fixtures = [
            ['id' => 1, 'label' => 'Updated'],
        ];
        $model->afterSave();
        $this->assertSame('Updated', $model->getLabel(1));
    }

    public function testGetLabelIdMatchesCaseInsensitively(): void
    {
        $model = new FakeTypeModel();
        $model->fixtures = [
            ['id' => 2, 'label' => 'Premium'],
        ];

        $this->assertSame(2, $model->getLabelId('premium'));
        $this->assertFalse($model->getLabelId('missing'));
    }
}

class FakeTypeModel extends AbstractTypeModel
{
    public array $fixtures = [];
    public int $findAllCalls = 0;

    public function findAll(array $filters = [], int $limit = 0, int $offset = 0, bool $assoc_array = false): array
    {
        $this->findAllCalls++;
        return $this->fixtures;
    }
}
