<?php

declare(strict_types=1);

namespace Tests\TestDoubles;

class FakeCollection
{
    /** @var array<int, mixed> */
    private array $items;

    public function __construct(array $items)
    {
        $this->items = $items;
    }

    public function toArray(): array
    {
        return $this->items;
    }

    public function first(): FakeRecord
    {
        return new FakeRecord($this->items[0] ?? []);
    }
}

class FakeRecord
{
    /** @var array<string, mixed> */
    private array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function toArray(): array
    {
        return $this->data;
    }

    public function getId(): int
    {
        return (int) ($this->data['id'] ?? 0);
    }
}
