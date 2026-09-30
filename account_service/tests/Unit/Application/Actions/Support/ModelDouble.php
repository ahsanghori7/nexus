<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Support;

use App\Domain\AbstractModel;

/**
 * Minimal model double avoiding persistence side-effects.
 */
final class ModelDouble extends AbstractModel
{
    private bool $loaded = false;
    private array $records;
    private int $count;

    public array $allCalls = [];
    public array $loadIds = [];
    public array $savedPayloads = [];
    public array $deletedIds = [];
    public array $findAllCalls = [];

    public function __construct(array $records, ?int $count = null)
    {
        $this->records = $records;
        $this->count = $count ?? count($records);
    }

    public function getCount(array $where = []): int
    {
        return $this->count;
    }

    public function all(array $filters = []): array
    {
        $this->allCalls[] = $filters;
        return $this->records;
    }

    public function findAll(array $filters = [], int $limit = 0, int $offset = 0, bool $assoc_array = false): array
    {
        $this->findAllCalls[] = [
            'filters' => $filters,
            'limit' => $limit,
            'offset' => $offset,
        ];

        $slice = $this->records;
        if ($offset > 0) {
            $slice = array_slice($slice, $offset);
        }
        if ($limit > 0) {
            $slice = array_slice($slice, 0, $limit);
        }

        return $slice;
    }

    public function load($id, $idField = self::ID_FIELD)
    {
        $this->loadIds[] = $id;
        $this->loaded = array_key_exists($id, $this->records);
        $this->data = $this->records[$id] ?? [];
        if ($this->loaded) {
            $this->data[$idField] = $this->data[$idField] ?? $id;
        }

        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function setLoaded(bool $loaded): void
    {
        $this->loaded = $loaded;
    }

    public function save(array $data, $insertOnly = false)
    {
        $this->savedPayloads[] = $data;
        return $this;
    }

    public function delete($id)
    {
        $this->deletedIds[] = $id;
    }
}
