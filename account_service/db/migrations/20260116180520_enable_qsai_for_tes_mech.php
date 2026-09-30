<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class EnableQsaiForTesMech extends AbstractMigration
{
    /**
     * Enable QSAI (AI feature) for TES MECH LTD account
     */
    public function up(): void
    {
        $account = $this->fetchRow("SELECT id FROM account WHERE name = 'TES MECH LTD' LIMIT 1");

        if (!$account) {
            return;
        }

        $accountId = $account['id'];

        $aiFeature = $this->fetchRow("SELECT id FROM feature WHERE name = 'AI' LIMIT 1");

        if (!$aiFeature) {
            return;
        }

        $aiFeatureId = $aiFeature['id'];

        $accountId = (int) $accountId;
        $accountFeatures = $this->fetchRow(sprintf("SELECT id FROM account_features WHERE account_id = %d", $accountId));

        if ($accountFeatures) {
            $accountFeaturesId = $accountFeatures['id'];
        } else {
            $this->execute("INSERT INTO account_features (account_id) VALUES ({$accountId})");
            $accountFeaturesId = $this->getAdapter()->getConnection()->lastInsertId();
        }

        $existingMapping = $this->fetchRow(
            sprintf(
                "SELECT id FROM account_features_mapping WHERE account_features_id = %d AND feature_id = %d",
                (int) $accountFeaturesId,
                (int) $aiFeatureId
            )
        );

        if (!$existingMapping) {
            $this->execute(
                "INSERT INTO account_features_mapping (account_features_id, feature_id) VALUES ({$accountFeaturesId}, {$aiFeatureId})"
            );
        }
    }

    /**
     * Disable QSAI (AI feature) for TES MECH LTD account (rollback)
     */
    public function down(): void
    {
        $account = $this->fetchRow("SELECT id FROM account WHERE name = 'TES MECH LTD' LIMIT 1");

        if (!$account) {
            return;
        }

        $accountId = $account['id'];

        $aiFeature = $this->fetchRow("SELECT id FROM feature WHERE name = 'AI' LIMIT 1");

        if (!$aiFeature) {
            return;
        }

        $aiFeatureId = $aiFeature['id'];

        $accountId = (int) $accountId;
        $accountFeatures = $this->fetchRow(sprintf("SELECT id FROM account_features WHERE account_id = %d", $accountId));

        if (!$accountFeatures) {
            return;
        }

        $accountFeaturesId = (int) $accountFeatures['id'];

        $this->execute(
            "DELETE FROM account_features_mapping WHERE account_features_id = {$accountFeaturesId} AND feature_id = {$aiFeatureId}"
        );
    }
}
