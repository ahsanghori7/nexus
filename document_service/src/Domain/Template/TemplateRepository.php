<?php

declare(strict_types=1);

namespace App\Domain\Template;

use App\Domain\AbstractRepository;

/**
 * Class DocumentRepository
 * @package App\Domain\Document
 */
class TemplateRepository extends AbstractRepository {

    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "template";

    /**
     * @var string[]
     */
    protected $models = [
        "template" => Template::class,
        "type" => TemplateType::class,
        "mapping"  => TemplateMapping::class
    ];
}
