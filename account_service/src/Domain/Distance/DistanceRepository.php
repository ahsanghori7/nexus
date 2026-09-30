<?php

declare(strict_types=1);

namespace App\Domain\Distance;

use App\Domain\AbstractRepository;

use App\Domain\Distance\Distance;

/**
 * Class DistanceRepository
 * @package App\Domain\Distance
 */
class DistanceRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "distance";

    /**
     * @var string[]
     */
    protected $models = [
        "distance" => Distance::class,
    ];
}
