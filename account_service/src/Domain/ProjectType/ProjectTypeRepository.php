<?php

declare(strict_types=1);

namespace App\Domain\ProjectType;

use App\Domain\AbstractRepository;

use App\Domain\ProjectType\ProjectType;
use App\Domain\ProjectType\ProjectTypeMapping;

/**
 * Class ProjectTypeRepository
 * @package App\Domain\ProjectType
 */
class ProjectTypeRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "projecttype";

    /**
     * @var string[]
     */
    protected $models = [
        "projecttype"        => ProjectType::class,
        "projecttypeMapping" => ProjectTypeMapping::class,
    ];
}
