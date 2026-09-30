<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Account;

final class PrequalificationRepositoryStub
{
    public array $userOrganisationList = [];
    public array $referencesList = [];
    public array $referencesFindCalls = [];
    public array $referencesSaveCalls = [];
    public array $referencesLoadCalls = [];
    public array $turnoverList = [];
    public array $metaList = [];
    public array $statusesList = [];
    public array $sectionMappingSaveCalls = [];
    public array $sectionMappingUpdates = [];
    public array $sectionMappingLoads = [];
    public bool $sectionMappingLoaded = true;
    public int $nextSectionMappingId = 80;
    public bool $statusExists = true;
    public array $statusUpdates = [];
    public array $statusSaves = [];
    public array $statusFindCalls = [];
    public array $statusFindAllCalls = [];
    public array $prequalificationSections = [];
    public array $prequalificationSectionList = [];
    public array $prequalificationSectionMappings = [];
    public array $sectionMappingAllCalls = [];
    public bool $referencesThrows = false;
    public bool $statusesThrows = false;
    public bool $referenceLoaded = true;
    public int $nextReferenceId = 0;
    public array $updateModelCalls = [];
    /** @var array<string,bool> */
    public array $updateModelOverrides = [];
    public bool $updateModelDefaultResult = false;
    public bool $statusFindThrows = false;

    public function getModel(string $name = '')
    {
        return match ($name) {
            'userOrganisation' => new PrequalificationUserOrganisationModelStub($this),
            'account_references' => new PrequalificationReferencesModelStub($this),
            'account_turnover' => new PrequalificationTurnoverModelStub($this),
            'account_meta' => new PrequalificationMetaModelStub($this),
            'account_prequalification_status' => new PrequalificationStatusModelStub($this),
            'prequalification_section_mapping' => new PrequalificationSectionMappingModelStub($this),
            'account_prequalification_sections' => new PrequalificationSectionsModelStub($this),
            'prequalification_section' => new PrequalificationSectionModelStub($this),
            default => new class {
                public function __call(string $name, array $arguments)
                {
                    return [];
                }
            },
        };
    }

    public function updateModelByConditions(string $model, array $data, array $conditions): bool
    {
        $this->updateModelCalls[] = [
            'model' => $model,
            'data' => $data,
            'conditions' => $conditions,
        ];

        $key = sprintf('%s:%s', $model, json_encode($conditions));
        if (array_key_exists($key, $this->updateModelOverrides)) {
            return $this->updateModelOverrides[$key];
        }

        return $this->updateModelDefaultResult;
    }
}

final class PrequalificationUserOrganisationModelStub
{
    public function __construct(private PrequalificationRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        return $this->repository->userOrganisationList;
    }
}

final class PrequalificationReferencesModelStub
{
    private int $lastId = 0;

    public function __construct(private PrequalificationRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        if ($this->repository->referencesThrows) {
            throw new \Exception('references failed');
        }
        return $this->repository->referencesList;
    }

    public function findOne(array $filters)
    {
        $this->repository->referencesFindCalls[] = $filters;
        return new PrequalificationReferenceEntityStub($this->repository->referenceLoaded, $this->repository);
    }

    public function load(int $id, string $field = 'id')
    {
        $this->repository->referencesLoadCalls[] = [$id, $field];
        return new PrequalificationReferenceEntityStub($this->repository->referenceLoaded, $this->repository);
    }

    public function save(array $data)
    {
        $this->repository->referencesSaveCalls[] = $data;
        $this->repository->referencesList[] = $data;
        $this->lastId = $data['id'] ?? $this->repository->nextReferenceId;
        return $this;
    }

    public function getId(): int
    {
        return $this->lastId;
    }
}

final class PrequalificationReferenceEntityStub
{
    public function __construct(private bool $loaded, private PrequalificationRepositoryStub $repository)
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getId(): int
    {
        return 0;
    }

    public function save(array $data): void
    {
        $this->repository->referencesSaveCalls[] = $data;
    }
}

final class PrequalificationTurnoverModelStub
{
    public function __construct(private PrequalificationRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        return $this->repository->turnoverList;
    }

    public function save(array $data)
    {
        $this->repository->turnoverList[] = $data;
        return new class {
            public function getId(): int
            {
                return 0;
            }
        };
    }
}

final class PrequalificationMetaModelStub
{
    public function __construct(private PrequalificationRepositoryStub $repository)
    {
    }

    public function loadMetaById(int $id): array
    {
        return $this->repository->metaList;
    }
}

final class PrequalificationStatusModelStub
{
    public function __construct(private PrequalificationRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        $this->repository->statusFindAllCalls[] = $filters;
        if ($this->repository->statusesThrows) {
            throw new \Exception('statuses failed');
        }
        return $this->repository->statusesList;
    }

    public function findOne(array $criteria)
    {
        $this->repository->statusFindCalls[] = $criteria;
        if ($this->repository->statusFindThrows) {
            throw new \Exception('status lookup failed');
        }
        return new PrequalificationStatusEntityStub($this->repository->statusExists, $this->repository);
    }

    public function save(array $data)
    {
        $this->repository->statusSaves[] = $data;
    }
}

final class PrequalificationStatusEntityStub
{
    public function __construct(private bool $loaded, private PrequalificationRepositoryStub $repository)
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function save(array $data): void
    {
        $this->repository->statusUpdates[] = $data;
    }
}

final class PrequalificationSectionMappingModelStub
{
    public function __construct(private PrequalificationRepositoryStub $repository)
    {
    }

    public function save(array $data)
    {
        $this->repository->sectionMappingSaveCalls[] = $data;
        $id = $this->repository->nextSectionMappingId;
        return new class($id) {
            public function __construct(private int $id)
            {
            }

            public function getId(): int
            {
                return $this->id;
            }
        };
    }

    public function load(int $id, string $field = 'id')
    {
        $this->repository->sectionMappingLoads[] = [$id, $field];
        return new PrequalificationSectionMappingEntityStub($this->repository->sectionMappingLoaded, $this->repository);
    }

    public function all(array $filters = []): array
    {
        $this->repository->sectionMappingAllCalls[] = $filters;
        return $this->repository->prequalificationSectionMappings;
    }
}

final class PrequalificationSectionMappingEntityStub
{
    public function __construct(private bool $loaded, private PrequalificationRepositoryStub $repository)
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function save(array $data): void
    {
        $this->repository->sectionMappingUpdates[] = $data;
    }
}

final class PrequalificationSectionsModelStub
{
    public function __construct(private PrequalificationRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        return $this->repository->prequalificationSections;
    }
}

final class PrequalificationSectionModelStub
{
    public function __construct(private PrequalificationRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        return $this->repository->prequalificationSectionList;
    }
}
