<?php
declare(strict_types=1);

namespace Tests\Domain\Threshold;

use App\Domain\Threshold\ApprovalThresholds;
use App\Domain\Threshold\ThresholdRepository;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;

final class ThresholdRepositoryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
    }

    public function testGetThresholdsDelegatesToModelAndPassesAccountId(): void
    {
        FakeDB::queueGetAllResult([
            ['account_id' => 42, 'from_value' => 0, 'to_value' => 1000],
        ]);

        $model = new ApprovalThresholdsStub();
        $repository = new ThresholdRepositoryDouble($model);

        $result = $repository->getThresholds(42);

        self::assertSame(
            [
                ['account_id' => 42, 'from_value' => 0, 'to_value' => 1000],
            ],
            $result
        );

        self::assertStringContainsString('WHERE account_id = ?', FakeDB::$lastGetAllQuery ?? '');
        self::assertSame([42], FakeDB::$lastGetAllParams);
        self::assertStringContainsString('ORDER BY from_value ASC', FakeDB::$lastGetAllQuery ?? '');
    }
}

final class ThresholdRepositoryDouble extends ThresholdRepository
{
    protected $model;

    public function __construct(ApprovalThresholds $model)
    {
        $this->model = $model;
    }

    public function getModel(string $name = "")
    {
        return $this->model;
    }
}

final class ApprovalThresholdsStub extends ApprovalThresholds
{
    public function getDB()
    {
        return FakeDB::class;
    }
}
