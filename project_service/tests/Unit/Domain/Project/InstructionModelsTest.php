<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Project;

use App\Domain\AbstractTypeModel;
use App\Domain\Project\Instruction;
use App\Domain\Project\InstructionStatus;
use App\Domain\Project\InstructionType;
use App\Domain\Project\Package;
use App\Domain\Project\Statuses;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class InstructionModelsTest extends TestCase
{
    protected function tearDown(): void
    {
        $this->clearTypeCache();
    }

    public function testInstructionCleanAndSerialize(): void
    {
        $model = new Instruction();
        $payload = [
            'transaction_id' => 99,
            'type_id' => 2,
            'price' => 1000,
            'description' => 'Extra work',
            'status' => 1,
            'date' => '2024-01-01',
            'ignore' => 'x',
        ];

        self::assertSame([
            'transaction_id' => 99,
            'type_id' => 2,
            'price' => 1000,
            'description' => 'Extra work',
            'status' => 1,
            'date' => '2024-01-01',
        ], $model->clean($payload));

        $model->setData($payload);
        self::assertSame($payload, $model->jsonSerialize());
    }

    public function testPackageCleanCoversBelongsToRelation(): void
    {
        $model = new class extends Package {
            /** @var array<int, array<int, mixed>> */
            public array $belongsToCalls = [];

            public function belongsTo($related, $foreignKey = null, $ownerKey = null, $relation = null)
            {
                $this->belongsToCalls[] = func_get_args();
                return 'relation';
            }
        };

        self::assertSame([
            'package_id' => 4,
            'tender_id' => 9,
        ], $model->clean([
            'package_id' => 4,
            'tender_id' => 9,
            'junk' => true,
        ]));

        self::assertSame('relation', $model->mapping());
        self::assertSame('App\Domain\Project\Tender', $model->belongsToCalls[0][0]);
    }

    public function testStatusesCleanAndSerialize(): void
    {
        $model = new Statuses();
        $payload = ['label' => 'Archived', 'extra' => true];

        self::assertSame(['label' => 'Archived'], $model->clean($payload));

        $model->setData(['id' => 3, 'label' => 'Pending']);
        self::assertSame(['id' => 3, 'label' => 'Pending'], $model->jsonSerialize());
    }

    /**
     * @dataProvider typeModelProvider
     *
     * @param class-string<AbstractTypeModel> $class
     */
    public function testTypeModelsResolveLabels(string $class): void
    {
        $this->clearTypeCache();
        $model = $this->getMockBuilder($class)->onlyMethods(['findAll'])->getMock();
        $model->expects(self::once())->method('findAll')->willReturn([
            ['id' => 10, 'label' => 'Draft'],
        ]);

        self::assertSame('Draft', $model->getLabel(10));
        self::assertSame(10, $model->getLabelId('draft'));
        $model->afterSave();

        $cache = $this->getTypeCache();
        self::assertSame([], $cache);
    }

    /**
     * @return array<int, array{class-string<AbstractTypeModel>}>
     */
    public static function typeModelProvider(): array
    {
        return [
            [InstructionStatus::class],
            [InstructionType::class],
        ];
    }

    private function clearTypeCache(): void
    {
        $ref = new ReflectionClass(AbstractTypeModel::class);
        $cache = $ref->getProperty('cache');
        $cache->setAccessible(true);
        $cache->setValue(null, []);
    }

    private function getTypeCache(): array
    {
        $ref = new ReflectionClass(AbstractTypeModel::class);
        $cache = $ref->getProperty('cache');
        $cache->setAccessible(true);

        return $cache->getValue();
    }
}
