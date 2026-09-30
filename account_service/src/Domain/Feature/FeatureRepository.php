<?php

declare(strict_types=1);

namespace App\Domain\Feature;

use App\Domain\AbstractRepository;

class FeatureRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "feature";

    /**
     * @var string[]
     */
    protected $models = [
        "feature"           => Feature::class,
        "account_features"  => AccountFeatures::class,
        "account_features_mapping"  => AccountFeaturesMapping::class,
        "envelope"          => Envelope::class,
    ];

    /**
     * @return array
     * @throws \Exception
     */
    public function getFeatures(): array
    {
        $model = $this->getModel();
        $query = sprintf("SELECT * from " . $model->getName());
        $results = [];
        if (method_exists($model->getDB(), 'getAll')) {
            $results = $model->getDB()::getAll($query);
        }
        return $results;
    }

    /**
     * @return array
     * @throws \Exception
     */
    public function getAccountsWithFeatures(int $aid = 0, ?string $featureName = null): array
    {
        $model = $this->getModel();

        $query = sprintf(
            "
        SELECT account_features.id, account.id as account_id, account.name as account, feature.id as feature_id, feature.name as feature
        FROM %s
        LEFT JOIN %s ON account_features_mapping.account_features_id = account_features.id
        JOIN account ON account.id = account_features.account_id
        LEFT JOIN %s ON feature.id = account_features_mapping.feature_id",
            $this->getModel("account_features")->getName(),
            $this->getModel("account_features_mapping")->getName(),
            $this->getModel()->getName()
        );
        $conditions = [];

        if ($aid) {
            $conditions[] = "account_features.account_id = " . intval($aid);
        }

        if ($featureName) {
            $conditions[] = "feature.name = '" .$featureName."'";
        }

        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $results = [];
        if (method_exists($model->getDB(), 'getAll')) {
            $results = $model->getDB()::getAll($query);
        }
        return $results;
    }

    /**
     * @return array
     * @throws \Exception
     */
    public function getAccountEnvelopes(int $aid = 0): array
    {
        $model = $this->getModel();

        $query = sprintf(
            "SELECT * FROM %s WHERE account_id = %s",
            $this->getModel("envelope")->getName(),
            $aid
        );
        $results = [];
        if (method_exists($model->getDB(), 'getAll')) {
            $results = $model->getDB()::getAll($query);
            $result = array_shift($results);
        }
        return $result ?? [];
    }

    /**
     * @return void
     * @throws \Exception
     */
    public function updateEnvelopes(int $aid = 0, array $data = []) : void
    {
        $model = $this->getModel("envelope");
        $fetchQuery = sprintf("SELECT * from envelope where account_id = $aid");
        $results = [];
        if (method_exists($model->getDB(), 'getAll')) {
            $results = $model->getDB()::getAll($fetchQuery);
            $current = $data["current"] ?? 0;
            $envelopes = $data["envelopes"] ?? 0;
            $period = $data["period"] ?? '';
            if (empty($results)) {
                $query = sprintf("INSERT INTO %s (account_id, current, envelopes, period) VALUES %s", $model->getName(), "(" . $aid . ", " . $current . ", " . $envelopes . ", '" . $period . "')");
            } else {
                $query = sprintf("UPDATE %s SET current = %s, envelopes = %s, period = '%s' WHERE account_id = %s", $model->getName(), $current, $envelopes, $period, $aid);
            }

            if (method_exists($model->getDb(), 'exec')) {
                $model->getDb()::exec($query);
            }
        }
    }

    /**
     * @param array $aids
     * @return array
     * @throws \ReflectionException
     */
    public function updateAccountsFeatures(array $aids = [])
    {
        $model = $this->getModel("account_features");
        $insertIds = [];
        foreach ($aids as $aid) {
            $update = sprintf("INSERT INTO %s (account_id) VALUES %s", $model->getName(), "(" . $aid . ")");
            if (method_exists($model->getDb(), 'exec')) {
                $model->getDb()::exec($update);
                $insertIds[] = $model->getDb()::getDatabaseAdapter()->getDatabase()->getPDO()->lastInsertId();
            }
        }
        return $insertIds;
    }

    /**
     * @param int $aid
     * @throws \ReflectionException
     */
    public function deleteAccountsFeatures(int $aid)
    {
        $model = $this->getModel("account_features");
        $delete = sprintf("DELETE FROM %s WHERE %s", $model->getName(), "id = " . $aid);
        if (method_exists($model->getDb(), 'exec')) {
            $model->getDb()::exec($delete);
        }
    }

    /**
     * @param int $maid
     * @param int $feature
     * @throws \Exception
     */
    public function updateAccountsFeaturesMapping(int $maid, int $feature)
    {
        $model = $this->getModel("account_features_mapping");
        $update = sprintf("INSERT INTO %s (account_features_id, feature_id) VALUES %s", $model->getName(), "(" . $maid . "," . $feature .  ")");
        if (method_exists($model->getDb(), 'exec')) {
            $model->getDb()::exec($update);
        }
    }

    /**
     * @param int $aid
     * @return array|null
     * @throws \Exception
     */
    public function getAccountFeatureByAccountId(int $aid): ?array
    {
        $model = $this->getModel("account_features");
        $query = sprintf(
            "SELECT * FROM %s WHERE account_id = %d LIMIT 1",
            $model->getName(),
            $aid
        );

        $res = $model->getDb()::getAll($query);
        return $res[0] ?? null;
    }

    /**
     * @param int $aid
     * @return array
     * @throws \Exception
     */
    public function createAccountFeature(int $aid): array
    {
        $model = $this->getModel("account_features");
        $db    = $model->getDb();

        $insert = sprintf(
            "INSERT INTO %s (account_id) VALUES (%d)",
            $model->getName(),
            $aid
        );

        $db::exec($insert);
        $id = $db::getDatabaseAdapter()
            ->getDatabase()
            ->getPDO()
            ->lastInsertId();

        return [
            'id' => (int) $id,
            'account_id' => $aid
        ];
    }

    /**
     * @param int $afi
     * @param int $fi
     * @return array
     * @throws \InvalidArgumentException
     * @throws \Exception
     */
    public function createAccountsFeaturesMapping(int $afi, int $fi): array
    {
        if ($afi <= 0 || $fi <= 0) {
            throw new \InvalidArgumentException('Invalid mapping IDs');
        }

        $model = $this->getModel("account_features_mapping");
        $db    = $model->getDb();

        $insert = sprintf(
            "INSERT INTO %s (account_features_id, feature_id) VALUES (%d, %d)",
            $model->getName(),
            $afi,
            $fi
        );

        $db::exec($insert);

        $id = $db::getDatabaseAdapter()
            ->getDatabase()
            ->getPDO()
            ->lastInsertId();

        return [
            'id' => (int) $id,
            'account_features_id' => $afi,
            'feature_id' => $fi
        ];
    }

    /**
     * @param int $accountFeatureId
     * @param int $featureId
     * @return array<int, array{
     *     id: int,
     *     account_features_id: int,
     *     feature_id: int
     * }>
     * @throws \Exception
     */
    public function getAccountsFeaturesMapping(int $accountFeatureId, int $featureId): array
    {
        $model = $this->getModel("account_features_mapping");

        $query = sprintf(
            "SELECT * FROM %s WHERE account_features_id = %d AND feature_id = %d",
            $model->getName(),
            $accountFeatureId,
            $featureId
        );

        return $model->getDb()::getAll($query) ?: [];
    }
}
