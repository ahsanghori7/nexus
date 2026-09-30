<?php

declare(strict_types=1);

namespace App\Domain\OrderApprover;

use App\Domain\AbstractRepository;

/**
 * Class ProjectRepository
 * @package App\Domain\Project
 */
class OrderApproverRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "orderApprover";

    /**
     * @var string[]
     */
    protected $models = [
        "orderApprover" => OrderApprover::class,
        "orderApproverStatus" => OrderApproverStatus::class,
        "orderLog" => OrderLog::class,
    ];

}
