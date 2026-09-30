<?php

declare(strict_types=1);

namespace App\Domain\Milestone;

use App\Domain\AbstractRepository;

class MilestoneRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "milestone";

    /**
     * @var string[]
     */
    protected $models = [
        "milestone" => Milestone::class,
        "packageMilestone" => PackageMilestone::class,
        "accountMilestoneMapping" => AccountMilestoneMapping::class,
        "packageMilestoneStatus" => PackageMilestoneStatus::class,
    ];

}
