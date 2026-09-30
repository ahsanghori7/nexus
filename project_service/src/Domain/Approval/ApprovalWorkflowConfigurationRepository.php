<?php

declare(strict_types=1);

namespace App\Domain\Approval;

use App\Domain\AbstractRepository;

class ApprovalWorkflowConfigurationRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "approvalLevel";

    /**
     * @var string[]
     */
    protected $models = [
        "approvalLevel" => ApprovalLevel::class,
        "approvalType" => ApprovalType::class,
        "approvalLevelAccountRoleMapping" => ApprovalLevelAccountRoleMapping::class,
        "approvalLevelCondition" => ApprovalLevelCondition::class,
        "approvalConditionAccountRoleMapping" => ApprovalConditionAccountRoleMapping::class,
        "approvalLevelWorkflow" => ApprovalLevelWorkflow::class,
        "approvalConfiguration" => ApprovalConfiguration::class,
    ];

}
