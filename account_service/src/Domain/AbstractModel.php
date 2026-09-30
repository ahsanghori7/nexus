<?php

    namespace App\Domain;

    use App\Infrastructure\Persistence\DB;
    use JsonSerializable;
    use App\Domain\DomainException;

    /**
     * Class AbstractModel
     * @package App\Domain
     */
    class AbstractModel implements JsonSerializable
    {
        /**
         * Allow for child classes to override the default
         * resource name via a constant
         * @const string
         */
        const NAME = "";

        /**
         * Allow for override of id field name
         */
        const ID_FIELD = "id";

        /**
         * @var array
         */
        protected $columns = [];

        /**
         * @var array
         */
        protected $data = [];

        /**
         * @var array
         */
        protected $errors = [];

        /**
         * @var array
         */
        protected $response_column_blacklist = [];

        /**
         * @return \RedBeanPHP\R
         */
        public function getDB()
        {
            /** @var \RedBeanPHP\R $db */
            $db = DB::getConnection('r');
            return $db;
        }

        /**
         * Maintain list of associated models
         * @var array
         */
        protected $children = [];

        /*
         * Keep track of all sql filters
         */
        protected $sql_filters = [];
        /**
         * @param array $data
         * @return array
         */
        public function populate(array $data): array
        {
            $values = $this->data;
            $cols = [];
            foreach ($this->getColumns() as $column => $column_data) {
                //if there is no validation supplied for the columns the column will be actually $column_data
                if(is_scalar($column) && is_scalar($column_data)){
                    $column = $column_data;
                }

                if(isset($column_data['isNull'])){
                    $values[$column] = null;
                }

                if (isset($data[$column])) {
                    $values[$column] = $data[$column];
                }
                $cols[] = $column;
            }

            //If keys are added to the data property before save then they need to be filtered
            //out if not valid columns
            foreach(array_diff(array_keys($values), $cols) as $invalidKey) {
                if($invalidKey !== $this::ID_FIELD) {
                    unset($values[$invalidKey]);
                }
            }

            return $values;
        }

        /**
         * @param array $data
         */
        public function validate(array $data): void
        {

            if (!$this->isLoaded()) {
                $data = $this->populate($data);
            }

            $columns = $this->getColumns();

            foreach ($data as $k => $v) {

                $column_data = $columns[$k] ?? null;

                if (isset($column_data)) {

                    //cast the values to the accepted type
                    if (isset($column_data['type'], $v)) {
                        $this->typeCastValue($v, $column_data['type']);
                    }

                    //validate the dolumns
                    $this->validateColumn($data, $column_data, $k);
                }
            }
        }

        /**
         * @param string|null $k
         * @param null $def
         * @return array|mixed|null
         */
        public function getData(?string $k = null, $def = null) : mixed
        {
            if ($k) {
                return $this->data[$k] ?? $def;
            }

            return $this->data;
        }

      /**
       * @TODO SETDATA WILL NOT SAVE DATA TO DB
       * @param array $data
       * @return $this
       */
        public function setData(array $data)
        {
          if ($data) {
            foreach($data as $k => $v) {
               $this->data[$k] = $v;
            }
          }

          return $this;
        }

        public function validateColumn(array $data, $column_data, string $column): void
        {
            if (isset($column_data['validate'])) {
                if (strpos($column_data['validate'], '|') !== false) {
                    $column_data['validate'] = explode("|", $column_data['validate']);
                } else {
                    $column_data['validate'] = (array) $column_data['validate'];
                }
                $rules = [];
                foreach ($column_data['validate'] as $validate) {
                    if (strpos($validate, ':') !== false) {
                        $rules[] = explode(":", $validate);
                    }
                }

                if ($rules) {
                    foreach ($rules as $rule) {

                        if (!isset($data[$column])) {
                            $this->errors[] = $column . ' is a required field';
                            continue;
                        }

                        switch ($rule[0]) {
                            case "maxlength":
                                if (strlen($data[$column]) > $rule[1]) {
                                    $this->errors[] = "Max length exceeded for $column";
                                }
                                break;
                            case "minlength":
                                if (strlen($data[$column]) < $rule[1]) {
                                    $this->errors[] = "$column requires minimum length of " . $rule[1];
                                }
                                break;
                            default:
                                throw new DomainException("Unknown validation rule: " . $rule[0]);
                        }
                    }
                }
            }
        }

        /**
         * @param array $data
         * @TODO check if the query was successfully
         */
        public function save(array $data, $insertOnly=false)
        {
            $tbl = $this->getTable();

            $this->validate($data);

            if ($this->errors) {
                throw new DomainException(implode("\n", $this->errors));
            }

            $values = $this->beforeSave($this->populate($data),$data);
            foreach ($values as $field => $value) {
                try{
                    $tbl->$field = $value;
                    $this->data[$field] = $value;
                }
                catch(\Exception $e) {
                    throw new \Exception(sprintf("Failed to save %s incorrect field %s", $this->getName(), $field));
                }
            }

            try {
                $retval = $this->saveEntity($tbl);
            } catch (\Exception $e) {
                throw new DomainException($e->getMessage());
            }

            if(!$insertOnly) {
                $this->data[$this::ID_FIELD] = $retval;
            }

            $this->afterSave();
            return $this;
        }

        /**
         * Allow override of RedBean store method for save
         * @return mixed
         * @throws \Exception
         */
        public function saveEntity($tbl) {
            if(method_exists($this->getDB(), 'store')) {
                return $this->getDB()::store($tbl);
            }
        }

        /**
         * Allow children to alter values prior to db insert and update
         * @param array $values
         * @return array
         */
        public function beforeSave(array $values,array $raw): array
        {
            return $values;
        }

        /**
         * After save hook.
         */
        public function afterSave()
        {
        }

        public function delete($id)
        {
            if(method_exists($this->getDB(), 'findOne')) {
                $row = $this->getDB()::findOne(
                    $this->getName(),
                    'id = ?',
                    array($id)
                );
                if ( $row ) {
                    if(method_exists($this->getDB(), 'trash')) {
                        return $this->getDB()::trash($row);
                    }
                }
            }
        }

        /**
         * @param array $clauses
         * @return mixed
         * @throws \ReflectionException
         */
        public function deleteWhere(array $clauses)
        {
            $where = [];
            foreach ($clauses as $col => $clause) {
                $value = (is_string($clause)) ? "'" . $clause . "'" : $clause;
                $where[] = sprintf("`%s` = %s", $col, $value);
            }

            $delete = sprintf("DELETE FROM %s WHERE %s", $this->getName(), implode(" AND ", $where));
            if(method_exists($this->getDb(), 'exec')) {
                return $this->getDb()::exec($delete);
            }
        }

      /**
       * @return mixed
       * @throws \ReflectionException
       */
      public function deleteAll()
        {
            if(method_exists($this->getDB(), 'exec')) {
                return $this->getDB()::exec('DELETE FROM ' . $this->getName());
            }
        }

        public function load($id, $idField = self::ID_FIELD)
        {
            if(method_exists($this->getDb(), 'getRow')) {
                $this->data = $this->getDb()::getRow(
                    sprintf('SELECT * FROM %s WHERE %s=? LIMIT 1', $this->getName(), $idField),
                    [$id]
                );
            }

            if ($this->isLoaded()){
                $this->afterLoad($id);
            }
            return $this;
        }

        /**
         * After a successful load, allow a model to perform an action
         */
        public function afterLoad($id) {}

        /**
         * @return bool
         */
        public function isLoaded(): bool
        {
            return $this->getId() !== false;
        }

        /**
         * @return array
         */
        public function getColumns(): array
        {
            return $this->columns;
        }

        /**
         * @param string $alias
         * @param array $blacklist
         * @return array
         */
        public function getColumnNames(string $alias="", array $blacklist=[]) : array {
            $cols = [];
            foreach ($this->columns as $name => $data) {
                if(in_array($name, $blacklist)) {
                    continue;
                }
                $label = $name;
                if($alias) {
                    $label = sprintf("%s.%s", $alias, $label);
                }

                $cols[] = $label;
            }

            return $cols;
        }

        /**
         * @return string
         * @ToDo Refactor class to only use static method for get name
         * @throws \ReflectionException
         */

        public static function getStaticName(): string
        {
            $cls = get_called_class();
            //Error: If condition is always false.
            if ($cls::NAME) {
                return $cls::NAME;
            }

            return strtolower((new \ReflectionClass($cls))->getShortName());
        }

        /**
         * @return string
         * @throws \ReflectionException
         */
        public function getName(): string
        {
            if ($this::NAME) {
                $name = $this::NAME;
            } else {
                $name = (new \ReflectionClass($this))->getShortName();
            }

            return $this->formatTblName($name);
        }

        /**
         * @param string $name
         * @return string
         */
        public function formatTblName(string $name): string
        {
            return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $name));
        }

        /**
         * @return false|mixed
         */
        public function getId()
        {
            $id = $this->data[self::ID_FIELD] ?? false;
            if ($id) {
                $id = (int) $id;
            }
            return $id;
        }

        /**
         * @return mixed
         * @throws \ReflectionException
         */
        public function getTable()
        {
            if(!$this->getId()) {
                if(method_exists($this->getDB(), 'xdispense')) {
                    /** @phpstan-ignore-next-line */
                    return $this->getDB()::xdispense($this->getName());
                }
            }

            if(method_exists($this->getDB(), 'load')) {
                return $this->getDB()::load($this->getName(), $this->getId());
            }
        }

        /**
         * @param string $filter
         * @return bool
         */
        public function canFilter(string $filter): bool
        {
            if (isset($this->getColumns()[$filter])) {
                return true;
            }
            return in_array($filter, $this->getColumns(), true) !== false;
        }

        /**
         * @TODO add a model validation exception handler
         * @throws \Exception
         */
        public function sanitizeValue($value): string
        {
            $value = strip_tags($value);

            $string_length = 256;

            if (strlen($value) > $string_length) {
                throw new \Exception('invalid string length value');
            }
            $value = substr($value, 0, $string_length);
            $value = addslashes($value);
            $value = "'" . $value . "'";

            return $value;
        }

        public function typeCastValue(&$value, $castType): void
        {
            $castTypes = [
                'int',
                'integer',
                'bool',
                'boolean',
                'array',
                'object',
                'string'
            ];

            if (in_array($castType, $castTypes, true) !== false) {
                settype($value, $castType);
            }
        }

        /**
         * @param array $filters
         * @return $this
         * @throws \ReflectionException
         */
        public function findOne(array $filters): AbstractModel
        {
            $records = $this->findAll($filters);
            if (count($records) > 1) {
                throw new \Exception('multiple records found for findOne');
            }

            if (!$records) {
                throw new \Exception('no records found');
            }

            $this->data = $records[0] ?? [];

            return $this;
        }

        /**
         * @param array $filters
         * @param int $limit
         * @param int $offset
         * @param bool $assoc_array
         * @return array
         * @throws \ReflectionException
         * @TODO add a model validation exception handler
         */
        public function findAll(array $filters = [], int $limit = 0, int $offset = 0, bool $assoc_array = false): array
        {
            $sql = $this->getSelect();
            $sql = $this->applyFilters($sql, $filters);
            $sql = $this->applyLimit($sql, $limit, $offset);

            if ($assoc_array) {
                if(method_exists($this->getDB(), 'getAssoc')) {
                    return $this->getDB()::getAssoc($sql);
                }
            }
            if(method_exists($this->getDB(), 'getAll')) {
                return $this->getDB()::getAll($sql);
            }

            return [];
        }

        /**
         * @return int
         */
        public function getMaxLimit() {
            return DB::getFindAllLimit();
        }

        /**
         * @param array $filters
         * @return mixed
         * @throws \ReflectionException
         */
        public function all(array $filters = [])
        {
            if(method_exists($this->getDB(), 'getAll')) {
                $sql = $this->applyFilters($this->getSelect(), $filters);
                return $this->getDB()::getAll($sql);
            }
        }

        /**
         * @param string $sql
         * @param int $limit
         * @param int $offset
         * @return string
         */
        public function applyLimit(string $sql, int $limit=0, int $offset = 0) : string {
            $max = $this->getMaxLimit();
            if(!$limit || $limit > $max) {
                $limit = $max;
            }

            if($limit) {
                $sql .= sprintf(' LIMIT %s,%s', $offset, $limit);
            }

            return $sql;
        }

        /**
         * @return string
         * @throws \ReflectionException
         */
        public function getSelect(array $cols=["*"]) :string {
            return sprintf("SELECT %s FROM %s", implode(",", $cols), $this->getName());
        }

        /**
         * @param array $filters
         * @throws \Exception
         */
        public function applyFilters(string $sql, array $filters) : string {
            $this->sql_filters = [];
            if ($filters) {
                foreach ($filters as $key => $value) {
                    if ($this->canFilter($key)) {
                        if (is_array($value)) {
                            $this->sql_filters[] = $key . ' ' . $value[0] . ' ' . $this->sanitizeValue($value[1]);
                        }
                        elseif(preg_match("/\[[0-9,]+\]/", $value, $match)) {
                            $values = explode(",", str_replace(["[", "]"], "", $value));
                            $this->sql_filters[] = sprintf("%s IN(%s)", $key, implode(",", $values));
                        }
                        else {
                          $this->sql_filters[] = $key . ' = ' . $this->sanitizeValue($value);
                        }
                    }
                }
            }
            if($this->sql_filters) {
                $sql .= ' WHERE ' . implode(" AND ", $this->sql_filters);
            }
            return $sql;
        }


        /**
         * @return array
         */
        public function jsonSerialize() : mixed
        {
            $json = [];
            foreach ($this->data as $k => $v) {
                if (in_array($k, $this->response_column_blacklist, true) !== false) {
                    continue;
                }
                $json[$k] = $v;
            }

            foreach($this->children as $name => $child) {

                $json[$name] = $child;
            }

            return $json;
        }

        /**
         * @return string
         */
        public function getIdField(): string
        {
            return $this::ID_FIELD;
        }

        /**
         * @return int
         * @throws \ReflectionException
         */
        public function getCount(array $where = []) : int {

            $sql = sprintf("SELECT COUNT(*) as c FROM %s", $this->getName());
            if($where) {
                $sql .= " WHERE ";
                $clauses = [];
                foreach($where as $f => $v) {
                    $clauses[] = "$f='$v'";
                }
                $sql .= implode(" AND ", $clauses);
            }
            $sql .= ";";
            if(method_exists($this->getDb(), 'getRow')) {
                $count = $this->getDb()::getRow($sql);
            }
            $v = $count["c"] ?? 0;
            return (int) $v;
        }

        /**
         * @param string $col
         * @param string $value
         * @return mixed
         * @throws \ReflectionException
         */
        public function getWhereLike(string $col, string $value) {
            $query = sprintf("SELECT * FROM %s WHERE `%s`", $this->getName(), $col);

            if(method_exists($this->getDb(), 'getAll')) {
                return $this->getDb()::getAll(
                    $query . " LIKE('%" . $value . "%');"
                );
            }
        }
    }
