<?php

declare(strict_types=1);

namespace Tests\TestDoubles;

use App\Domain\Project\ProjectRepository;

class StubProjectRepository extends ProjectRepository
{
    /** @var array<string, object> */
    private array $modelMap = [];

    public function setModel(string $name, object $model): void
    {
        $this->modelMap[$name] = $model;
    }

    public function getModel(string $name = "")
    {
        $key = $name ?: static::DEFAULT_MODEL;
        if (!array_key_exists($key, $this->modelMap)) {
            throw new \RuntimeException(sprintf('Model %s not stubbed', $key));
        }

        return $this->modelMap[$key];
    }

    public function createProjectMapping(array $data): void
    {
        $this->modelMap['projectOwnerMapping']->create($data);
    }
}
