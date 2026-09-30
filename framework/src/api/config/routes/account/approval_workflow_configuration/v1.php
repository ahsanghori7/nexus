<?php

use Core\Data\Shape;
use Core\Middleware\Collection;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Generic;
use Core\Middleware\Procedure;
use Core\Middleware\Rest;
use Core\Router\Route\Helper;
use Core\Service\Manager;
use Api\Middleware\DocumentMiddleware;

include_once('procedure.php');
return Helper::getTemplate(
    templateName: "api",
    errors: [
        "invalidPayloads"     => Generic::exceptionResponse("HTTP/1.0 400"),
        "invalidApprovalType" => Generic::exceptionResponse("HTTP/1.0 400"),
    ],
    //Actions
    actions: [
        [
            "id" => "fetch_workflow_configuration_approval_types",
            "key" => "^(?<account_id>[0-9]+)\/approval-workflow-configuration\/approval-types$",
            "method" => "GET",
            "description" => "Fetch workflow configuration approval types for an account",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),
                function($a) {
                    $approvalTypes = Manager::getService("project")->fetch("approval-workflow-configurations/approval-types")->getShape("data")->get();
                    $a->set("approvalTypes", $approvalTypes);
                },
                Generic::set("json", fn ($shape) => json_encode([
                    "data" => $shape->get("approvalTypes"),
                    "success" => true
                ])),
            ]
        ],
        [
            "id" => "fetch_approval_workflow_configuration",
            "key" => "^(?<account_id>[0-9]+)\/approval-workflow-configuration$",
            "method" => "GET",
            "description" => "Fetch approval workflow configuration for an account",
            "middleware" => [
                Procedure::get("fetchAndValidateAccountById"),
                function($a) {
                    $type = $a->get("request_args.type");
                    $accountId = $a->get("uriArgs.account_id");

                    if(!$type) {
                        throw new MiddlewareException("invalidPayloads", "type is required");
                    }

                    $data = Manager::getService("project")
                        ->fetch("approval-workflow-configurations/{$accountId}/type/{$type}")
                        ->getShape("data")
                        ->get();

                    if (!is_array($data)) {
                        $data = [];
                    }

                    $uniqueRoleIds = [];
                    foreach ($data['approval_levels'] ?? [] as $level) {
                        foreach ($level['roles'] ?? [] as $role) {
                            $roleId = (int) (is_array($role) ? ($role['id'] ?? 0) : $role);
                            if ($roleId > 0) {
                                $uniqueRoleIds[$roleId] = true;
                            }
                        }
                        foreach ($level['conditions'] ?? [] as $condition) {
                            foreach ($condition['roles'] ?? [] as $role) {
                                $roleId = (int) (is_array($role) ? ($role['id'] ?? 0) : $role);
                                if ($roleId > 0) {
                                    $uniqueRoleIds[$roleId] = true;
                                }
                            }
                        }
                    }

                    $roleIds = $uniqueRoleIds ? implode(',', array_keys($uniqueRoleIds)) : '';
                    $accountRoles = $roleIds
                        ? Manager::getService("account")->fetch("account/account-roles", ["account_role_ids" => $roleIds])->getShape("data")->get()
                        : [];

                    $accountRolesById = [];
                    foreach ($accountRoles as $role) {
                        $accountRolesById[(int) $role['id']] = $role;
                    }

                    $mapRoleObjects = static function (array $roles, array $accountRolesById): array {
                        $mapped = [];
                        foreach ($roles as $role) {
                            $roleId = (int) (is_array($role) ? ($role['id'] ?? 0) : $role);
                            if ($roleId > 0 && isset($accountRolesById[$roleId])) {
                                $mapped[] = $accountRolesById[$roleId];
                            }
                        }
                        return $mapped;
                    };

                    foreach ($data['approval_levels'] ?? [] as $idx => $level) {
                        $data['approval_levels'][$idx]['roles'] = $mapRoleObjects($level['roles'] ?? [], $accountRolesById);
                        foreach ($level['conditions'] ?? [] as $cIdx => $condition) {
                            $data['approval_levels'][$idx]['conditions'][$cIdx]['roles'] = $mapRoleObjects(
                                $condition['roles'] ?? [],
                                $accountRolesById
                            );
                        }
                    }

                    $a->set("data", $data);
                },
                Generic::set("json", fn ($shape) => json_encode([
                    "data" => $shape->get("data"),
                    "success" => true
                ])),
            ]
        ],
        [
            "id" => "update_approval_workflow_configuration",
            "key" => "^(?<account_id>[0-9]+)\/approval-workflow-configuration$",
            "method" => "POST",
            "description" => "Update approval workflow configuration for an account",
            "middleware" => [
                Procedure::get('fetchAndValidateAccountById'),
                Procedure::get('validateApprovalType', ['type' => 'request_args.type']),
                Procedure::get('validatePayload'),
                function($shape) {
                    $request = $shape->getRoute()->getRequest();
                    $json = $request->getData()->getShape('json')->toArray();
                    $shape->set('configFlags', [
                        'allow_requester_self_approval' => $json['allow_requester_self_approval'] ?? false,
                        'consolidate_notifications' => $json['consolidate_notifications'] ?? false,
                        'auto_complete_lower_approvals' => $json['auto_complete_lower_approvals'] ?? false,
                    ]);
                    $shape->set('payload', $json['levels'] ?? []);
                },
                Collection::format(function($item, $shape) {
                    $payload = $item->get();
                    if (($payload['rule_type'] ?? null) !== 'custom') {
                        unset($payload['min_required']);
                    }
                    unset($payload['approval_type_id']);
                    return $payload;
                }, "payload"),
                Rest::write(
                    serviceId: 'project',
                    resource:'approval-workflow-configurations/{uriArgs.account_id}/type/{request_args.type}',
                    dataKey: 'payload',
                    preProcessor: function($payload, $shape) {
                        return new Shape([
                            ...$shape->get('configFlags'),
                            'levels' => $payload->getItems(),
                        ]);
                    },
                    postProcessor: function($request, $shape, $response) {
                        if ((int) $request->get('info.http_code') === 203) {
                            return;
                        }
                        $content = json_decode((string) $request->get('content'), true);
                        throw new MiddlewareException(
                            "invalidPayloads",
                            $content['error']['description']
                                ?? $content['message']
                                ?? "Failed to save approval workflow configuration"
                        );
                    }
                ),
                Generic::set("json", fn ($shape) => json_encode([
                    "success" => true
                ])),
            ]
        ],
        [
            "id" => "fetch_approvers_with_level_and_roles",
            "key" => "^(?<account_id>[0-9]+)\/approvers$",
            "method" => "GET",
            "description" => "Fetch approvers of mutli level approver level-wise and role-wise depending on project group.",
            "middleware" => [
                Procedure::get('fetchAndValidateAccountById'),
                Procedure::get('validateApprovalType', ['type' => 'request_args.approval_type']),
                function ($a) {
                    if ($a->get('request_args.approval_type') === 'order')
                    {
                        return DocumentMiddleware::fetchDocument('id', 'request_args.id')($a);
                    }
                    elseif($a->get('request_args.approval_type') === 'tender_recommendation')
                    {
                        return Procedure::get('fetchAndValidateTransactionById')($a);
                    }
                },
                function ($a) {
                    $accountId = $a->get('uriArgs.account_id');
                    $approval_type = $a->get('request_args.approval_type');
                    $id = $a->get('request_args.id');
                    $orderValue = null;

                    if($approval_type == 'order')
                    {
                        if($a->get("document")->first()->get('meta') != '')
                        {
                            $meta = json_decode($a->get("document")->first()->get('meta'), true);
                            $orderValue = ((int)$meta['values']['order_value'])/100;
                            $pid = $meta['quote']['tender']['project_id'];
                        }
                        else
                        {
                            throw new MiddlewareException("invalidPayloads", "The document with id " . $id . " does not have meta information.");
                        }

                    }
                    elseif($approval_type == 'tender_recommendation')
                    {

                        $transaction = Manager::getService("project")->fetch(sprintf("transaction/%s", $id))->getShape('data')->toArray();
                        if(count($transaction) > 0)
                        {
                            $orderValue = ((int) $transaction[0]['price'])/100;
                            $pid = $transaction[0]['tender']['project_id'];
                        }
                        else
                        {
                            throw new MiddlewareException("invalidPayloads", "The tender with id " . $id . " does not have information.");
                        }

                    }
                    elseif($approval_type == 'supplier_list')
                    {
                        if(!$a->get('request_args.project_id')){
                            throw new MiddlewareException("invalidPayloads", "Project id is required for supplier list approval type.");
                        }
                        $pid = (int) $a->get('request_args.project_id');
                    }
                    elseif($approval_type == 'tender_enquiry')
                    {
                        if(!$a->get('request_args.project_id')){
                            throw new MiddlewareException("invalidPayloads", "Project id is required for tender enquiry approval type.");
                        }
                        $pid = (int) $a->get('request_args.project_id');
                    }
                    else
                    {
                        throw new MiddlewareException("invalidApprovalType", "The approval type " . $approval_type . " is invalid. Valid approval types are order, tender_recommendation, supplier_list and tender_enquiry.");
                    }
                    $approvalLevelRolesResponse = Manager::getService("project")
                    ->fetch("approval-workflow-configurations/{$accountId}/account_roles/{$approval_type}")
                    ->getShape("data")
                    ->toArray();

                    $config = $approvalLevelRolesResponse['config'] ?? [];
                    $approval_level_account_roles = $approvalLevelRolesResponse['rules'] ?? [];

                    if(empty($approval_level_account_roles)){
                        throw new MiddlewareException("invalidPayloads", "No approval level account roles found for the approval type " . $approval_type);
                    }

                    $res = [];
                    $project_group = null;

                    $group_assigned_to_project= Manager::getService("project")
                        ->fetch("/project/{$pid}/account-group-mapping")
                        ->getShape("data")
                        ->toArray();


                    if($group_assigned_to_project) {
                            $project_group = (int) $group_assigned_to_project[0]['account_group_id'];
                    }

                    $loginUserId = (int) $a->get('user.id');
                    $allowSelfApproval = (bool) ($config['allow_requester_self_approval'] ?? false);
                    $autoCompleteLowerApprovals = (bool) ($config['auto_complete_lower_approvals'] ?? false);

                    $requesterAccountRoles = Manager::getService("account")
                        ->fetch("user/{$loginUserId}/account-roles")
                        ->getShape("data")
                        ->toArray();

                    $requesterAccountRoleId = null;
                    if (!empty($requesterAccountRoles)) {
                        $requesterAccountRoleId = (int) $requesterAccountRoles[0]['account_role_id'];
                    }

                    $resolveRolesWithUsers = function (array $accountRoleIds, array $higherRoleIds = []) use ($accountId, $project_group, $loginUserId) {
                        $roles = [];
                        foreach ($accountRoleIds as $accountRoleId) {
                            $url = "account/{$accountId}/account_role_users/{$accountRoleId}";

                            if (!empty($project_group)) {
                                $queryParams['project_group_id'] = $project_group;
                                $url .= '?' . http_build_query($queryParams);
                            }

                            $role = Manager::getService("account")
                                ->fetch($url)
                                ->getShape("data")
                                ->toArray();

                            if (!empty($role)) {
                                $roles[] = [
                                    'id' => (int) $role['id'],
                                    'name' => $role['label'] ?? null,
                                    'is_satisfied_by_self_approved' => false,
                                    'is_satisfied_by_higher_authority' => false,
                                    'is_higher_condition_role' => in_array((int) $role['id'], $higherRoleIds, true),
                                    'users' => $role['users'] ?? [],
                                ];
                            }
                        }
                        return $roles;
                    };

                    $applySelfApproval = function (array &$level) use ($allowSelfApproval, $requesterAccountRoleId) {
                        if (!$allowSelfApproval || $requesterAccountRoleId === null) {
                            return;
                        }

                        foreach ($level['roles'] as &$role) {
                            if ($role['id'] !== $requesterAccountRoleId) {
                                continue;
                            }

                            $singleApprovalNeeded = $level['rule'] === 'any'
                                || ($level['rule'] === 'custom' && $level['min_required'] === 1)
                                || ($level['rule'] === 'all' && count($level['roles']) === 1);

                            if (!$role['is_higher_condition_role']){
                                if ($singleApprovalNeeded) {
                                    $level['is_level_satisfied_by_self_approved'] = true;
                                } else {
                                    $role['is_satisfied_by_self_approved'] = true;
                                }
                            }
                            break;
                        }
                        unset($role);
                    };

                    $applyHigherAuthority = function (array &$level) use ($requesterAccountRoleId, $allowSelfApproval) {
                        if (!$allowSelfApproval || $requesterAccountRoleId === null) {
                            return;
                        }

                        foreach ($level['roles'] as &$role) {
                            if (!$role['is_higher_condition_role'] || $role['id'] !== $requesterAccountRoleId) {
                                continue;
                            }

                            $singleApprovalNeeded = $level['rule'] === 'any'
                                || ($level['rule'] === 'custom' && $level['min_required'] === 1)
                                || ($level['rule'] === 'all' && count($level['roles']) === 1);

                            if ($singleApprovalNeeded) {
                                if (!$level['is_level_satisfied_by_self_approved']) {
                                    $level['is_level_satisfied_by_higher_authority'] = true;
                                }
                            } else {
                                if (!$role['is_satisfied_by_self_approved']) {
                                    $role['is_satisfied_by_higher_authority'] = true;
                                }
                            }
                            break;
                        }
                        unset($role);
                    };

                    $buildLevelEntry = function (array $rule, string $ruleStatement, array $roleIds, array $higherRoleIds = []) use ($resolveRolesWithUsers, $applySelfApproval, $applyHigherAuthority): array {
                        $ruleType = $rule['rule_type'] ?? null;
                        $minRequired = $ruleType === 'custom' ? (int) ($rule['min_required'] ?? 0) : 0;

                        $level = [
                            'level' => $rule['level_sort_order'] ?? $rule['sort_order'],
                            'approval_level_id' => $rule['approval_level_id'] ?? 0,
                            'label' => $rule['label'] ?? null,
                            'is_level_satisfied_by_self_approved' => false,
                            'is_level_satisfied_by_higher_authority' => false,
                            'rule' => $ruleType,
                            'is_threshold' => ($rule['is_threshold'] ?? 0),
                            'min_required' => $minRequired,
                            'rule_description' => $ruleStatement,
                            'roles' => $resolveRolesWithUsers($roleIds, $higherRoleIds),
                        ];

                        $applySelfApproval($level);
                        $applyHigherAuthority($level);

                        return $level;
                    };

                    $thresholdMatchesByLevel = [];
                    $thresholdRulesByLevel = [];
                    $fixedLevelNumbers = [];

                    $buildRuleStatement = function (array $rule): string {
                        switch ($rule['rule_type']) {
                            case 'all':
                                return "All must approve";
                            case 'any':
                                return "Anyone can approve";
                            case 'custom':
                                return "Any {$rule['min_required']} from " . count($rule['roles']) . " must approve";
                            default:
                                return "Unknown";
                        }
                    };

                    $isThresholdMatch = function (array $rule) use ($orderValue): bool {
                        $fromValue = $rule['from_value'] ?? null;
                        $toValue = $rule['to_value'] ?? null;
                        $isMatch = false;
                        switch ($rule['threshold_type']) {
                            case 'between':
                                $isMatch = $fromValue !== null && $toValue !== null && $orderValue >= $fromValue && $orderValue <= $toValue;
                                break;
                            case 'less_than_equal':
                                $isMatch = $toValue !== null && $orderValue <= $toValue;
                                break;
                            case 'greater_than_equal':
                                $isMatch = $fromValue !== null && $orderValue >= $fromValue;
                                break;
                            default:
                                $isMatch = false;
                        }
                        return $isMatch;
                    };

                    foreach ($approval_level_account_roles as $rule) {
                        $approvalLevelId = $rule['approval_level_id'] ?? $rule['id'];
                        $rule_statement = $buildRuleStatement($rule);

                        if ($rule['is_threshold'] == 0) {
                            $fixedLevelNumbers[$rule['level_sort_order'] ?? $rule['sort_order']] = true;
                            $res[] = $buildLevelEntry($rule, $rule_statement, $rule['roles']);
                            continue;
                        }

                        $thresholdRulesByLevel[$approvalLevelId][] = $rule;

                        if ($isThresholdMatch($rule)) {
                            $thresholdMatchesByLevel[$approvalLevelId][] = $rule;
                        }
                    }

                    foreach ($thresholdMatchesByLevel as $approvalLevelId => $matches) {
                        usort($matches, fn ($a, $b) => ($a['sort_order'] ?? 0) <=> ($b['sort_order'] ?? 0));
                        $primaryRule = $matches[0] ?? null;
                        if (!$primaryRule) {
                            continue;
                        }

                        $primaryRoleIds = $primaryRule['roles'] ?? [];
                        $allowHigher = (bool) ($primaryRule['allow_higher_level_approval'] ?? false);
                        $primarySort = (int) ($primaryRule['sort_order'] ?? 0);

                        $higherRoleIds = [];
                        if ($allowHigher) {
                            foreach (($thresholdRulesByLevel[$approvalLevelId] ?? []) as $candidateRule) {
                                $candidateSort = (int) ($candidateRule['sort_order'] ?? 0);
                                if ($candidateSort > $primarySort) {
                                    $higherRoleIds = array_merge($higherRoleIds, $candidateRule['roles'] ?? []);
                                }
                            }
                        }

                        $roleIds = array_values(array_unique(array_merge($primaryRoleIds, $higherRoleIds)));
                        $higherOnlyRoleIds = array_values(array_diff(array_unique($higherRoleIds), $primaryRoleIds));
                        $ruleStatement = $buildRuleStatement(array_merge($primaryRule, ['roles' => $roleIds]));
                        $res[] = $buildLevelEntry($primaryRule, $ruleStatement, $roleIds, $higherOnlyRoleIds);
                    }

                    if (empty($res)) {
                        throw new MiddlewareException(
                            "invalidPayloads",
                            "No valid approval condition exists."
                        );
                    }

                    usort($res, fn($a, $b) => $a['level'] <=> $b['level']);

                    if ($autoCompleteLowerApprovals && $requesterAccountRoleId !== null) {
                        $requesterLevel = null;
                        foreach ($res as $levelEntry) {
                            if (isset($fixedLevelNumbers[$levelEntry['level']])) {
                                continue;
                            }
                            foreach ($levelEntry['roles'] as $role) {
                                if ($role['id'] === $requesterAccountRoleId) {
                                    $requesterLevel = $requesterLevel === null
                                        ? $levelEntry['level']
                                        : max($requesterLevel, $levelEntry['level']);
                                    break;
                                }
                            }
                        }

                        if ($requesterLevel !== null) {
                            foreach ($res as &$levelEntry) {
                                if ($levelEntry['level'] < $requesterLevel && !$levelEntry['is_level_satisfied_by_self_approved']) {
                                    $levelEntry['is_level_satisfied_by_higher_authority'] = true;

                                    array_walk($levelEntry['roles'], function (&$role) {
                                        $role['is_satisfied_by_self_approved'] = false;
                                        $role['is_satisfied_by_higher_authority'] = false;
                                    });
                                }
                            }
                            unset($levelEntry);
                        }
                    }

                    $a->set("data", [
                        "allow_requester_self_approval" => (bool) ($config['allow_requester_self_approval'] ?? false),
                        "consolidate_notifications" => (bool) ($config['consolidate_notifications'] ?? false),
                        "auto_complete_lower_approvals" => (bool) ($config['auto_complete_lower_approvals'] ?? false),
                        "levels" => $res,
                    ]);
                },
                Generic::set("json", fn ($a) => json_encode(
                    $a->get("data")
                )),
            ]
        ],

    ]
);
