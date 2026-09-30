<?php

namespace Api\Middleware;

use App\Domain\Account\Manage;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;

class ApprovalMiddleware{

    /**
     * @param string $approvalIdKey
     * @param string $resultKey
     * @return \Closure
     *
     * Usage:
     * $action->get('approval')
     */
    public static function fetchApproval(string $approvalIdKey = "uriArgs.approver_id", string $resultKey = 'approval'): \Closure
    {
        return function (Shape $action) use ($approvalIdKey, $resultKey) {
            try {
                return Rest::fetchDynamic(
                    "project",
                    sprintf("approvals/{%s}", $approvalIdKey),
                    [],
                    $resultKey,
                    postProcessor: function ($res, $a) use ($resultKey) {
                        if ($res->getCollection("data")->count() > 0) {
                            $dataShape = $res->getShape("data");

                            $a->set($resultKey, $dataShape);
                        } else {
                            throw new MiddlewareException("noEntityFound", "Action cannot be completed. The request has been withdrawn and no approval exists.");
                        }
                    })($action);
            } catch (\Exception $e) {
                throw new MiddlewareException("noEntityFound", $e->getMessage());
            }
        };
    }

    /**
     * @param string $trIdKey
     * @param string $resultKey
     * @return \Closure
     *
     * Usage:
     * $action->get('approvals')
     */
    public static function fetchApprovalsList(string $entityKey = "approval_workflow_entity", string $resultKey = 'approvals'): \Closure
    {
        return function (Shape $action) use ($entityKey, $resultKey) {
            try {
                $entity = $action->get($entityKey);
                $payloadData = [
                    'entity_type' => $entity['entity_type'],
                    'entity_id' => $entity['entity_id']
                ];
                $res = Manager::getService("project")->fetch(
                    "approvals",
                    $payloadData
                )->getShape('data');

                return $action->set($resultKey, $res);
            } catch (\Exception $e) {
                throw new MiddlewareException("EndpointFetchFailure", $e->getMessage());
            }
        };
    }

    /**
     * @param string $tIIdKey
     * @param string $resultKey
     * @return \Closure
     *
     * Usage:
     * $action->get('approvals')
     */
    public static function fetchInquiryApprovalsList(string $tIIdKey = "ti_id", string $resultKey = 'approvals'): \Closure
    {
        return function (Shape $action) use ($tIIdKey, $resultKey) {
            try {
                $payloadData = [
                    'entity_type' => 'document',
                    'entity_id' => $action->get($tIIdKey)
                ];
                $res = Manager::getService("project")->fetch(
                    "approvals",
                    $payloadData
                )->getShape('data');

                return $action->set($resultKey, $res);
            } catch (\Exception $e) {
                throw new MiddlewareException("EndpointFetchFailure", $e->getMessage());
            }
        };
    }

    /**
     * @param string $payloadKey
     * @return \Closure
     *
     */
    public static function saveApprovalLevelWorkflow(string $payloadKey = "payload"): \Closure
    {
        return function (Shape $action) use ($payloadKey) {
             try {
                $payload = $action->get($payloadKey);
                $res = Manager::getService("project")->write(
                    "approval-workflow-process",
                    new Shape(['data' => $payload])
                );
                return $action->set("save_approval_level_workflow_response", json_decode($res->get('content'), true));

            } catch (\Exception $e) {
                throw new MiddlewareException("badRequest", $e->getMessage());
            }
        };
    }

    /**
     * @param string $entityKey
     * @return \Closure
     *
     */
    public static function removeApprovalLevelWorkflowByEntity(string $entityKey = "approval_workflow_entity"): \Closure
    {
        return function (Shape $action) use ($entityKey) {
             try {
                $entity = $action->get($entityKey);
                return Manager::getService("project")->delete(
                    sprintf("approval-workflow-process/%s/%s", $entity['entity_type'], $entity['entity_id'])
                );

            } catch (\Exception $e) {
                throw new MiddlewareException("badRequest", $e->getMessage());
            }
        };
    }

    /**
     * @param string $entityKey
     * @return \Closure
     *
     */
    public static function fetchApprovalLevelWorkflowByEntity(string $entityKey = "approval_workflow_entity", string $resultKey = "approval_workflows"): \Closure
    {
        return function (Shape $action) use ($entityKey, $resultKey) {
            try {
                $entity = $action->get($entityKey);
                $res = Manager::getService("project")->fetch(
                    sprintf("approval-workflow-process/%s/%s", $entity['entity_type'], $entity['entity_id']))
                    ->getShape('data');
                return $action->set($resultKey, $res);
            } catch (\Exception $e) {
                throw new MiddlewareException("badRequest", $e->getMessage());
            }
        };
    }

