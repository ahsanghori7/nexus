<?php
declare(strict_types=1);

namespace Tests\Domain\Account;

use App\Domain\Account\AccountUserMapping;
use PHPUnit\Framework\TestCase;
use Tests\Support\Fakes\FakeDB;

final class AccountUserMappingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();
    }

    public function testMappingsGroupedByAccountAndPasswordsRemoved(): void
    {
        FakeDB::queueGetAllResult([
            [
                'account_id' => 5,
                'user_id' => 1,
                'user_firstname' => 'Amy',
                'user_lastname' => 'Anderson',
                'user_contact_number' => '123',
                'password' => 'secret',
            ],
            [
                'account_id' => 5,
                'user_id' => 2,
                'user_firstname' => 'Bob',
                'user_lastname' => 'Brown',
                'user_contact_number' => '456',
            ],
            [
                'account_id' => 9,
                'user_id' => 3,
                'user_firstname' => 'Cara',
                'user_lastname' => 'Clark',
                'user_contact_number' => '789',
                'password' => 'hidden',
            ],
        ]);

        $model = new AccountUserMappingStub();

        $result = $model->getAccountUserMappings(5, 'supply_chain', [10, 20]);

        self::assertSame(
            [
                5 => [
                    [
                        'account_id' => 5,
                        'user_id' => 1,
                        'user_firstname' => 'Amy',
                        'user_lastname' => 'Anderson',
                        'user_contact_number' => '123',
                    ],
                    [
                        'account_id' => 5,
                        'user_id' => 2,
                        'user_firstname' => 'Bob',
                        'user_lastname' => 'Brown',
                        'user_contact_number' => '456',
                    ],
                ],
                9 => [
                    [
                        'account_id' => 9,
                        'user_id' => 3,
                        'user_firstname' => 'Cara',
                        'user_lastname' => 'Clark',
                        'user_contact_number' => '789',
                    ],
                ],
            ],
            $result
        );

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString("aut.label = 'supply_chain'", $query);
        self::assertStringContainsString("au.account_id = 5", $query);
        self::assertStringContainsString("IN (10,20)", $query);
    }

    public function testQueryWithoutChildrenSkipsInClause(): void
    {
        FakeDB::queueGetAllResult([]);
        $model = new AccountUserMappingStub();
        $model->getAccountUserMappings(9, 'manager');

        $query = FakeDB::$lastGetAllQuery ?? '';
        self::assertStringContainsString("aut.label = 'manager'", $query);
        self::assertStringContainsString("au.account_id = 9", $query);
        self::assertStringNotContainsString('IN (', $query);
    }
}

final class AccountUserMappingStub extends AccountUserMapping
{
    public function getDB()
    {
        return FakeDB::class;
    }
}
