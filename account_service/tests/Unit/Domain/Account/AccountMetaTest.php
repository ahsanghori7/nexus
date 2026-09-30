<?php
declare(strict_types=1);

namespace Tests\Domain\Account;

use App\Domain\Account\AccountMeta;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

class AccountMetaTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::addConnection('r', FakeRedBean::class);
        FakeRedBean::reset();
    }

    public function testLoadMetaByIdReturnsLabelledValues(): void
    {
        FakeRedBean::$getAllHook = static function (string $sql) {
            return [
                ['id' => 1, 'value' => 'foo', 'label' => 'company'],
                ['id' => 2, 'value' => 'bar', 'label' => 'status'],
            ];
        };

        $meta = (new AccountMeta())->loadMetaById(5);

        $this->assertSame([
            'company' => 'foo',
            'status' => 'bar',
        ], $meta);
    }

    public function testLoadMetaKeysReturnsKeyIndex(): void
    {
        FakeRedBean::$getAllHook = static function (string $sql) {
            if (str_contains($sql, 'account_meta_key meta_key')) {
                return [
                    ['id' => 1, 'value' => 'foo', 'label' => 'company'],
                ];
            }

            return [
                ['id' => 12, 'key' => 'company'],
                ['id' => 13, 'key' => 'status'],
            ];
        };

        $keys = (new AccountMeta())->loadMetaKeys();
        $this->assertSame([
            'company' => 12,
            'status' => 13,
        ], $keys);
    }

    public function testIsValidMetaKeyCachesLookup(): void
    {
        FakeRedBean::$getAllHook = static function (string $sql) {
            return [
                ['id' => 12, 'key' => 'company'],
            ];
        };

        $meta = new AccountMeta();
        FakeRedBean::$calls = [];

        $this->assertTrue($meta->isValidMetaKey('company'));
        $this->assertTrue($meta->isValidMetaKey('company'));
        $this->assertFalse($meta->isValidMetaKey('status'));

        $this->assertCount(1, array_filter(
            FakeRedBean::$calls,
            static fn ($call) => $call[0] === 'getAll'
        ));
    }
}
