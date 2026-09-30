<?php


    namespace App\Infrastructure\Testing\Mock;

    use App\Domain\AbstractModel;

    class Model extends AbstractModel
    {
        protected $name;

        protected $records = [];

        /**
         * Model constructor.
         * @param string $name
         * @param array $records
         */
        public function __construct(string $name, array $records = [])
        {
            $this->name = $name;
            $this->records = $records;
        }

        /**
         * @ToDo Mock the database
         * @phpstan-ignore-next-line
         * @return \App\Infrastructure\Persistence\DB|array
         *
         */
        public function getDB()
        {
            return [];
        }

        public function getCount(array $where = []): int
        {
            return count($this->records);
        }
    }
