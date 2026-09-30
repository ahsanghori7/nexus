<?php

namespace Api\Middleware;

use Closure;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Rest;

class PermissionMiddlerware
{
    public static function getPermissions(string $returnKey = 'permissions'): Closure
    {
        return function ($action) use ($returnKey) {
            try {
                $client = Manager::getService('account');
                $data = $client->fetch("permissions")->getCollection('data');

                $action->set($returnKey, $data);

            } catch (\Exception $e) {
                throw new MiddlewareException("GenericError", $e->getMessage());
            }
        };
    }


    public static function getPermissionMappings(string $userIdKey, string $returnKey = 'permission_mappings'): Closure
    {
        return function ($action) use ($userIdKey, $returnKey) {
            $userId = $action->get($userIdKey);
            try {
                $client = Manager::getService('account');
                $data = $client->fetch(sprintf("permissions/user/%s", $userId))->getCollection('data');

                $action->set($returnKey, $data);

            } catch (\Exception $e) {
                throw new MiddlewareException("GenericError", $e->getMessage());
            }
        };
    }


    public static function updateTRUserPermission(string $type = 'create'): Closure
    {
        return function ($action) use ($type) {
            try {
                $trPermission = $action->get('permissions')->filterByField('key', 'tender_recommendation')->first();
                $action->set('tr_permission', $trPermission);
                $trUserPermissions = $action->get('permission_mappings');
                $permissionId = $trUserPermissions->filterByField('permission_id', $trPermission->get('id'));
                if (count($permissionId) > 0 && $action->get('requestData.tender_recommendation') === false) {
                    $action->set('permission_data', $permissionId->first());
                    Rest::delete(
                        'account',
                        "permissions/user/{user_id}/{permission_data.permission_id}"
                    )($action);
                } elseif (count($permissionId) === 0 && $action->get('requestData.tender_recommendation') === true) {
                    $action->set('payload', new Shape([
                        'user_id' => $action->get('user_id'),
                        'permission_id' => $action->get('tr_permission.id'),
                    ]));
                    Rest::write(
                        'account',
                        "permissions/user",
                        function ($payload, $a) {
                            $payload = $a->get("payload");
                            return $payload;
                        },
                        'payload'
                    )($action);
                }

            } catch (\Exception $e) {
                throw new MiddlewareException("GenericError", $e->getMessage());
            }
        };
    }

    public static function updateTAUserPermission(string $type = 'create'): Closure
    {
        return function ($action) use ($type) {
            try {
                $userId = $action->get('user_id');
                $taUserPermissions = Manager::getService("account")
                    ->fetch("permissions/permission_key",
                        [
                            'user_id' => $userId,
                            'permission_key' => 'tender_inquiry_approval',
                        ]
                    )
                    ->getShape("data")
                    ->toArray();

                $hasPermission = !empty($taUserPermissions);

                if ($hasPermission) {
                    $result = reset($taUserPermissions);
                    $taPermission = [
                        'id' => $result['permission_id'],
                        'key' => $result['permission_key'],
                    ];
                } else {
                    $masterPermission = Manager::getService("account")
                        ->fetch("permissions/permission_key",
                            [
                                'permission_key' => 'tender_inquiry_approval',
                            ]
                        )
                        ->getShape("data")
                        ->toArray();

                    $result = reset($masterPermission);
                    $taPermission = [
                        'id' => $result['id'],
                        'key' => $result['permission_key'] ?? 'tender_inquiry_approval',
                    ];
                }

                $action->set('ta_permission', $taPermission);

                if ($hasPermission && $action->get('requestData.tender_inquiry_approval') === false) {
                    // User has permission but wants to remove it
                    $permissionData = $taUserPermissions[0];
                    $action->set('permission_data', $permissionData);

                    Rest::delete(
                        'account',
                        "permissions/user/{user_id}/{permission_data.permission_id}"
                    )($action);

                } elseif (!$hasPermission && $action->get('requestData.tender_inquiry_approval') === true) {
                    $action->set('payload', new Shape([
                        'user_id' => $action->get('user_id'),
                        'permission_id' => $action->get('ta_permission.id'),
                    ]));
                    Rest::write(
                        'account',
                        "permissions/user",
                        function ($payload, $a) {
                            $payload = $a->get("payload");
                            return $payload;
                        },
                        'payload'
                    )($action);
                }

            } catch (\Exception $e) {
                throw new MiddlewareException("GenericError", $e->getMessage());
            }
        };
    }


    public static function updateSubcontractorListApprovalPermission(string $type = 'create'): Closure
    {
        return function ($action) use ($type) {
            try {
                $slPermission = $action
                    ->get('permissions')
                    ->filterByField('key', 'subcontractor_list_approval')
                    ->first();

                if (!$slPermission) {
                    return;
                }

                $action->set('sl_permission', $slPermission);
                $userPermissions = $action->get('permission_mappings');
                $permissionMapping = $userPermissions
                    ->filterByField('permission_id', $slPermission->get('id'));

                $hasPermission = (bool) $action->get('subcontractor_list_approval');
                if (count($permissionMapping) > 0 && $hasPermission === false) {
                    $action->set('permission_data', $permissionMapping->first());

                    Rest::delete(
                        'account',
                        "permissions/user/{user_id}/{permission_data.permission_id}"
                    )($action);
                }

                elseif (count($permissionMapping) === 0 && $hasPermission === true) {
                    $action->set('payload', new Shape([
                        'user_id'       => $action->get('user_id'),
                        'permission_id' => $slPermission->get('id'),
                    ]));

                    Rest::write(
                        'account',
                        "permissions/user",
                        function ($payload, $a) {
                            return $a->get("payload");
                        },
                        'payload'
                    )($action);
                }

            } catch (\Exception $e) {
                throw new MiddlewareException("GenericError", $e->getMessage());
            }
        };
    }
}
