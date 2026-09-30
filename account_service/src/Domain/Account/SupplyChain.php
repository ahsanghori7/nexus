<?php


namespace App\Domain\Account;

use App\Domain\AbstractModel;
use App\Domain\Account\Account;
use App\Domain\Region\RegionRepository;
use App\Infrastructure\Environment;

class SupplyChain extends AbstractModel
{
    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'parent_id' => [
            'type' => 'int'
        ],
        'child_id' => [
            'type' => 'int'
        ],
        'status_id' => [
            'type' => 'int'
        ],
        'created_at' => [
            'type' => 'text'
        ],
        'updated_at' => [
            'type' => 'text'
        ]
    ];

    /**
     * @var array
     */
    protected $tradeIndex = [];


    /**
     * Not ideal with hardcoded sql, perhaps with a better ORM this type of mapping join might be a bit cleaner..
     * @param array|string[] $cols
     * @return string
     */
    public function getSelect(array $cols = ["*"]): string
    {
        $user = [
            "u.id as user_id","u.firstname", "u.lastname", "u.display_name",
            "u.email as user_email", "sub.meta as meta", 'u.type_id as user_type',
            "s.created_at as added_to_date"
        ];
        $sql =  sprintf("SELECT sub.*, %s, s.parent_id, s.child_id  FROM %s",
            implode(",", $user), $this->getName() . " s"
        );
        $sql .= ' join account sub on sub.id = s.child_id';
        $sql .= ' join user u on u.account_id = sub.id';
        return $sql;
    }


    /**
     * @param RegionRepository $repo
     * @return $this
     * @throws \Exception
     */
    public function mapRegions(RegionRepository $repo) {
        $pid = $pid = $this->getParentId();
        $ids = $this->getChildIds();
        if($ids && $pid) {
            $mappings = $repo->getMappings($ids, "supply_chain", $pid);
            $this->addRegionMapping($mappings);
        }
        return $this;
    }

    /**
     * @param array $mappings
     * @return $this
     */
    public function addRegionMapping(array $mappings) {
        $trades = $this->getTradeIndex();
        if($trades) {
            foreach ($trades as $tid => $trade) {
                foreach($trade as $i => $account) {
                    $regions = ["*"];
                    if(isset($mappings[$account["id"]])) {
                        $regions = $mappings[$account["id"]];
                    }
                    $this->tradeIndex[$tid][$i]["region"] = $regions;
                }
            }
        }
        return $this;
    }

    /**
     * @return array
     */
    public function getChildIds() : array {
        $ids = [];
        foreach($this->getTradeIndex() as $tid => $t) {
            foreach ($t as $a) {
                $ids[] = $a["id"];
            }
        }
        return array_unique($ids);
    }

    /**
     * @param \App\Domain\Account\Account $sub
     * @param array $row
     * @return array
     */
    public function initSubAccountFields(Account $sub, array $row) {
        $accountFields = $this->getAccountFields(
            $row, $sub->getMeta($row["parent_id"])
        );
        //We needed this to fix the logos for supply chain. It should be in the getAccountLogo function, but would break
        //Images in the app that are prefixed in the template, such as document creator (as of writing this)
        $logo = $sub->getAccountLogoUrl($row["id"], $row["type_id"], $accountFields['logo']);
        $accountFields['logo'] = $this->appendStaticMediaUrl($logo);
        $accountFields['trades'] = [];
        $accountFields['parent_id'] = $row["parent_id"];

        return $accountFields;
    }

    /**
     * @param string $media
     * @return string
     */
    public function appendStaticMediaUrl(string $media) : string {
        $prefix = Environment::getValue("LOGO_MEDIA_HOST");
        if($prefix) {
            $media = rtrim($prefix, "/") . "/" . ltrim($media, "/");
        }
        return $media;
    }

    /**
     * @param array $data
     * @param array $meta
     * @return array
     */
    public function getAccountFields(array $data, array $meta = []) : array {
        $columns = (new Account())->getColumns();
        $fields = [];

        $src = array_merge($data, $meta);
        foreach($columns as $k => $v) {
            $value = $src[$k] ?? "";
            $fields[$k] = $value;
        }
        return $fields;
    }

    /**
     * @param Account $account
     * @return $this
     */
    public function loadByAccount(Account $account, $trades = []) {
        if($account->isLoaded()) {
            $sql = $this->getSelect();
            $sql .= " WHERE s.parent_id = " . $account->getId();
            if($trades) {
                $sql .= " AND s.trade_id in(". implode(",", $trades) .")";
            }

            $data = [];
            if(method_exists($this->getDB(), 'getAll')) {
                foreach ($this->getDB()::getAll($sql) as $row) {

                    $sub = (new Account())->setData($row);
                    // Account meta can be used to override values to allow for
                    // Main contractors to have their own changes but share a external subcontractor
                    $meta = $sub->getMeta($row["parent_id"]);
                    if ( !isset($data[$row["id"]]) ) {
                        $data[$row["id"]] = $this->initSubAccountFields($sub, $row);
                        if ( $meta ) {
                            $user = $meta["user"] ?? [];
                            //Required format is to have id => data, so mock an id here.
                            $data[$row["id"]]["users"] = [1 => $user];
                            unset($data[$row["id"]]["meta"]);
                        }
                    }

                    $data[$row['id']]['trades'][] = $row['trade_id'] ?? null;
                    if ( !$meta ) {
                        $data[$row["id"]]["users"][$row['user_id']] = array_diff_key($row, $data[$row["id"]]);
                    }
                }
            }
            $this->data = $data;
        }
        return $this;
    }
    /**
     * @return array
     */
    public function getTradeIndex() : array {
        if($this->data && !$this->tradeIndex) {
            foreach($this->data as $row) {

              foreach($row['trades'] as $trade){
                $this->tradeIndex[$trade][] = $row;
              }

            }
        }
        return $this->tradeIndex;
    }

    /**
     * @return mixed
     */
    public function getParentId() {
        foreach($this->data as $row) {
            return $row["parent_id"];
        }
    }

    /**
     * @param int $trade_id
     * @return array
     */
    public function getChainByTrade(int $trade_id) : array {
        $index = $this->getTradeIndex();
        $chain = [];
        if(isset($index[$trade_id])) {
            return $chain = $index[$trade_id];
        }
        return $chain;
    }

    /**
     * @return mixed
     */
    public function getTable()
    {
        if(!$this->getId()){
            if(method_exists($this->getDB(), 'getRedBean')) {
                return $this->getDB()::getRedBean()->dispense($this->getName());
            }
        }
        if(method_exists($this->getDB(), 'load')) {
            return $this->getDB()::load($this->getName(), $this->getId());
        }
    }

    /**
     * @param int $parentId
     * @param int $childId
     * @throws \ReflectionException
     */
    public function clean(int $parentId, int $childId) {
        $this->deleteWhere(["parent_id" => $parentId, "child_id" => $childId]);
        return $this;
    }

    /**
     * @param int $parentId
     * @param int $childId
     * @param array $trades
     * @param array $failures
     */
    public function mapTrades(int $parentId, int $childId, array $trades = [], &$failures=[])
    {
        foreach ($trades as $tradeId) {
            $data = [
                "parent_id" => $parentId,
                "child_id" => $childId,
                "trade_id" => (int) $tradeId
            ];
            try {
                $this->save($data, true);
            }
            catch(\Exception $e) {
                $failures[] = $tradeId;
            }
        }
    }

    /**
     * @param int $parentId
     * @param int $childId
     * @return bool
     * @throws \ReflectionException
     */
    public function exists(int $parentId, int $childId) : bool {
        $data = [];
        if(method_exists($this->getDb(), 'getRow')) {
            $data = $this->getDb()::getRow(
                sprintf('SELECT * FROM %s WHERE parent_id = ? AND child_id = ? LIMIT 1', $this->getName()),
                [$parentId, $childId]
            );
        }

        return count($data) > 0;
    }

    /**
     * @return array
     * @throws \Exception
     */
    public function getSupplyChainByAccountId(int $aid, int $limit = 0, int $offset = 0)
    {
        $nameTable = $this->getName();
        $query = "SELECT * FROM $nameTable where parent_id = $aid";
        if($limit) {
            $query .= " LIMIT $limit";
        }
        if($offset) {
            $query .= " OFFSET $offset";
        }


        if(method_exists($this->getDb(), 'getAll')) {
            $results = $this->getDb()::getAll($query);
        }
        return $results;
    }

    /**
     * @param int $aid
     * @param int $limit
     * @param int $offset
     * @param array $groupIds
     * @param array $attributes
     * @param string $term
     * @param string $orderBy
     * @param int $order
     * @param string $activationStatus
     * @param string $pqqStatus
     * @return array
     */
    public function getSupplyChainAccountsByParentId(int $aid, int $limit = 25, int $offset = 0, array $groupIds = [], array $attributes = [], string $term = "", string $orderBy = "company", int $order = 0, ?string $activationStatus = null, ?string $pqqStatus = null)
    {
        $query = $this->getCollectionQuery($aid, $groupIds, $limit, $offset, $attributes, $term, orderBy:$orderBy, order:$order, activationStatus:$activationStatus, pqqStatus:$pqqStatus);
        if(method_exists($this->getDb(), 'getAll')) {
            $results = $this->getDb()::getAll($query);
        }
        return $results ?? [];
    }

    /**
     * Get all the supply chain ids for a given account id
     * @param int $aid
     * @param array $attributes
     * @param $limit
     * @param $offset
     * @param string $term
     * @param string $orderBy
     * @param int $order
     * @param string $activationStatus
     * @param string $pqqStatus
     * @return array
     */
    public function getSupplyChainIds(int $aid, array $attributes = [], $limit = 0, $offset = 0, string $term = "", string $orderBy = "company", int $order = 0, ?string $activationStatus = null, ?string $pqqStatus = null)
    {
        $ids = $this->getDb()::getAll($this->getCollectionQuery($aid, [], $limit, $offset, $attributes, $term, true, orderBy:$orderBy, order:$order, activationStatus:$activationStatus, pqqStatus:$pqqStatus));
        return array_column($ids, "id");
    }

    /**
     * Get the query for the supply chain accounts by parent id, allow for getting the ids or data
     * of the accounts and filtering by attributes
     * @param int $aid
     * @param array $supplyChainIds
     * @param int $limit
     * @param int $offset
     * @param array $attributes
     * @param bool $distinct
     * @return string
     */
    public function getCollectionQuery(
        int $aid,
        array $supplyChainIds = [],
        $limit = 0,
        $offset = 0,
        array $attributes = [],
        string $term = "",
        bool $distinct = false,
        bool $count = false,
        string $orderBy = "company",
        int $order = 0,
        ?string $activationStatus = null,
        ?string $pqqStatus = null,
    ) : string {

        $nameTable = $this->getName();

        $query = "";
        $query .= " JOIN $nameTable sc on sc.child_id = a.id";
        $query .= " JOIN account_attribute_mapping am on am.group_id = sc.child_id and am.account_id = sc.parent_id";
        $query .= " JOIN attribute att on att.id = am.attribute_id";
        $query .= " JOIN attribute_type aty on aty.id = att.attribute_type_id";
        $query .= " JOIN membership m on m.account_id = a.id";
        $query .= " WHERE sc.parent_id = $aid";
        if($supplyChainIds) {
            $query .= " AND sc.child_id IN (" . implode(",", $supplyChainIds) . ")";
        }

        if($term) {
            $term = addslashes($term); // prevent SQL injection
            $query .= " AND EXISTS (
                         SELECT 1
                         FROM account_attribute_mapping am2
                         JOIN attribute att2 ON att2.id = am2.attribute_id
                         WHERE
                          am2.group_id = sc.child_id
                          AND am2.account_id = sc.parent_id
                          AND (a.name LIKE '%$term%' OR att2.label LIKE '%$term%')
                      )";
        }

        if(isset($activationStatus)) {
            $activationStatus = filter_var($activationStatus, FILTER_VALIDATE_BOOLEAN);
            if($activationStatus) {
                $query .= " AND m.subscription_id != 15";
            } else {
                $query .= " AND m.subscription_id = 15";
            }
        }

        // PHP treats the string "0" as falsy explicitly check for null and empty string
        if(isset($pqqStatus) && $pqqStatus !== null && $pqqStatus !== '') {
            // Convert comma-separated string to array
            $statuses = is_array($pqqStatus)
                ? $pqqStatus
                : array_map('intval', explode(',', $pqqStatus));

            // Remove duplicates and invalid values
            $statuses = array_unique(array_filter($statuses, function($s) {
                return in_array($s, [0, 1, 2], true);
            }));

            if(!empty($statuses)) {
                $conditions = [];

                $topLevel = "psm.parent_id = 0";

                foreach($statuses as $status) {
                    if($status === 1) {
                        // GREEN - Completed
                        $conditions[] = "(
                            NOT EXISTS (
                                SELECT 1 FROM prequalification_section_mapping psm
                                WHERE psm.account_id = a.id
                                AND $topLevel
                                AND psm.status = 0
                            )
                            AND EXISTS (
                                SELECT 1 FROM prequalification_section_mapping psm
                                WHERE psm.account_id = a.id
                                AND $topLevel
                            )
                        )";

                    } elseif($status === 0) {
                        // RED - Not Started
                        $conditions[] = "(
                            NOT EXISTS (
                                SELECT 1 FROM prequalification_section_mapping psm
                                WHERE psm.account_id = a.id
                                AND $topLevel
                                AND psm.status = 1
                            )
                        )";

                    } elseif($status === 2) {
                        // YELLOW - Partially Completed
                        $conditions[] = "(
                            EXISTS (
                                SELECT 1 FROM prequalification_section_mapping psm
                                WHERE psm.account_id = a.id
                                AND $topLevel
                                AND psm.status = 1
                            )
                            AND EXISTS (
                                SELECT 1 FROM prequalification_section_mapping psm
                                WHERE psm.account_id = a.id
                                AND $topLevel
                                AND psm.status = 0
                            )
                        )";
                    }
                }

                if(!empty($conditions)) {
                    $query .= " AND (" . implode(" OR ", $conditions) . ")";
                }
            }
        }

        if($distinct) {
            if($count) {
                $select = "SELECT COUNT(DISTINCT a.id) as count FROM account a";
            } else {
                $select = "SELECT DISTINCT a.id FROM account a";
            }

            if($attributes) {
                foreach($attributes as $type => $values) {
                    $query .= " AND EXISTS (
                        SELECT 1
                        FROM account_attribute_mapping am
                        INNER JOIN attribute att ON am.attribute_id = att.id
                        INNER JOIN attribute_type aty ON att.attribute_type_id = aty.id
                        WHERE am.group_id = a.id
                        AND am.account_id = sc.parent_id
                        AND aty.label = '$type'
                        AND am.attribute_id IN (" . implode(",", $values) . ")
                    )";
                }
            }

            if(!$count) {
                $query .= " GROUP BY a.id ";
            }

            if($orderBy === "company") {
                if($order === 1) {
                    $query .= " ORDER BY a.name DESC";
                } else {
                    $query .= " ORDER BY a.name ASC";
                }
            } else {
                if($order === 1) {
                    $query .= " ORDER BY a.created_at DESC";
                } else {
                    $query .= " ORDER BY a.created_at ASC";
                }
            }

            //Only apply the limit and offset if distinct is true as
            //we dont want to limit the number of attributes
            if($limit) {
                $query .= " LIMIT " . $limit;
            }
            if($offset) {
                $query .= " OFFSET " . $offset;
            }
        }
        else {
            $select = "SELECT a.*, a.type_id as type, m.subscription_id, att.label as attribute, aty.label as attribute_type, att.id as attribute_id FROM account a";
            if ($attributes) {
                foreach ($attributes as $type => $values) {

                    if (empty($values)) {
                        continue;
                    }

                    $query .= " AND EXISTS (
                        SELECT 1
                        FROM account_attribute_mapping amf
                        INNER JOIN attribute attf ON amf.attribute_id = attf.id
                        INNER JOIN attribute_type atyf ON attf.attribute_type_id = atyf.id
                        WHERE amf.group_id = a.id
                        AND amf.account_id = sc.parent_id
                        AND atyf.label = '$type'
                        AND amf.attribute_id IN (" . implode(',', $values) . ")
                    )";
                }
            }
        }

        return $select . $query;
    }

    /**
     * Get the count of the supply chain accounts by parent id, allow for getting the ids or data
     * of the accounts and filtering by attributes
     * @param int $aid
     * @param array $attributes
     * @param string $term
     * @param string $activationStatus
     * @param string $pqqStatus
     * @return int
     */
    public function getCollectionCount($aid, $attributes = [], string $term = "", ?string $activationStatus = null, ?string $pqqStatus = null) : int {
        $query = $this->getCollectionQuery($aid, [], 0, 0, $attributes, $term, true, true, activationStatus:$activationStatus, pqqStatus:$pqqStatus);

        if(method_exists($this->getDb(), 'getRow')) {
            $results = $this->getDb()::getRow($query);
        }
        return (int) ($results["count"] ?? 0);
    }
}
