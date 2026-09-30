<?php
declare(strict_types=1);

namespace Tests\Unit\Domain\Account;

use App\Domain\Account\AccountGroupRepository;
use Tests\Support\Fakes\FakeDB;
use Tests\TestCase;

final class AccountGroupRepositoryTest extends TestCase
{
    private $repository;

    protected function setUp(): void
    {
        parent::setUp();
        FakeDB::reset();

        // Create a mock of the repository to override getModel
        $this->repository = $this->getMockBuilder(AccountGroupRepository::class)
            ->onlyMethods(['getModel'])
            ->getMock();

        // Create a model mock
        $modelMock = $this->getMockBuilder(\stdClass::class)
            ->addMethods(['getName', 'getDB', 'save', 'deleteWhere'])
            ->getMock();

        $modelMock->method('getName')->willReturn('account_groups');
        $modelMock->method('getDB')->willReturn(FakeDB::class);

        $this->repository->method('getModel')->willReturn($modelMock);
    }

    public function testGetByAccountIdBuildsCorrectSql(): void
    {
        FakeDB::queueGetAllResult([['id' => 1, 'label' => 'Standard Group']]);

        $result = $this->repository->getByAccountId(123);

        $this->assertIsArray($result);
        $this->assertStringContainsString('WHERE account_id = ?', FakeDB::$lastGetAllQuery);
    }

    public function testGetModelThrowsExceptionOnInvalidKey(): void
    {
        $repo = new AccountGroupRepository();
        $this->expectException(\Exception::class);
        $repo->getModel('invalid_key_check');
    }
}
