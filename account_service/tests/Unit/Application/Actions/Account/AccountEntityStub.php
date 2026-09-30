<?php

namespace Tests\Application\Actions\Account;

use App\Domain\Account\Account as DomainAccount;
use App\Domain\User\User as DomainUser;

class AccountEntityStub extends DomainAccount
{
    private bool $loaded;
    private int $id;
    private $repository;
    private array $saveCalls = [];
    private ?AccountUsersStub $usersStub = null;

    // Accepts both legacy and minimal signatures for compatibility
    public function __construct(bool $loaded, int $id = 0, ?array $data = null, $repository = null)
    {
        $this->loaded = $loaded;
        $this->id = $id;
        $this->data = $data ?? [];
        $this->repository = $repository;

        if ($loaded && !isset($this->data[self::ID_FIELD])) {
            $this->data[self::ID_FIELD] = $id;
        }
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getId(): int
    {
        return (int) ($this->data[self::ID_FIELD] ?? $this->id);
    }

    public function getData(?string $k = null, $def = null): mixed
    {
        if ($k !== null) {
            return $this->data[$k] ?? $def;
        }

        return $this->data;
    }

    public function setData(array $data)
    {
        $this->data = array_merge($this->data, $data);
        return $this;
    }

    public function save(array $data, $insertOnly = false)
    {
        $this->saveCalls[] = $data;
        $this->data = array_merge($this->data, $data);
        if ($this->repository) {
            $this->repository->accountSaveCalls[] = $data;
        }

        return $this;
    }

    public function getSaveCalls(): array
    {
        return $this->saveCalls;
    }

    public function load($id, $idField = self::ID_FIELD)
    {
        if ($idField === 'name') {
            return $this->data;
        }

        $id = (int) $id;
        if (is_array($this->repository?->accountEntities ?? null) && isset($this->repository->accountEntities[$id])) {
            $this->data = $this->repository->accountEntities[$id] + [self::ID_FIELD => $id];
            $this->id = $id;
            $this->loaded = true;
        }

        return $this->data;
    }

    public function loadUsers(): self
    {
        $this->usersStub = new AccountUsersStub($this->repository, $this->getId());
        $userId = $this->repository?->accountHolderIds[$this->getId()] ?? null;
        if ($userId) {
            $this->children['users'] = [new AccountUserStub($userId)];
        } else {
            $this->children['users'] = [];
        }
        return $this;
    }

    public function loadMembership(): self
    {
        return $this;
    }

    public function isOfType(string $label): bool
    {
        $type = $this->data['type'] ?? $this->data['type_label'] ?? '';
        return strcasecmp((string) $type, $label) === 0;
    }

    public function createUser(array $data): DomainUser
    {
        $id = 1;
        if ($this->repository) {
            $id = $this->repository->nextUserId++;
            $this->repository->createdUsers[] = [
                'account_id' => $this->getId(),
                'payload' => $data,
                'id' => $id,
            ];
        }

        return new AccountUserStub($id);
    }

    public function jsonSerialize(): mixed
    {
        return $this->data;
    }
}

final class AccountUsersStub
{
    public function __construct(private $repository, private int $accountId)
    {
    }

    public function getAccountHolder(): AccountUserStub
    {
        if ($this->usersStub) {
            return $this->usersStub->getAccountHolder();
        }
        $id = $this->repository?->accountHolderIds[$this->getId()] ?? 0;
        return new AccountUserStub($id);
    }

    public function loadMembership(): self
    {
        return $this;
    }

    public function load(int|string $id): self
    {
        return $this;
    }
}

final class AccountUserStub extends DomainUser
{
    public function __construct(private int $id)
    {
        $this->data = [self::ID_FIELD => $id];
    }

    public function save(array $data, $insertOnly = false)
    {
        $this->data = array_merge($this->data, $data);
        return $this;
    }

    public function getId(): int
    {
        return $this->data[self::ID_FIELD] ?? $this->id;
    }
}
