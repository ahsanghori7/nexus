<?php

namespace Tests\Application\Actions\Account;

class AccountModelStub
{
    private $repository;

    /**
     * Accepts either AccountRepositoryStub or SupplyChainRepositoryStub for compatibility.
     */
    public function __construct($repository)
    {
        $this->repository = $repository;
    }

    // For AccountActionTest.php
    public function load(int|string $value, string $column = 'id')
    {
        $originalId = $value;

        if (property_exists($this->repository, 'accountLoadCalls')) {
            $this->repository->accountLoadCalls[] = $originalId;
        }

        if ($column === 'name') {
            $key = (string) $value;
            $entity = $this->repository->accountsByName[$key] ?? null;
            if ($entity instanceof AccountEntityStub) {
                return $entity;
            }

            $data = is_array($entity) ? $entity : null;
            $loaded = $data !== null;
            return new AccountEntityStub($loaded, (int) ($data['id'] ?? 0), $data, $this->repository);
        }

        $id = (int) $value;
        $data = $this->repository->accountEntities[$id] ?? null;
        $loaded = $data !== null;

        if (property_exists($this->repository, 'entityExists')) {
            $loaded = (bool) $this->repository->entityExists;
        }

        if (class_exists('Tests\\Application\\Actions\\Account\\AccountEntityStub')) {
            return new AccountEntityStub($loaded, $id, $data, $this->repository);
        }
        // Fallback for SupplyChainV2ActionTest.php
        return new AccountEntityStub($loaded, $id);
    }

    public function save(array $data): AccountEntityStub
    {
        $id = (int) ($data['id'] ?? $this->repository->nextAccountId++);
        $data['id'] = $id;
        $entity = new AccountEntityStub(true, $id, $data, $this->repository);
        $this->repository->accountEntities[$id] = $data;
        if (isset($data['name'])) {
            $this->repository->accountsByName[$data['name']] = $entity;
        }
        $this->repository->accountSaveCalls[] = $data;

        return $entity;
    }

    public function getTypeModel()
    {
        return new class($this->repository) {
            public function __construct(private $repository)
            {
            }

            public function getLabelId(string $label): int
            {
                return $this->repository->externalAccountTypeId ?? 0;
            }
        };
    }

    // For SupplyChainV2ActionTest.php
    public function findOne(array $criteria)
    {
        if (property_exists($this->repository, 'accountModelFindOneCalls')) {
            $this->repository->accountModelFindOneCalls[] = $criteria;
        }
        if (property_exists($this->repository, 'entityExists') && !$this->repository->entityExists) {
            throw new \Exception('no records found');
        }
        return new AccountEntityStub(true, 0, [], $this->repository);
    }
}
