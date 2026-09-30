<?php

declare(strict_types=1);

namespace App\Domain\Approval;

use App\Domain\AbstractRepository;

class ApprovalRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "approval";

    /**
     * @var string[]
     */
    protected $models = [
        "approval" => Approval::class,
        "approvalStatus" => ApprovalStatus::class,
        "approvalLevelWorkflow" => ApprovalLevelWorkflow::class
    ];

}
