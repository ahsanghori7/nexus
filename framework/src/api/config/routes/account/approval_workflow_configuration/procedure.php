<?php

use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Procedure;
use Core\Middleware\Rest;

Procedure::registerActions(
    "validatePayload",
    [
        function ($shape) {
            $request = $shape->getRoute()->getRequest();
            $json = $request->getData()->getShape('json')->toArray();
            $levels = $json['levels'] ?? null;

            if (!is_array($levels)) {
                throw new MiddlewareException(
                    "invalidPayloads",
                    "Invalid payload: levels must be a non-empty array"
                );
            }

            $thresholdFound = false;
            foreach ($levels as $itemIndex => $item) {
                if (($item['is_deleted'] ?? false) && empty($item['id'])) {
                    throw new MiddlewareException(
                        "invalidPayloads",
                        "Invalid payload: new items cannot be marked as deleted"
                    );
                }

                if($item['is_threshold']){
                    foreach($item['conditions'] ?? [] as $itemCondition){
                        if ((!array_key_exists('threshold_type', $itemCondition) || !array_key_exists('from_value', $itemCondition))) {

                            throw new MiddlewareException(
                                "invalidPayloads",
                                "Invalid payload: threshold rules must have threshold type and from value"
                            );
                        }
                    }
                }

                if ($item['rule_type'] === 'custom' && (!array_key_exists('min_required', $item) || $item['min_required'] <= 0)) {
                    throw new MiddlewareException(
                        "invalidPayloads",
                        "Invalid payload: custom rules must have at least 1 role required"
                    );
                }

                if ($item['is_threshold'] == 0 && empty($item['roles'])) {
                    throw new MiddlewareException(
                        "invalidPayloads",
                        "Invalid payload: roles must be a non-empty"
                    );
                }

                if ($item['is_threshold'] == 1 && empty($item['conditions'])) {
                    throw new MiddlewareException(
                        "invalidPayloads",
                        "Invalid payload: conditions must be a non-empty"
                    );
                }
            }
            validateThresholds($levels);
        },
    ]
);

function validateThresholds(array $thresholds): void
{
    // 1. Filter only active thresholds
    $filtered = array_values(array_filter($thresholds, function ($item) {
        return !empty($item['is_threshold']);
    }));

    // 2. Sort filtered thresholds
    usort($filtered, function ($a, $b) {
        return $a['sort_order'] <=> $b['sort_order'];
    });

    foreach ($filtered as $index => $current) {

        if (count($current['conditions']) <= 1) {
            continue;
        }

        foreach($current['conditions'] as $conditionIndex => $condition){

            $type = $condition['threshold_type'] ?? null;
            $from = $condition['from_value'] ?? null;
            $to   = $condition['to_value'] ?? null;

            // -------------------------
            // TYPE VALIDATION (RELAXED)
            // -------------------------

            $levelLabel = "Invalid payload: Level ". $index+1 . ", Condition ";
            if ($type === 'between') {

                if (!is_numeric($from) || !is_numeric($to)) {
                    throw new MiddlewareException(
                        "invalidPayloads",
                        $levelLabel . ($condition['sort_order']) . ": from_value & to_value required"
                    );
                } elseif ($from >= $to) {
                    throw new MiddlewareException(
                        "invalidPayloads",
                        $levelLabel . ($condition['sort_order']) . ": from_value must be less than to_value"
                    );
                }
            }

            elseif ($type === 'greater_than_equal') {

                if (!is_numeric($from)) {
                    throw new MiddlewareException(
                        "invalidPayloads",
                        $levelLabel . ($condition['sort_order']) . ": from_value required"
                    );
                }
            }

            elseif ($type === 'less_than_equal') {

                if (!is_numeric($to)) {
                    throw new MiddlewareException(
                        "invalidPayloads",
                        $levelLabel . ($condition['sort_order']) . ": to_value required"
                    );
                }
            }

            else {
                throw new MiddlewareException(
                    "invalidPayloads",
                    $levelLabel . ($condition['sort_order']) . ": invalid threshold_type"
                );
            }

            // -------------------------
            // CONTINUITY (+1 RULE)
            // -------------------------

            if ($conditionIndex > 0) {
                $prev = $filtered[$index]['conditions'][$conditionIndex - 1] ?? null;

                $prevTo = resolveToValue($prev);
                $currentFrom = resolveFromValue($condition);

                if ($currentFrom !== ($prevTo+1)) {
                    throw new MiddlewareException(
                        "invalidPayloads",
                        "Invalid payload: Gap/overlap between condition ".$prev['sort_order']." and ".$condition['sort_order']." in level ".$index+1
                    );
                }
            }
        }
    }

}

function resolveFromValue(array $item)
{
    switch ($item['threshold_type']) {
        case 'less_than_equal':
            return 0;

        case 'between':
            return $item['from_value'];

        case 'greater_than_equal':
            return $item['from_value'];

        default:
            return null;
    }
}

function resolveToValue(array $item)
{
    switch ($item['threshold_type']) {
        case 'less_than_equal':
            return $item['to_value'];

        case 'between':
            return $item['to_value'];

        case 'greater_than_equal':
            return $item['from_value'];

        default:
            return null;
    }
}

Procedure::registerActions(
    "validateApprovalType",
    [
        function($shape) {
            $shape->set('approval_type', $shape->get(Procedure::getData('type')($shape)));
        },
        Rest::fetchDynamic(
            serviceId: 'project',
            resource: 'approval-workflow-configurations/approval-types/{approval_type}',
            postProcessor: function ($res, $shape) {
                $data = $res->getShape("data");
                if ($data->count() === 0) {
                    throw new MiddlewareException(
                        "invalidApprovalType",
                        "The provided approval type is invalid"
                    );
                }
            }
        )
    ]
);

Procedure::registerActions(
    "fetchAndValidateTransactionById",
    [
        function ($a) {
            $transactionId = (int) $a->get("request_args.id");
            if (!$transactionId) {
                throw new MiddlewareException(
                    "InvalidRouteParams",
                    "Transaction ID is required"
                );
            }
        },
         Rest::fetchDynamic(
            serviceId: 'project',
            resource: 'transaction/{request_args.id}',
            postProcessor: function ($res, $shape) {
                $data = $res->getShape("data");
                if ($data->count() === 0) {
                    throw new MiddlewareException(
                        "invalidTransactionId",
                        "The provided transaction ID is invalid"
                    );
                }
            }
        )
    ]
);
