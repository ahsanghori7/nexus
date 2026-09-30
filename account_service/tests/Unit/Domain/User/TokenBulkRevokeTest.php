<?php
declare(strict_types=1);

namespace Tests\Domain\User;

use App\Domain\User\UserRepository;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;
use Tests\Support\Fakes\FakeTokenModel;

final class BulkRevokeRepository extends UserRepository
{
    public function getModel(string $model = 'user')
    {
        return new FakeTokenModel();
    }
}

final class TokenBulkRevokeTest extends TestCase
{
    private BulkRevokeRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
        FakeTokenModel::reset();
        DB::addConnection('r', FakeDB::class);

        $this->repository = new BulkRevokeRepository();
    }

    public function testWithdrawsEveryTokenInOneStatement(): void
    {
        FakeDB::queueExecResult(3);

        $revoked = $this->repository->setTokensInactiveByIds([11, 22, 33]);

        self::assertSame(3, $revoked);

        [$sql, $params] = FakeDB::$lastExec;
        self::assertStringContainsString('UPDATE token SET active = 0', $sql);
        self::assertStringContainsString('WHERE id IN (?,?,?)', $sql);

        // The timestamp binds first, then one placeholder per identifier.
        self::assertCount(4, $params);
        self::assertSame([11, 22, 33], array_slice($params, 1));
    }

    /**
     * @dataProvider unusableIdSets
     */
    public function testRunsNothingWithoutUsableIdentifiers(array $ids): void
    {
        self::assertSame(0, $this->repository->setTokensInactiveByIds($ids));
        self::assertNull(FakeDB::$lastExec);
    }

    public static function unusableIdSets(): array
    {
        return [
            'nothing given' => [[]],
            'only zeroes'   => [[0, 0]],
            'nothing usable' => [['', null]],
        ];
    }

    public function testCollapsesRepeatsAndIgnoresUnusableIdentifiers(): void
    {
        FakeDB::queueExecResult(2);

        $this->repository->setTokensInactiveByIds([11, '11', 22, 0]);

        [$sql, $params] = FakeDB::$lastExec;
        self::assertSame([11, 22], array_slice($params, 1));
        self::assertStringContainsString('WHERE id IN (?,?)', $sql);
    }

    public function testTheWithdrawalIsStampedWithATime(): void
    {
        FakeDB::queueExecResult(1);

        $this->repository->setTokensInactiveByIds([11]);

        [, $params] = FakeDB::$lastExec;
        self::assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', (string) $params[0]);
    }
}
