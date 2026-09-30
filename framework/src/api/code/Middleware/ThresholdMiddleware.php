<?php

namespace Api\Middleware;

use Closure;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;

class ThresholdMiddleware
{
    public static function updateUserThresholds(): Closure
    {
        return function (Shape $a) {
            try {
                $userId = $a->get('user_id');
                $type = $a->get('type');
                $thresholdIds = $a->get('threshold_ids');

                if (!$userId || !$type) {
                    throw new MiddlewareException("missingInput", "Missing user_id or type");
                }

                if (!in_array($type, ['approve_all', 'approve_none', 'threshold_range'], true)) {
                    throw new MiddlewareException("invalidType", "Invalid type: $type");
                }

                $accountId = $a->get('user.account_id');
                $client = Manager::getService('account');
                $permissions = $client->fetch("permissions")->getCollection('data')->getItemsAsArray();
                $approvalThresholdPermissionId = null;
                foreach ($permissions as $perm) {
                    if ($perm['key'] === 'approval_threshold') {
                        $approvalThresholdPermissionId = (int) $perm['id'];
                        break;
                    }
                }
                $existingMappings = $client->fetch("thresholds/user/$userId")->getCollection('data')->getItemsAsArray();
                $existingIds = array_map(fn($row) => (int) $row['approval_threshold_id'], $existingMappings);
                $existingCanApproveAll = count($existingMappings) > 0 && (int) $existingMappings[0]['can_approve_all'] === 1;

                $permissionmappingdata = new Shape(['data' => [
                    'user_id' => $userId,
                    'permission_id' => $approvalThresholdPermissionId,
                ]]);

                switch ($type) {
                    case 'approve_all':
                        $thresholds = $client->fetch("thresholds/$accountId")->getCollection('data')->getItemsAsArray();
                        $fromValue = min(array_column($thresholds, 'from_value'));
                        $toValue   = max(array_column($thresholds, 'to_value'));
                        $a->set('from_value', $fromValue);
                        $a->set('to_value', $toValue);
                        $allIds = array_map(fn($t) => (int) $t['id'], $thresholds);
                        sort($allIds); sort($existingIds);

                        if ($existingCanApproveAll && $existingIds === $allIds){

                        $userPermissions = $client->fetch("permissions/user/$userId")->getCollection('data')->getItemsAsArray();
                        $a->set('permission_count', count($userPermissions));
                        return;

                        }

                        $client->delete("thresholds/user/$userId");

                        foreach ($thresholds as $threshold) {
                            $payload = new Shape(['data' => [
                                'user_id' => $userId,
                                'approval_threshold_id' => $threshold['id'],
                                'can_approve_all' => 1,
                                'is_restricted' => 0
                            ]]);
                            $client->write("thresholds/user", $payload);
                        }
                        $client->write("permissions/user", $permissionmappingdata);
                        break;

                    case 'approve_none':
                        $client->delete("thresholds/user/$userId");
                        $client->delete("permissions/user/$userId/$approvalThresholdPermissionId");
                        break;

                    case 'threshold_range':
                        if (!is_array($thresholdIds) || count($thresholdIds) !== 1) {
                            throw new MiddlewareException("invalidThresholdIds", "Only one threshold ID must be provided");
                        }

                        $selectedId = (int) $thresholdIds[0];

                        // Fetch threshold details to get from/to values
                        $thresholds = $client->fetch("thresholds/$accountId")->getCollection('data')->getItemsAsArray();
                        $threshold = null;
                        foreach ($thresholds as $t) {
                            if ((int)$t['id'] === $selectedId) {
                                $threshold = $t;
                                break;
                            }
                        }
                        if (!$threshold) {
                            throw new MiddlewareException("thresholdNotFound", "Threshold not found");
                        }
                        $a->set('from_value', $threshold['from_value']);
                        $a->set('to_value', $threshold['to_value']);

                        if (in_array($selectedId, $existingIds) && !$existingCanApproveAll) {
                            $userPermissions = $client->fetch("permissions/user/$userId")->getCollection('data')->getItemsAsArray();
                            $a->set('permission_count', count($userPermissions));
                            return;
                        }

                        $client->delete("thresholds/user/$userId");

                        $payload = new Shape(['data' => [
                            'user_id' => $userId,
                            'approval_threshold_id' => $selectedId,
                            'can_approve_all' => 0,
                            'is_restricted' => 0
                        ]]);
                        $client->write("thresholds/user", $payload);
                        $client->write("permissions/user", $permissionmappingdata);
                        break;
                }
                if (!$a->get('permission_count')) {
                    $userPermissions = $client->fetch("permissions/user/$userId")->getCollection('data')->getItemsAsArray();
                    $a->set('permission_count', count($userPermissions));
                }
            } catch (\Exception $e) {
                throw new MiddlewareException("thresholdUpdateFailed", $e->getMessage());
            }
        };
    }
}
