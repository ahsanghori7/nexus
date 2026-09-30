<?php
    declare(strict_types=1);

    namespace App\Domain\Trade;

    use App\Domain\AbstractModel;

    /**
     * Class Account
     * @package App\Domain\Account
     */
    class Category extends AbstractModel
    {
        const NAME = "trade_category";

        /**
         * @var array
         */
        protected $columns = [
            'id' => [
                'type' => 'int'
            ],
            'label' => [
                'type' => 'string',
                'required' => true
            ],
            'icon' => [
              'type' => 'string',
              'required' => false
            ],
            'rules' => [
                'type' => 'string',
                'required' => false
            ]
        ];

        /**
         * Not ideal with hardcoded sql, perhaps with a better ORM this type of mapping join might be a bit cleaner..
         * @param array|string[] $cols
         * @return string
         */
        public function getSelect(array $cols = ["*"]): string
        {
            $sql =  sprintf("SELECT c.id as cat_id, c.label as cat, c.icon as icon, t.id as trade_id, t.label as trade, c.rules as rules FROM %s", "trade_category_mapping m");
            $sql .= ' join trade_category c on c.id = m.category_id';
            $sql .= ' join trade t on t.id = m.trade_id';
            return $sql;
        }

        /**
         * Same as AbstractModel::findAll() but hides trades restricted to another
         * account. "account_id" is the id of the account asking rather than a real
         * column, so it is pulled out before the generic filter builder runs.
         * Callers that omit it still get every trade - this list is also used to
         * resolve trade ids/labels, which must keep resolving restricted rows.
         *
         * @param array $filters
         * @param int $limit
         * @param int $offset
         * @param bool $assoc_array
         * @return array
         * @throws \ReflectionException
         */
        public function findAll(array $filters = [], int $limit = 0, int $offset = 0, bool $assoc_array = false): array
        {
            $accountId = (int) ($filters['account_id'] ?? 0);
            unset($filters['account_id']);

            if (!$accountId) {
                return parent::findAll($filters, $limit, $offset, $assoc_array);
            }

            // NULL restricted_account_id means the trade is globally visible.
            $sql = $this->applyFilters($this->getSelect(), $filters);
            $sql .= ($this->sql_filters ? ' AND ' : ' WHERE ') . sprintf(
                '(t.restricted_account_id IS NULL OR t.restricted_account_id = %d)',
                $accountId
            );

            if (method_exists($this->getDB(), $assoc_array ? 'getAssoc' : 'getAll')) {
                return $assoc_array ? $this->getDB()::getAssoc($sql) : $this->getDB()::getAll($sql);
            }

            return [];
        }

        /**
         * @param string $sql
         * @param int $limit
         * @param int $offset
         * @return string
         */
        public function applyLimit(string $sql, int $limit=0, int $offset = 0) : string {
            return $sql;
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
    }
