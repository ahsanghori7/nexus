<?php

declare(strict_types=1);

namespace App\Domain\Account;

use App\Domain\AbstractRepository;
use App\Domain\Account\AccountOrganisation;
use App\Domain\Account\Attribute\CategoryMapping;
use App\Domain\ProjectType\ProjectTypeMapping;
use App\Domain\Account\AccountUserMapping;
use App\Domain\Account\AccountUserMappingType;
use App\Domain\Account\Attribute\Mapping as AttributeMapping;
use App\Domain\Account\Attribute\Attribute;
use App\Domain\Account\Attribute\Type as AttributeType;
use App\Domain\Account\Attribute\Category as AttributeCategory;
use App\Domain\Account\Attribute\CategoryMapping as AttributeCategoryMapping;
use App\Domain\Region\RegionMapping;
use App\Domain\Trade\TradeMapping;
use App\Domain\User\Token;
use App\Domain\User\TokenType;
use App\Domain\User\User;
use App\Domain\User\Role;
use App\Domain\User\UserOrganisation;
use App\Domain\User\UserOrganisationType;
use App\Domain\Permission\Permission;
use App\Domain\Permission\PermissionMappings;
use App\Domain\Permission\PermissionType;
use App\Domain\Website\Website;
use App\Domain\Account\Provider\Provider;
use App\Domain\Account\Provider\ProviderType;
use App\Domain\Account\Provider\ProviderAccountMapping;
use App\Infrastructure\Action\SqlPaginator;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Class AccountRepository
 * @package App\Domain\Account
 */
class AccountRepository extends AbstractRepository
{
    /**
     * @var string[]
     */
    protected $models = [
        "account" => Account::class,
        "type" => AccountType::class,
        "token" => Token::class,
        "user" => User::class,
        "userOrganisation" => UserOrganisation::class,
        "userOrganisationType" => UserOrganisationType::class,
        "tokenType" => TokenType::class,
        "subscription" => Subscription::class,
        "membership" => Membership::class,
        "supply_chain" => SupplyChain::class,
        "website" => Website::class,
        "account_organisation" => AccountOrganisation::class,
        "account_turnover" => AccountTurnover::class,
        "account_meta" => AccountMeta::class,
        "account_references" => ClientReferences::class,
        "account_prequalification_status" => AccountPrequalificationStatus::class,
        "account_prequalification_sections" => AccountPrequalificationSections::class,
        "prequalification_section" => PrequalificationSection::class,
        "prequalification_section_mapping" => PrequalificationSectionMapping::class,
        "offering_trade_mapping" => TradeMapping::class,
        "offering_region_mapping" => RegionMapping::class,
        "offering_type_mapping" => ProjectTypeMapping::class,
        "account_customer_health_score" => AccountCustomerHealthScore::class,
        "account_user_mapping" => AccountUserMapping::class,
        "account_user_mapping_type" => AccountUserMappingType::class,
        "account_attribute_mapping" => AttributeMapping::class,
        "attribute" => Attribute::class,
        "attribute_type" => AttributeType::class,
        "attribute_category" => AttributeCategory::class,
        "attribute_category_mapping" => AttributeCategoryMapping::class,
        "provider" => Provider::class,
        "provider_type" => ProviderType::class,
        "provider_account_mapping" => ProviderAccountMapping::class,
        "account_action_type" => AccountActionType::class,
        "account_action" => AccountAction::class,
        "account_group" => AccountGroup::class,
        "account_role" => AccountRole::class,
        "account_role_user_mapping" => AccountRoleUserMapping::class,
        "permission" => Permission::class,
        "permission_mapping" => PermissionMappings::class,
        "permission_type" => PermissionType::class,
        "role" => Role::class,
    ];

    /**
     * @param string $token_hash
     * @param int $token_type
     * @return mixed
     * @throws \Exception
     */
    public function verify(string $token_hash, int $token_type = 0)
    {
        $token = $this->getmodel('token')->load($token_hash, "token");
        if ($token->isValid($token_type)) {
            return $token;
        }
        throw new \Exception("Invalid Token");
    }

    /**
     * @param int $user_id
     * @param array $meta
     * @return Account
     * @throws \App\Domain\DomainException
     */
    public function createSession(int $user_id, array $meta = [])
    {
        $token = $this->getModel('token');

        $token_type = $this->getModel('tokenType')->load('session', 'label');

        if (method_exists($token, 'loadLatest')) {
            $token->loadLatest(
                $user_id,
                $token_type
            );
        }

        if (method_exists($token, 'isValid')) {
            if (!$token->isValid()) {
                $token = $this->getModel('token')->save([
                    'created_at' => date("Y-m-d H:i:s"),
                    'user_id' => $user_id,
                    'token_type_id' => $token_type->getId(),
                    'meta' => json_encode($meta)
                ]);
            }
        }

        return $token;
    }

    /**
     * @return Account
     */
    public function getModel(string $name = "account")
    {
        $m  = $this->models[$name] ?? false;
        if ($m) {
            return new $m();
        }
        throw new \Exception("Unknown Model $name");
    }

    public function findById(int $id): void
    {
        // TODO: Implement findById() method.
    }