    /**
     * @param string $idsKey
     * @return \Closure
     *
     * Usage:
     * $action->get('approval_levels_by_type')
     */
    public static function fetchApprovalLevelsByType(string $typeKey = "approval_type", string $resultKey = 'approval_levels_by_type'): \Closure
    {
        return function (Shape $action) use ($typeKey, $resultKey) {
             try {
                $type = $action->get($typeKey);
                $res = Manager::getService("project")->fetch(
                    sprintf("approval-workflow-configurations/%d/type/%s", $action->get('user.account_id'), $type)
                )->getShape('data');

                return $action->set($resultKey, $res);
            } catch (\Exception $e) {
                throw new MiddlewareException("EndpointFetchFailure", $e->getMessage());
            }
        };
    }

    /**
     * @param array $approvalLevels
     * @param string $approvalType
     * @param int $accountId
     * @param int|null $orderValue Raw value (in minor units) used to match approval_level_condition ranges; divided by 100 internally.
     * @return array
     */
    public static function mergeThresholdRoles(
        array $approvalLevels,
        string $approvalType,
        int $accountId,
        ?int $orderValue = null
    ): array {
        $isThreshold = static fn ($level): bool => (int) ($level['is_threshold'] ?? 0) === 1;

        if (!array_filter($approvalLevels, $isThreshold)) {
            return $approvalLevels;
        }

        if ($orderValue === null) {
            throw new MiddlewareException(
                'invalidPayloads',
                'Order value is required to resolve threshold approval levels.'
            );
        }

        $orderValue = $orderValue / 100;
        try {
            $rows = Manager::getService("project")
                ->fetch(sprintf("approval-workflow-configurations/%d/type/%s/order-by-sorting", $accountId, $approvalType))
                ->getShape('data')
                ->get();
        } catch (\Exception $e) {
            throw new MiddlewareException('EndpointFetchFailure', $e->getMessage());
        }

        $conditionsByLevel = [];
        foreach ($rows as $row) {
            $levelId = (int) ($row['id'] ?? 0);
            $conditionId = (int) ($row['condition_id'] ?? 0);
            $level = $approvalLevels[$levelId] ?? null;
            if ($conditionId <= 0 || $level === null || !$isThreshold($level)) {
                continue;
            }

            $conditionsByLevel[$levelId][$conditionId] ??= [
                'threshold_type' => $row['threshold_type'] ?? null,
                'from_value' => isset($row['from_value']) && $row['from_value'] !== '' ? (float) $row['from_value'] : null,
                'to_value' => isset($row['to_value']) && $row['to_value'] !== '' ? (float) $row['to_value'] : null,
                'sort_order' => (int) ($row['condition_sort_order'] ?? 0),
                'allow_higher_level_approval' => (bool) ($row['allow_higher_level_approval'] ?? false),
                'roles' => [],
            ];

            if (!empty($row['condition_account_role_id'])) {
                $rid = (int) $row['condition_account_role_id'];
                $conditionsByLevel[$levelId][$conditionId]['roles'][$rid] = $rid;
            }
        }

        foreach ($approvalLevels as $levelId => $level) {
            if (!$isThreshold($level)) {
                continue;
            }

            $conditions = array_values($conditionsByLevel[(int) $levelId] ?? []);
            usort($conditions, static fn ($a, $b) => $a['sort_order'] <=> $b['sort_order']);

            $primary = null;
            $higherRoles = [];
            foreach ($conditions as $cond) {
                if ($primary !== null) {
                    $higherRoles[] = array_values($cond['roles']);
                    continue;
                }
                if (self::thresholdConditionMatches($cond, $orderValue)) {
                    $primary = $cond;
                }
            }

            if ($primary === null) {
                $label = $level['label'] ?? '';
                $descriptor = $label !== '' ? $label : sprintf('approval level #%d', (int) $levelId);
                throw new MiddlewareException(
                    'invalidPayloads',
                    sprintf('No valid approval condition exists for %s (order value %s).', $descriptor, $orderValue)
                );
            }

            $roleIds = array_values($primary['roles']);
            if ($primary['allow_higher_level_approval'] && $higherRoles) {
                $roleIds = array_merge($roleIds, ...$higherRoles);
            }

            $roleIds = array_values(array_unique($roleIds));
            $approvalLevels[$levelId]['roles'] = $roleIds;
            $approvalLevels[$levelId]['account_role_id'] = $roleIds[0] ?? null;
        }

        return $approvalLevels;
    }

