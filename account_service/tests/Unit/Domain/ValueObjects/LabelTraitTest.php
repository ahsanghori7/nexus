<?php
declare(strict_types=1);

namespace Tests\Domain\ValueObjects;

use App\Domain\Feature\Envelope;
use App\Domain\Region\Region;
use App\Domain\Trade\Trade;
use PHPUnit\Framework\TestCase;

class LabelTraitTest extends TestCase
{
    /**
     * @dataProvider labelModelProvider
     */
    public function testGetLabelIdUsesCaseInsensitiveCache(string $class): void
    {
        $model = new $class();
        $model->fixtures = [
            ['id' => 1, 'label' => 'Alpha'],
            ['id' => 2, 'label' => 'Bravo'],
        ];

        $this->assertSame(2, $model->getLabelId('bravo'));
        $this->assertSame(1, $model->getLabelId('ALPHA'));
        $this->assertSame(1, $model->allCalls, 'Expected fixtures to be loaded once and cached');
    }

    public static function labelModelProvider(): array
    {
        return [
            [RegionStub::class],
            [TradeStub::class],
            [EnvelopeStub::class],
        ];
    }
}

class RegionStub extends Region
{
    use LabelledModelHelpers;
}

class TradeStub extends Trade
{
    use LabelledModelHelpers;
}

class EnvelopeStub extends Envelope
{
    use LabelledModelHelpers;
}

trait LabelledModelHelpers
{
    public array $fixtures = [];
    public int $allCalls = 0;

    public function all(array $filters = [])
    {
        $this->allCalls++;
        return $this->fixtures;
    }
}
