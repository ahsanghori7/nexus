<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Persistence\Account;

use App\Domain\Account\Account;
use App\Infrastructure\Persistence\Account\InMemoryAccountRepository;
use PHPUnit\Framework\TestCase;

final class InMemoryAccountRepositoryTest extends TestCase
{
    public function testFindAllReturnsAccountsProvidedByModel(): void
    {
        $account = new AccountCollectionDouble();
        $account->accounts = [
            ['id' => 1, 'name' => 'Acme'],
        ];
        $repository = new InMemoryAccountRepository($account);

        $this->assertSame($account->accounts, $repository->findAll());
    }

    public function testCreateReturnsFalseWhenPayloadEmpty(): void
    {
        $repository = new InMemoryAccountRepository(new AccountCollectionDouble());

        $this->assertFalse($repository->create([]));
    }

    public function testCreateReturnsTrueWhenPayloadProvided(): void
    {
        $repository = new InMemoryAccountRepository(new AccountCollectionDouble());

        $this->assertTrue($repository->create(['name' => 'Acme']));
    }

    public function testFindUserOfIdReturnsStoredUser(): void
    {
        $repository = new InMemoryAccountRepository(new AccountCollectionDouble());
        $user = new AccountCollectionDouble();
        $this->setUsers($repository, [5 => $user]);

        $this->assertSame($user, $repository->findUserOfId(5));
    }

    public function testFindUserOfIdThrowsWhenUserMissing(): void
    {
        $repository = new InMemoryAccountRepository(new AccountCollectionDouble());

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('User not found');

        $repository->findUserOfId(99);
    }

    public function testDeleteByIdReturnsTrueForKnownUser(): void
    {
        $repository = new InMemoryAccountRepository(new AccountCollectionDouble());
        $this->setUsers($repository, [5 => new AccountCollectionDouble()]);

        $this->assertTrue($repository->deleteById(5));
    }

    public function testDeleteByIdThrowsWhenUserMissing(): void
    {
        $repository = new InMemoryAccountRepository(new AccountCollectionDouble());

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('User not found');

        $repository->deleteById(2);
    }

    public function testUpdateByIdReturnsTrueWhenUserExists(): void
    {
        $repository = new InMemoryAccountRepository(new AccountCollectionDouble());
        $this->setUsers($repository, [8 => new AccountCollectionDouble()]);

        $this->assertTrue($repository->updateById(8, ['name' => 'New']));
    }

    public function testUpdateByIdThrowsWhenUserMissing(): void
    {
        $repository = new InMemoryAccountRepository(new AccountCollectionDouble());

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('User not found');

        $repository->updateById(1, ['name' => 'Missing']);
    }

    /**
     * @param array<int, Account> $users
     */
    private function setUsers(InMemoryAccountRepository $repository, array $users): void
    {
        $reflection = new \ReflectionClass($repository);
        $property = $reflection->getProperty('users');
        $property->setAccessible(true);
        $property->setValue($repository, $users);
    }
}

final class AccountCollectionDouble extends Account
{
    public array $accounts = [];

    public function getAllAccounts(): array
    {
        return $this->accounts;
    }
}
