<?php

namespace App\Models\Document;

use App\Models\User;
use \App\Models\Collection as MainCollection;

class Collection extends MainCollection
{
    /**
     * @var array
     */
    protected array $items = [];

    /**
     * @param User $user
     * @return MainCollection
     */
    public function filterByOwnership(User $user): MainCollection
    {
        return $this->filter(function($d) use ($user) {
            return $d->isOwner($user);
        });
    }

    /**
     * @param User $user
     * @return MainCollection
     */
    public function hideByOwnership(User $user): MainCollection
    {
        return $this->filter(function($d) use ($user) {
            return $d->isHidden($user);
        });
    }

    /**
     * @param array $items
     * @return Collection
     */
    public function getNewCollection(array $items): Collection
    {
        return new self(
            $items,
            $this->collectionModel
        );
    }
}
