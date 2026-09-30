<?php
declare(strict_types=1);

namespace Tests\Domain\Traits;

use App\Domain\Traits\LabelTrait;
use PHPUnit\Framework\TestCase;

class LabelTraitTest extends TestCase
{
    public function testGetLabelIdMatchesCaseInsensitively(): void
    {
        $model = new LabelTraitStub([
            ['id' => 1, 'label' => 'Alpha'],
            ['id' => 2, 'label' => 'Bravo'],
        ]);

        $this->assertSame(2, $model->getLabelId('bravo'));
        $this->assertSame(1, $model->getLabelId('ALPHA'));
    }

    public function testGetLabelIdReturnsFalseWhenLabelMissing(): void
    {
        $model = new LabelTraitStub([
            ['id' => 4, 'label' => 'Delta'],
        ]);

        $this->assertFalse($model->getLabelId('Omega'));
    }

    public function testGetLabelIdCachesResults(): void
    {
        $model = new LabelTraitStub([
            ['id' => 7, 'label' => 'Echo'],
        ]);

        $model->getLabelId('echo');
        $model->getLabelId('ECHO');

        $this->assertSame(1, $model->allCallCount);
    }
}

class LabelTraitStub
{
    use LabelTrait;

    public int $allCallCount = 0;

    public function __construct(private array $fixtures)
    {
    }

    public function all(array $filters = [])
    {
        $this->allCallCount++;
        return $this->fixtures;
    }
}