    /**
     * Index approval level config rows by level id from approval-workflow-configurations `data`.
     *
     * @param mixed $configurations
     * @param array<int> $levelIds
     * @return array<int, array<string, mixed>>
     */
    public static function mapApprovalLevelsById($configurations, array $levelIds = []): array
    {
        if (!is_array($configurations)) {
            $configurations = [];
        }

        $configuredLevels = $configurations['approval_levels'] ?? null;
        if (!is_array($configuredLevels)) {
            $configuredLevels = array_values(array_filter(
                $configurations,
                static fn ($conf) => is_array($conf) && isset($conf['id'])
            ));
        }

        $levelsById = [];
        foreach ($configuredLevels as $conf) {
            if (!is_array($conf) || !isset($conf['id'])) {
                continue;
            }
            $id = (int) $conf['id'];
            if ($levelIds !== [] && !in_array($id, $levelIds, true)) {
                continue;
            }
            if (isset($conf['roles']) && is_array($conf['roles'])) {
                $conf['roles'] = array_values(array_unique(array_filter(array_map(
                    static fn ($role) => (int) (is_array($role) ? ($role['id'] ?? 0) : $role),
                    $conf['roles']
                ))));
            }
            $levelsById[$id] = $conf;
        }

        return $levelsById;
    }

    /**
     * Apply cross-level cascade updates from planCrossLevelCascades().
     *
     * @param array{
     *   actions: array<int, array{workflow_id: int, approval_id: int, level_complete: bool}>,
     *   remaining_pending: array<int, array<string, mixed>>
     * } $cascadePlan
     * @param string $approvalEntity `approvals` (SL/TR) or `order_approver` (Order)
     * @return array<int, array<string, mixed>>
     */
    public static function applyCrossLevelCascadePlan(array $cascadePlan, string $approvalEntity = 'approvals'): array
    {
        $approvedTypeId = null;

        foreach ($cascadePlan['actions'] as $cascade) {
            if ($approvalEntity === 'order_approver') {
                if ($approvedTypeId === null) {
                    $approvedTypeId = Manager::getService("project")
                        ->fetch("order_approver/type")
                        ->getCollection('data')
                        ->filterByField('label', 'Approved')
                        ->first()
                        ->get('id');
                }
                Manager::getService("project")->update(
                    "order_approver/{$cascade['approval_id']}",
                    new Shape(['data' => ['status_id' => $approvedTypeId]])
                );
            } else {
                Manager::getService("project")->update(
                    "approvals/{$cascade['approval_id']}",
                    new Shape(['data' => ['status' => 'Approved']])
                );
            }

            if (!empty($cascade['level_complete'])) {
                Manager::getService("project")->update(
                    sprintf("approval-workflow-process/workflow/%s", $cascade['workflow_id']),
                    new Shape(['data' => ['status' => 'completed']])
                );
            }
        }

        return $cascadePlan['remaining_pending'];
    }

    /**
     * @param array{threshold_type?: string|null, from_value?: float|null, to_value?: float|null} $condition
     */
    private static function thresholdConditionMatches(array $condition, float $orderValue): bool
    {
        $fromValue = $condition['from_value'] ?? null;
        $toValue = $condition['to_value'] ?? null;

        $matches = match ($condition['threshold_type'] ?? null) {
            'between' => $fromValue !== null && $toValue !== null
                && $orderValue >= $fromValue && $orderValue <= $toValue,
            'less_than_equal' => $toValue !== null && $orderValue <= $toValue,
            'greater_than_equal' => $fromValue !== null && $orderValue >= $fromValue,
            default => false,
        };

        return $matches;
    }

    /**
     * @param string $entityKey
     * @return \Closure
     *
     */
    public static function removeApprovalsByEntity(string $entityKey = "approval_workflow_entity"): \Closure
    {
        return function (Shape $action) use ($entityKey) {
             try {
                $entity = $action->get($entityKey);
                return Manager::getService("project")->delete(
                    sprintf("approvals/bulk/%s/%s", $entity['entity_type'], $entity['entity_id'])
                );

            } catch (\Exception $e) {
                throw new MiddlewareException("badRequest", $e->getMessage());
            }
        };
    }

}
