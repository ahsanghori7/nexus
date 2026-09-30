<?php

use Core\Middleware\Procedure;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Manager;

Procedure::registerActions(
    "resolveFeatureFromMilestone",
    [
        function ($a) {
            $res = Manager::getService('project')
                ->fetch("milestones");

            $milestones = $res->getShape('data')->get();

            $features = Manager::getService('account')
                ->fetch("feature")
                ->getShape('data')
                ->get();

            $featuresToBeEnabled = [];

            foreach ($a->get('payload')->get() as $value) {
                $milestoneId = (int)$value['milestone_id'];
                $data = array_filter($milestones, fn ($m) => (int)$m['id'] === $milestoneId);
                if (empty($data)) {
                    throw new MiddlewareException(
                        "noEntityFound",
                        "Milestone not found for ID: {$milestoneId}"
                    );
                }
                $milestoneData = array_shift($data);
                if (!(bool) $milestoneData['is_required']) {

                    $feature = array_filter($features, fn ($f) => strcasecmp(trim($f['name']), $milestoneData['feature_label']) === 0);
                    $featuresToBeEnabled[] = array_shift($feature);
                }

            }
            $a->set('features_to_enable', $featuresToBeEnabled);
        }
    ]
);

Procedure::registerActions(
    "ensureAccountFeature",
    [
        function ($a) {
            $accountId = (int) $a->get('uriArgs.aid');

            if ($accountId <= 0) {
                throw new MiddlewareException(
                    "InvalidAccount",
                    "account_id missing or invalid"
                );
            }

            $res = null;

            try {
                $res = Manager::getService('account')
                    ->fetch("feature/account-feature/{$accountId}")
                    ->getShape('data')
                    ->get();
            } catch (\Core\Service\Exception\RestException $e) {
                if ($e->getCode() !== 404) {
                    throw $e;
                }
            }

            if (is_array($res)) {
                if (isset($res[0]['id'])) {
                    $a->set('account_feature_id', (int)$res[0]['id']);
                    return;
                }

                if (isset($res['id'])) {
                    $a->set('account_feature_id', (int)$res['id']);
                    return;
                }
            }

            // Create the account feature
            Manager::getService('account')
                ->write(
                    'feature/account-feature',
                    new \Core\Data\Shape([
                        'data' => ['account_id' => $accountId]
                    ])
                );

            // Fetch correct account_feature_id
            try {
                $res = Manager::getService('account')
                    ->fetch("feature/account-feature/{$accountId}")
                    ->getShape('data')
                    ->get();
            } catch (\Core\Service\Exception\RestException $e) {
                throw new MiddlewareException(
                    "AccountFeatureFetchFailed",
                    "Failed to fetch newly created account feature"
                );
            }

            if (is_array($res)) {
                if (isset($res[0]['id'])) {
                    $a->set('account_feature_id', (int)$res[0]['id']);
                    return;
                }

                if (isset($res['id'])) {
                    $a->set('account_feature_id', (int)$res['id']);
                    return;
                }
            }

            throw new MiddlewareException(
                "AccountFeatureMissing",
                "Unable to set account_feature_id after creation"
            );
        }
    ]
);

Procedure::registerActions(
    "ensureAccountFeatureMapping",
    [
        function ($a) {
            $accountFeatureId = (int) $a->get('account_feature_id');
            $features        = $a->get('features_to_enable');

            foreach ($features as $feature) {
                $featureId = (int) $feature['id'];

                try {
                    $existing = Manager::getService('account')
                        ->fetch(
                            'feature/account-features-mapping',
                        [
                            'account_features_id' => $accountFeatureId,
                            'feature_id'          => $featureId
                        ]
                    )
                    ->getShape('data')
                        ->get();

                    if (!empty($existing)) {
                        continue;
                    }
                } catch (\Core\Service\Exception\RestException $e) {
                    if ($e->getCode() !== 404) {
                        throw $e;
                    }
                }

                Manager::getService('account')->write(
                    'feature/account-features-mapping',
                    new \Core\Data\Shape([
                        'data' => [
                            'account_features_id' => $accountFeatureId,
                            'feature_id'          => $featureId
                        ]
                    ])
                );
            }
        }
    ]
);

Procedure::registerActions(
    "ensureAccountMilestoneExists",
    [
        function ($a) {
            $accountId = (int) $a->get('uriArgs.aid');
            try {
                $res = Manager::getService('project')->fetch("milestones/account-milestone-mapping/{$accountId}")
                ->getShape('data')->get();

                $a->set('milestones_exist', !empty($res));

            } catch (\Core\Service\Exception\RestException $e) {
                if ($e->getCode() !== 404) {
                    throw $e;
                }
            }
        }

    ]
);