    public function deleteById(int $id): bool
    {
        // TODO: Implement deleteById() method.
        return true;
    }

    public function updateById(int $id, array $args): bool
    {
        // TODO: Implement updateById() method.
        return true;
    }

    /**
     * @param array $ids
     * @return array
     * @throws \Exception
     */
    public function getUsersEngagement(array $ids)
    {
        $model = $this->getModel("token");

        $query = sprintf("SELECT * FROM token WHERE user_id IN (%s)", implode(",", $ids));
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
    public function getAccountsCustomerHealthScore()
    {
        $model = $this->getModel("account_customer_health_score");

        $query = "SELECT account_id FROM account_customer_health_score";
        $results = [];
        if (method_exists($model->getDB(), 'getAll')) {
            $results = $model->getDB()::getAll($query);
        }
        return $results;
    }

    /**
     * @param array $aids
     * @throws \Exception
     */
    public function updateAccountsCustomerHealthScore(array $aids = [])
    {
        $model = $this->getModel("account_customer_health_score");
        $update = sprintf("INSERT INTO %s (account_id) VALUES %s", $model->getName(), "(" . implode(",", $aids) . ")");
        if (method_exists($model->getDb(), 'exec')) {
            $model->getDb()::exec($update);
        }
    }

    /**
     * @param int $aid
     * @throws \ReflectionException
     */
    public function deleteAccountsCustomerHealthScore(int $aid)
    {
        $model = $this->getModel("account_customer_health_score");
        $delete = sprintf("DELETE FROM %s WHERE %s", $model->getName(), "account_id = " . $aid);
        if (method_exists($model->getDb(), 'exec')) {
            $model->getDb()::exec($delete);
        }
    }

    public function getAccountsWithUsers(array $ids)
    {
        $model = $this->getModel();
        $membershipModel = $this->getModel("membership");
        $cols = ["*", "a.meta as account_meta", "a.status as account_status", "a.email as account_email", "u.email as user_email", "u.id as user_id", "a.type_id as account_type_id", "u.type_id as user_type_id"];
        $query = sprintf("%s a JOIN user u on u.account_id = a.id", $model->getSelect($cols));
        $query .= sprintf(" JOIN membership m on m.account_id = a.id");
        $query .= sprintf(" WHERE a.id IN (%s)", implode(",", $ids));
        $results = [];
        if (method_exists($model->getDB(), 'getAll')) {
            $results = $model->getDB()::getAll($query);
        }
        $data = [];
        if ($results) {
            foreach ($results as $r) {
                if (!isset($data[$r["account_id"]])) {
                    $data[$r["account_id"]] = [
                        "id" => $r["account_id"],
                        "name" => $r["name"],
                        "email" => $r["account_email"],
                        "address" => $r["address"],
                        "landline" => $r["landline"],
                        "mobile" => $r["mobile"],
                        "reg_number" => $r["reg_number"],
                        "vat_number" => $r["vat_number"] ?? "",
                        "utr_number" => $r["utr_number"] ?? "",
                        "logo" => $r["logo"],
                        "slogan" => $r["slogan"],
                        "website" => $r["website"],
                        "description" => $r["description"],
                        "status" => $r["account_status"],
                        "type_id" => $r["account_type_id"],
                        "created_at" => $r["created_at"],
                        "meta" => $r["account_meta"] ?? "",
                        "membership" => [],
                        "users" => []
                    ];
                    foreach ($membershipModel->getColumnNames() as $v) {
                        $data[$r["account_id"]]['membership'][$v] = $r[$v] ?? null;
                    }
                }
                $data[$r["account_id"]]["users"][] = [
                    "id" => $r["user_id"],
                    "account_id" => $r["account_id"],
                    "firstname" => $r["firstname"],
                    "lastname" => $r["lastname"],
                    "email" => $r["user_email"],
                    "type_id" => $r["user_type_id"],
                    "display_name" => $r["display_name"],
                    "job_title" => $r["job_title"],
                    "contact_number" => $r["contact_number"],
                    "migrated" => $r["migrated"]
                ];
            }
        }
        return $data;
    }

    /**
     * @param array $results
     * @return array
     * @throws \Exception
     */
    public function aggregateResults(array $results): array
    {
        $data = [];
        foreach ($results as $r) {
            $aid = $r["account_id"] ?? $r["id"] ?? false;
            if ($aid) {
                if (!isset($data[$aid])) {
                    $data[$aid] = array_merge([
                        "id"    => $aid,
                        "type" => $r["account_type_id"] ?? $r["type_id"] ?? "",
                        "subscription_id" => $r["subscription_id"] ?? "",
                        "subscription" => $r["subscription"] ?? "",
                        "subscription_type" => $r["subscription_type"] ?? "",
                        "first_pqq_sent" => $r["first_pqq_sent"] ?? 0,
                        "users" => []
                    ], $this->map($r, "account"));
                }

                $uid = $r["user_id"] ?? null;
                if ($uid) {
                    $data[$aid]["users"][$uid] = array_merge(
                        $this->map($r, "user"),
                        [
                            "id"   => $r["user_id"] ?? null,
                            "type" => $r["user_type_id"] ?? null
                        ]
                    );
                }
            }
        }
        return $data;
    }

    /**
     * @param string $term
     * @return array
     * @throws \ReflectionException
     */
    public function searchAccountsAndUsers(string $term): array
    {
        $model = $this->getModel();
        $query  = $this->getAccountAndUserQuery();
        $query .= " WHERE a.name LIKE('%$term%') OR u.display_name LIKE('%$term%');";
        if (method_exists($model->getDB(), 'getAll')) {
            return $this->aggregateResults($model->getDB()::getAll($query));
        }

        return [];
    }

    /**
     * @param int $aid
     * @return mixed
     * @throws \ReflectionException
     */
    public function getMembership(int $aid)
    {
        $membership = new Membership();
        $sub = new Subscription();
        $cols =  array_merge(
            $sub->getColumnNames("s", ["id"]),
            $membership->getColumnNames("m", ["account_id", "subscription_id"])
        );

        $join = sprintf("%s s on s.id = m.subscription_id", $sub->getName());
        if (method_exists($membership->getDb(), 'getRow')) {
            return $membership->getDb()::getRow(
                sprintf(
                    'SELECT %s FROM %s m JOIN %s WHERE m.account_id=? LIMIT 1',
                    implode(",", $cols),
                    $membership->getName(),
                    $join
                ),
                [$aid]
            );
        }
    }

    public function getAccountsByParamQuery(
        string $keyId,
        string $mappingTable,
        string $mappingId,
        string $key,
        string $table,
        string $field,
        string $param,
        string $extra = ''
    ): string {
        return "select DISTINCT " . $keyId . " from " . $mappingTable . " where " . $mappingId . " IN (select " . $key . " from " . $table . " where " . $field . " like '%" . $param . "%')" . $extra;
    }

    public function filterAccounts($filters)
    {
        $results = [];
        $model = $this->getModel();

        $regions = [];
        if (isset($filters['region']) && $filters['region'] != '') {
            $query = $this->getAccountsByParamQuery("account_id", "region_mapping", "region_id", "id", "region", "label", $filters['region'], " AND type_id = 3");
            $regions = method_exists($model->getDB(), 'getAll') ? $model->getDB()::getAll($query) : [];
            $regions = array_column($regions, 'account_id');
        }

        $trades = [];
        if (isset($filters['trade']) && $filters['trade'] != '') {
            $query = $this->getAccountsByParamQuery("account_id", "trade_mapping", "trade_id", "id", "trade", "label", $filters['trade']);
            $trades = method_exists($model->getDB(), 'getAll') ? $model->getDB()::getAll($query) : [];
            $trades = array_column($trades, 'account_id');
        }

        $subscriptions = [];
        if (isset($filters['subscriptions']) && $filters['subscriptions'] != '') {
            $query = $this->getAccountsByParamQuery("account_id", "membership", "subscription_id", "id", "subscription", "label", $filters['subscriptions']);
            $subscriptions = method_exists($model->getDB(), 'getAll') ? $model->getDB()::getAll($query) : [];
            $subscriptions = array_column($subscriptions, 'account_id');
        }

        $results = array_merge($regions, $trades, $subscriptions);

        return $results;
    }

    public function getAccountAndUserQuery(array $filters = [], bool $count = false): string
    {
        $model = $this->getModel();
        $cols   = ["*", "u.email as user_email", "u.id as user_id", "a.type_id as account_type_id", "u.type_id as user_type_id", "s.label as subscription", "s.interval_type as subscription_type"];

        if ($count) {
            $cols = ["COUNT(DISTINCT u.id) as c"];
        }

        $query  = sprintf("%s a JOIN user u on u.account_id = a.id", $model->getSelect($cols));
        $query .= " JOIN membership m on m.account_id = a.id JOIN subscription s on s.id = m.subscription_id";

        if (!empty($filters)) {
            foreach ($filters as $key => $filter) {
                if ($filter !== "") {
                    switch ($key) {
                        case 'region':
                            $query .= " JOIN region_mapping rm on rm.account_id = a.id";
                            break;
                        case 'trade':
                            $query .= " JOIN trade_mapping tm on tm.account_id = a.id";
                            break;
                        default:
                            $query .= "";
                            break;
                    }
                }
            }
        }

        return $query;
    }

    public function getAccountQuery(array $filters = [], bool $count = false): string
    {
        $model = $this->getModel();
        $cols   = ["a.*", "s.id as subscription_id", "s.label as subscription", "s.interval_type as subscription_type"];

        if ($count) {
            $cols = ["COUNT(DISTINCT a.id) as c"];
        }

        $query  = sprintf("%s a", $model->getSelect($cols));
        $query .= " JOIN membership m on m.account_id = a.id JOIN subscription s on s.id = m.subscription_id";

        if (!empty($filters)) {
            foreach ($filters as $key => $filter) {
                if ($filter !== "") {
                    switch ($key) {
                        case 'region':
                            $query .= " JOIN region_mapping rm on rm.account_id = a.id";
                            break;
                        case 'trade':
                            $query .= " JOIN trade_mapping tm on tm.account_id = a.id";
                            break;
                        default:
                            $query .= "";
                            break;
                    }
                }
            }
        }

        return $query;
    }

    public function listAccountsAndUsers(int $limit = 200, int $offset = 0, int $accountType = 0, string $search = "", string $orderBy = "", string $desc = "1", array $filters = [], bool $justAccount = false, int $status = -1)
    {
        $model = $this->getModel();
        $query = $justAccount ? $this->getAccountQuery($filters) : $this->getAccountAndUserQuery($filters);
        $query .= $this->getListWhere($accountType, $search, $filters, $justAccount, $status);

        if ($orderBy) {
            $query .= $this->getSortingQuery($orderBy, $desc);
        }

        $query .= sprintf(" LIMIT %s OFFSET %s", $limit, $offset);
        if (method_exists($model->getDB(), 'getAll')) {
            return $this->aggregateResults($model->getDB()::getAll($query));
        }

        return '';
    }

    /**
     * @param int $type
     * @param string $search
     * @param bool $justAccount
     * @return string
     */
    public function getListWhere(int $type = 0, string $search = "", array $filters = [], bool $justAccount = false, int $status = -1): string
    {
        $where = [];
        if ($type) {
            $where[] =  "a.type_id = $type";
        }

        if ($search) {
            $search = addslashes($search);
            $where[] = $justAccount ? "(a.name LIKE('%$search%'))" : "(a.name LIKE('%$search%') OR u.display_name LIKE('%$search%'))";
        }

        if ($status >= 0) {
            $where[] = $justAccount ? "a.status = $status" : "u.status = $status";
        }

        if (!empty($filters)) {
            foreach ($filters as $key => $filter) {
                if ($filter !== "") {
                    switch ($key) {
                        case 'region':
                            $where[] = "rm.region_id IN (select id from region where label like '%" . $filter . "%') AND rm.type_id = 3";
                            break;
                        case 'trade':
                            $where[] = "tm.trade_id IN (select id from trade where label like '%" . $filter . "%')";
                            break;
                        case 'subscriptions':
                            $subsWhere = [];
                            $subscriptions = explode(',', $filter);
                            foreach ($subscriptions as $sub) {
                                $subsWhere[] = "label like '%" . $sub . "%'";
                            }
                            $where[] = "m.subscription_id IN (select id from subscription where " . implode(" OR ", $subsWhere) . ")";
                            break;
                        default:
                            break;
                    }
                }
            }
        }

        $query = "";
        if ($where) {
            $query .= " WHERE " . implode(" AND ", $where);
        }

        return $query;
    }

    /**
     * @param Request $request
     * @param int $type
     * @param string $search
     * @param bool $justAccount
     * @param int $status
     * @return SqlPaginator
     * @throws \Exception
     */
    public function getAccountUsersPaginator(Request $request, int $type = 0, string $search = "", array $filters = [], bool $justAccount = false, int $status = -1): SqlPaginator
    {
        $sql = $justAccount ? $this->getAccountQuery($filters, true) : $this->getAccountAndUserQuery($filters, true);
        $sql .= $this->getListWhere($type, $search, $filters, $justAccount, $status);

        $sql .= ";";
        return new SqlPaginator($request, $this->getModel(), $sql);
    }

    /**
     * @param string $orderBy
     * @param string $desc
     * @return string
     */
    public function getSortingQuery(string $orderBy = "", string $desc = "1"): string
    {
        $fields = explode(",", $orderBy);
        // @phpstan-ignore-next-line
        $descList = is_string($desc) ? explode(",", $desc) : $desc;
        $query = " ORDER BY ";
        foreach ($fields as $i => $f) {
            $field = "";
            switch ($f) {
                case 'company':
                    $field = "a.name";
                    break;
                case 'name':
                case 'user':
                    $field = "u.display_name";
                    break;
                case 'subscription':
                    $field = "s.label";
                    break;
                case 'frequency':
                    $field = "s.interval_type";
                    break;
                case 'registration-date':
                case 'created_at':
                    $field = "a.created_at";
                    break;
                case 'status':
                    $field = "a.status";
                    break;
                default:
                    break;
            }

            $typeOrder = intval($descList[$i]) ? "DESC" : "ASC";
            $typeOrder .= $i === count($fields) - 1 ? "" : ",";
            $query .= sprintf(" %s %s", $field, $typeOrder);
        }

        return $query;
    }


    /**
     * @param array $source
     * @param string $modelName
     * @return array
     * @throws \Exception
     */
    public function map(array $source, string $modelName): array
    {
        $data  = [];
        $model = $this->getModel($modelName);
        foreach ($model->getColumnNames() as $name) {
            if (isset($source[$name])) {
                $data[$name] = $source[$name];
            }
        }
        return $data;
    }

    /**
     * @param int $region
     * @param array $params
     * @return array
     * @throws \Exception
     */
    public function getAccountsByRegion(int $region = 0, array $params = []): array
    {
        $model = $this->getModel();
        $query = "SELECT * FROM account ";

        $where = [];
        if ($region) {
            $where[] = "region_group_id = $region ";
        }

        $name = $params["name"] ?? "";
        $strict = $params["strict"] ?? false;
        if ($name) {
            if ($strict && $strict !== "false") {
                $where[] = "name  = '$name' ";
            } else {
                $where[] = "name LIKE '%$name%' ";
            }
        }

        $regNumber = $params["reg_number"] ?? "";
        if ($regNumber) {
            if ($strict && $strict !== "false") {
                $where[] = "reg_number  = '$regNumber' ";
            } else {
                $where[] = "reg_number LIKE '%$regNumber%' ";
            }
        }

        $type = $params["type_id"] ?? "";
        if ($type) {
            if (strpos($type, ',') !== false) {
                $where[] = "type_id IN ($type) ";
            } else {
                $where[] = "type_id = $type ";
            }
        }

        if (count($where)) {
            $query .= " WHERE " . implode(" AND ", $where);
        }

        if (method_exists($model->getDB(), 'getAll')) {
            return $model->getDB()::getAll($query);
        }
        return [];
    }

    /**
     * List account actions with filters + pagination
     *
     * @param int $limit
     * @param int $offset
     * @param string|null $actionType
     * @param string|null $actionDate
     * @return array
     * @throws \Exception
    */
    public function listAccountActions(
        int $limit = 200,
        int $offset = 0,
        ?string $actionType = null,
        ?string $actionDate = null
    ): array {
        $model = $this->getModel("account_action");

        $query = "
            SELECT
                aa.id,
                aa.account_id,
                aa.related_account_id,
                COALESCE(aa.account_user_id, 0) AS account_user_id,
                COALESCE(aa.related_account_user_id, 0) AS related_account_user_id,
                aat.label AS action_type,
                COALESCE(aa.description, '') AS description,
                aa.action_date
            FROM account_action aa
            JOIN account_action_type aat ON aa.action_type = aat.id
        ";

        $where = [];

        if (!empty($actionType)) {
            $where[] = "aat.label = '" . addslashes($actionType) . "'";
        }

        if (!empty($actionDate)) {
            $where[] = "DATE(aa.action_date) = '" . addslashes($actionDate) . "'";
        }

        if ($where) {
            $query .= " WHERE " . implode(" AND ", $where);
        }

        $query .= " ORDER BY aa.action_date DESC";
        $query .= " LIMIT " . (int)$limit . " OFFSET " . (int)$offset;

        $result = $model->getDB()::getAll($query);

        return $result ?? [];
    }

    /**
     * Get paginator for account actions
     *
     * @param Request $request
     * @param string $actionType
     * @param string $actionDate
     * @return SqlPaginator
     * @throws \Exception
    */
    public function getAccountActionsPaginator(
        Request $request,
        ?string $actionType = null,
        ?string $actionDate = null
    ): SqlPaginator {
        $model = $this->getModel("account_action");

        $sql = "
            SELECT COUNT(*) as c
            FROM account_action aa
            JOIN account_action_type aat ON aa.action_type = aat.id
        ";

        $where = [];

        if (!empty($actionType)) {
            $actionType = addslashes($actionType);
            $where[] = "aat.label = '{$actionType}'";
        }

        if (!empty($actionDate)) {
            $actionDate = addslashes($actionDate);
            $where[] = "DATE(aa.action_date) = '{$actionDate}'";
        }

        if ($where) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= ";";

        return new SqlPaginator($request, $model, $sql);
    }

    /**
     * List account roles for specific Accounts
     *
     * @param int $account_id
     * @return array
     * @throws \Exception
    */
    public function listAccountRolesActions($account_id): array {
        $model = $this->getModel("account_role");
        $query = "SELECT
                    ar.id,
                    ar.label,
                    ar.description,
                    ar.role_id AS user_type_id,
                    r.level,
                    r.display_label as user_type,
                FROM account_role ar
                INNER JOIN role r ON r.id = ar.role_id
                WHERE ar.account_id = " . (int)$account_id . "
                ORDER BY r.level ASC";

        $result = $model->getDB()::getAll($query);

        return $result ?? [];
    }

    /**
     * List account roles with their assigned permissions.
     *
     * @param int $accountId
     * @param string $search
     * @param int $userTypeId
     * @return array
     */
    public function listAccountRolesWithPermissions(int $accountId, string $userType = "", int $userTypeId = 0): array
    {
        $accountRoleModel = $this->getModel('account_role');

        $where = ["ar.account_id = " . (int) $accountId, "r.is_contractor_user_type = 1"];

        if ($userType) {
            $where[] = "r.label = '" . (string) $userType . "'";
        }

        if ($userTypeId) {
            $where[] = "ar.role_id = " . (int) $userTypeId;
        }

        $query = sprintf(
            'SELECT
                ar.id as account_role_id,
                ar.label,
                ar.description,
                ar.role_id AS user_type_id,
                r.is_external,
                r.level,
                r.label as user_type_key,
                r.display_label as user_type,
                r.is_contractor_user_type,
                pm.permission_id,
                p.`key` as permission_key,
                p.permission_type_id,
                pt.label as permission_type_label
            FROM account_role ar
            INNER JOIN role r ON r.id = ar.role_id
            LEFT JOIN permission_mappings pm ON pm.account_role_id = ar.id
            LEFT JOIN permission p ON p.id = pm.permission_id
            LEFT JOIN permission_type pt ON pt.id = p.permission_type_id
            %s %s
            ORDER BY ar.label ASC, ar.id ASC, pt.label ASC, p.id ASC',
            'WHERE',
            implode(' AND ', $where)
        );

        $rows = $accountRoleModel->getDB()::getAll($query) ?: [];
        $roles = [];

        foreach ($rows as $row) {
            $roleId = (int) $row['account_role_id'];

            if (!isset($roles[$roleId])) {
                $roles[$roleId] = [
                    'id' => $roleId,
                    'label' => $row['label'],
                    'description' => $row['description'],
                    'user_type_id' => (int) $row['user_type_id'],
                    'is_external' => (bool) ($row['is_external'] ?? false),
                    'user_type_key' => $row['user_type_key'],
                    'user_type' => $row['user_type'],
                    'is_contractor_user_type' => (bool) ($row['is_contractor_user_type'] ?? false),
                    'permissions' => [],
                ];
            }

            if (!empty($row['permission_id'])) {
                $roles[$roleId]['permissions'][] = [
                    'id' => (int) $row['permission_id'],
                    'key' => $row['permission_key'],
                    'permission_type_id' => $row['permission_type_id'] !== null ? (int) $row['permission_type_id'] : null,
                    'permission_type_label' => $row['permission_type_label'],
                ];
            }
        }

        return array_values($roles);
    }

    public function getAccountRoleWithPermissions(int $accountRoleId): ?array
    {
        $accountRoleModel = $this->getModel('account_role');
        $query = sprintf(
            'SELECT
                ar.id as account_role_id,
                ar.label,
                ar.description,
                ar.role_id AS user_type_id,
                r.is_external,
                r.level,
                r.label as value,
                r.is_contractor_user_type,
                pm.permission_id,
                p.`key` as permission_key,
                p.permission_type_id,
                pt.label as permission_type_label
            FROM account_role ar
            INNER JOIN role r ON r.id = ar.role_id
            LEFT JOIN permission_mappings pm ON pm.account_role_id = ar.id
            LEFT JOIN permission p ON p.id = pm.permission_id
            LEFT JOIN permission_type pt ON pt.id = p.permission_type_id
            WHERE ar.id = %d',
            $accountRoleId
        );

        $rows = $accountRoleModel->getDB()::getAll($query) ?: [];
        if (empty($rows)) {
            return null;
        }

        $role = null;
        foreach ($rows as $row) {
            if ($role === null) {
                $role = [
                    'id' => (int) $row['account_role_id'],
                    'label' => $row['label'],
                    'description' => $row['description'],
                    'user_type_id' => (int) $row['user_type_id'],
                    'is_external' => (bool) ($row['is_external'] ?? false),
                    'level' => (int) $row['level'],
                    'value' => $row['value'],
                    'is_contractor_user_type' => (bool) ($row['is_contractor_user_type'] ?? false),
                    'permissions' => [],
                ];
            }

            if (!empty($row['permission_id'])) {
                $role['permissions'][] = [
                    'id' => (int) $row['permission_id'],
                    'key' => $row['permission_key'],
                    'permission_type_id' => $row['permission_type_id'] !== null ? (int) $row['permission_type_id'] : null,
                    'permission_type_label' => $row['permission_type_label'],
                ];
            }
        }

        return $role;
    }

    /**
     * Replace all permissions for a specific account role.
     *
     * @param int $accountRoleId
     * @param array<int, int> $permissionIds
     * @return bool
     */
    public function replaceAccountRolePermissions(int $accountRoleId, array $permissionIds): bool
    {
        try {
            $mappingModel = $this->getModel('permission_mapping');
            $db = $mappingModel->getDB();

            if (method_exists($db, 'exec')) {
                $db::exec('DELETE FROM permission_mappings WHERE account_role_id = ' . (int) $accountRoleId);

                $permissionIds = array_values(array_unique(array_filter(array_map('intval', $permissionIds))));
                foreach ($permissionIds as $permissionId) {
                    $db::exec(sprintf(
                        'INSERT INTO permission_mappings (account_role_id, permission_id, user_id) VALUES (%d, %d, NULL)',
                        $accountRoleId,
                        $permissionId
                    ));
                }
            }

            return true;
        } catch (\Exception $exception) {
            return false;
        }
    }

    /**
     * Delete an account role and its mappings.
     *
     * @param int $accountId
     * @param int $accountRoleId
     * @return bool
     */
    public function deleteAccountRoleById(int $accountId, int $accountRoleId): bool
    {
        try {
            $roleModel = $this->getModel('account_role');
            $db = $roleModel->getDB();

            if (method_exists($db, 'exec')) {
                $db::exec('DELETE FROM permission_mappings WHERE account_role_id = ' . (int) $accountRoleId);
                $db::exec('DELETE FROM account_role_user_mapping WHERE account_role_id = ' . (int) $accountRoleId);
                $db::exec('DELETE FROM account_role WHERE id = ' . (int) $accountRoleId . ' AND account_id = ' . (int) $accountId);
            }

            return true;
        } catch (\Exception $exception) {
            return false;
        }
    }

    public function updateAccountRoleMapping(int $user_id, int $role_id): bool
    {
        try
        {
            $model = $this->getModel("account_role_user_mapping");
            $query = "SELECT * FROM account_role_user_mapping WHERE user_id = " . (int)$user_id;
            $result = $model->getDB()::exec($query);

            if(!$result)
            {
                $query = "INSERT INTO account_role_user_mapping (user_id, account_role_id) VALUES (" . (int)$user_id . ", " . (int)$role_id . ")";

                if (method_exists($model->getDB(), 'exec')) {
                    return $model->getDB()::exec($query) !== false;
                }

                return false;
            }
            else
            {
                $query = "UPDATE account_role_user_mapping SET account_role_id = " . (int)$role_id . " WHERE user_id = " . (int)$user_id;

                if (method_exists($model->getDB(), 'exec')) {
                    return $model->getDB()::exec($query) !== false;
                }

                return false;
            }
        } catch (\Exception $e) {
            return false;
        }
    }

    public function deleteAccountRoleMapping(int $user_id): bool
    {
        try
        {
            $model = $this->getModel("account_role_user_mapping");
            $query = "DELETE FROM account_role_user_mapping WHERE user_id = " . (int)$user_id;

            if (method_exists($model->getDB(), 'exec')) {
                return $model->getDB()::exec($query) !== false;
            }

            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * List Users for specific Roles for Specific Account
     *
     * @param int $account_id
     * @param int $account_role_id
     * @return array
     * @throws \Exception
    */
    public function listUsersActions($account_id, $account_role_id, $project_group_id = 0, $exclude_user_id = 0): array {
        try
        {
            $model = $this->getModel('account_role');

            $query = "SELECT * FROM account_role WHERE id = " . (int)$account_role_id . " AND account_id = " . (int)$account_id;

            $account_role = $model->getDB()::getRow($query);

            if(empty($account_role)) {
                return [];
            }

            $model = $this->getModel("account_role_user_mapping");

            $query = "SELECT * from account_role_user_mapping AS arum
                WHERE arum.account_role_id = " . (int)$account_role['id'];

            $userIds = $model->getDB()::getAll($query);

            // Initialize an empty users array in case no users are mapped
            $account_role['users'] = [];

            if($project_group_id > 0)
            {
                $query = "SELECT user_id FROM account_group_user_mapping WHERE account_group_id = " . (int)$project_group_id;

                $projectGroupUsers = $model->getDB()::getAll($query);

                if ($projectGroupUsers) {
                    $projectGroupUserIds = array_column($projectGroupUsers, 'user_id');
                    $userIds = array_filter($userIds, function ($user) use ($projectGroupUserIds) {
                        return in_array($user['user_id'], $projectGroupUserIds);
                    });
                }
            }

            if($userIds)
            {
                $userIds = array_column($userIds, 'user_id');

                $query = "SELECT id, account_id, firstname, lastname, display_name, email  FROM user WHERE id IN (" . implode(",", $userIds) . ") AND account_id = " . (int)$account_id . " AND status = 2";

                if ($exclude_user_id > 0) {
                    $query .= " AND id <> " . (int) $exclude_user_id;
                }

                $users = $model->getDB()::getAll($query);
                $account_role['users'] = $users;
            }

            return $account_role;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * @param int $accountId
     * @param string|null $term
     * @param int|null $roleId
     * @return array
     */
    public function searchUsersByAccountId(int $accountId, ?string $term = null, ?int $roleId = null, ?int $groupId = null, int $limit = 25, int $offset = 0, ?int $external = null): array
    {
        $model = $this->getModel('user');
        [$conditions, $bindings] = $this->buildUserSearchConditions($accountId, $term, $roleId, $groupId, $external);

        $sql = sprintf(
            'SELECT u.id, u.account_id, u.firstname, u.lastname, u.email, u.type_id,
                    u.display_name, u.job_title, u.contact_number, u.status,
                    ar.id AS account_role_id, ar.label AS account_role_label,
                    ag.id AS account_group_id, ag.label AS account_group_label
              FROM %s u
              LEFT JOIN account_role_user_mapping arum ON u.id = arum.user_id
              LEFT JOIN account_role ar ON ar.id = arum.account_role_id
              LEFT JOIN role r ON r.id = ar.role_id
              LEFT JOIN account_group_user_mapping agum ON u.id = agum.user_id
              LEFT JOIN account_group ag ON ag.id = agum.account_group_id
              WHERE %s
              ORDER BY u.firstname ASC
              LIMIT %d OFFSET %d',
            $model->getName(),
            implode(' AND ', $conditions),
            $limit,
            $offset
        );

        $results = $model->getDB()::getAll($sql, $bindings);

        return $this->buildSearchUsersResult($results);
    }

    /**
     * @return array{0: string[], 1: array}
     */
    private function buildUserSearchConditions(int $accountId, ?string $term, ?int $roleId, ?int $groupId, ?int $external): array
    {
        $conditions = ['u.account_id = ?'];
        $bindings = [$accountId];

        if ($roleId !== null) {
            $conditions[] = 'EXISTS (SELECT 1 FROM account_role_user_mapping WHERE user_id = u.id AND account_role_id = ?)';
            $bindings[] = $roleId;
        }

        if ($groupId !== null) {
            $conditions[] = 'EXISTS (SELECT 1 FROM account_group_user_mapping WHERE user_id = u.id AND account_group_id = ?)';
            $bindings[] = $groupId;
        }

        if ($term !== null) {
            $conditions[] = '(u.firstname LIKE ? OR u.lastname LIKE ? OR u.email LIKE ? OR CONCAT(u.firstname, \' \', u.lastname) LIKE ?)';
            $bindings[] = '%' . $term . '%';
            $bindings[] = '%' . $term . '%';
            $bindings[] = '%' . $term . '%';
            $bindings[] = '%' . $term . '%';
        }

        $this->appendExternalRoleCondition($conditions, $bindings, $external);

        return [$conditions, $bindings];
    }

    private function appendExternalRoleCondition(array &$conditions, array &$bindings, ?int $external): void
    {
        if ($external === null) {
            return;
        }

        if ($external === 0) {
            $conditions[] = '(r.is_external = ? OR r.is_external IS NULL)';
            $bindings[] = 0;
        } else {
            $conditions[] = 'r.is_external = ?';
            $bindings[] = 1;
        }
    }

    private function buildSearchUsersResult(array $results): array
    {
        $data = [];
        $index = [];
        $seenRoles = [];
        $seenGroups = [];

        foreach ($results as $r) {
            $this->accumulateSearchUserRow($r, $data, $index, $seenRoles, $seenGroups);
        }

        return $data;
    }

    private function accumulateSearchUserRow(array $r, array &$data, array &$index, array &$seenRoles, array &$seenGroups): void
    {
        $uid = $r['id'];
        if (!isset($index[$uid])) {
            $index[$uid] = count($data);
            $data[] = [
                'id'             => $r['id'],
                'account_id'     => $r['account_id'],
                'firstname'      => $r['firstname'],
                'lastname'       => $r['lastname'],
                'email'          => $r['email'],
                'type_id'        => $r['type_id'],
                'display_name'   => $r['display_name'],
                'job_title'      => $r['job_title'],
                'contact_number' => $r['contact_number'],
                'active'         => (int)$r['status'] === USER::USER_STATUS_ACTIVE,
                'role'           => [],
                'groups'         => [],
            ];
        }
        $i = $index[$uid];

        $roleId = $r['account_role_id'];
        if ($roleId !== null && !isset($seenRoles[$uid][$roleId])) {
            $seenRoles[$uid][$roleId] = true;
            $data[$i]['role'][] = [
                'id'    => $roleId,
                'label' => $r['account_role_label'],
            ];
        }

        $groupId = $r['account_group_id'];
        if ($groupId !== null && !isset($seenGroups[$uid][$groupId])) {
            $seenGroups[$uid][$groupId] = true;
            $data[$i]['groups'][] = [
                'id'    => $groupId,
                'label' => $r['account_group_label'],
            ];
        }
    }

    /**
     * @param Request $request
     * @param int $accountId
     * @param string|null $term
     * @param int|null $roleId
     * @param int|null $groupId
     * @return SqlPaginator
     */
    public function getAccountUsersPaginatorByAccount(
        Request $request,
        int $accountId,
        ?string $term = null,
        ?int $roleId = null,
        ?int $groupId = null,
        ?int $external = null
    ): SqlPaginator {
        $model = $this->getModel('user');
        $conditions = ['u.account_id = ' . $accountId];

        if ($roleId !== null) {
            $conditions[] = 'EXISTS (SELECT 1 FROM account_role_user_mapping WHERE user_id = u.id AND account_role_id = ' . $roleId . ')';
        }

        if ($groupId !== null) {
            $conditions[] = 'EXISTS (SELECT 1 FROM account_group_user_mapping WHERE user_id = u.id AND account_group_id = ' . $groupId . ')';
        }

        if ($term !== null) {
            $escaped = addslashes($term);
            $conditions[] = "(u.display_name LIKE '%{$escaped}%' OR u.email LIKE '%{$escaped}%')";
        }

        if ($external !== null) {
            if ($external === 1) {
                $conditions[] = "EXISTS (
                    SELECT 1 FROM account_role_user_mapping arum
                    INNER JOIN account_role ar ON ar.id = arum.account_role_id
                    INNER JOIN role r ON r.id = ar.role_id
                    WHERE arum.user_id = u.id AND r.is_external = 1
                )";
            } else {
                $conditions[] = "(
                    EXISTS (
                        SELECT 1 FROM account_role_user_mapping arum
                        INNER JOIN account_role ar ON ar.id = arum.account_role_id
                        INNER JOIN role r ON r.id = ar.role_id
                        WHERE arum.user_id = u.id AND r.is_external = 0
                    )
                    OR NOT EXISTS (
                        SELECT 1 FROM account_role_user_mapping arum
                        WHERE arum.user_id = u.id
                    )
                )";
            }
        }

        $sql = sprintf(
            'SELECT COUNT(*) as c FROM %s u WHERE %s',
            $model->getName(),
            implode(' AND ', $conditions)
        );

        return new SqlPaginator($request, $model, $sql);
    }

}
