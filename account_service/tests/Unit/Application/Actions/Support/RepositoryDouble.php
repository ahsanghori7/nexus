<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Support;

final class RepositoryDouble
{
    public array $findAllCalls = [];

    public function __construct(private ModelDouble $model, private array $records)
    {
    }

    public function getModel(?string $type = null): ModelDouble
    {
        return $this->model;
    }

    public function findAll(array $filters, int $limit, int $offset): array
    {
        $this->findAllCalls[] = [
            'filters' => $filters,
            'limit' => $limit,
            'offset' => $offset,
        ];

        return $this->records;
    }

    public function create(array $payload): int
    {
        $this->model->save($payload);
        return 123;
    }
}
