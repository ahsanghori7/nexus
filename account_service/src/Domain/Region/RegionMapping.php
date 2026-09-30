<?php


namespace App\Domain\Region;

use App\Domain\AbstractTypedModel;
use App\Domain\Region\RegionMappingType;

class RegionMapping extends AbstractTypedModel
{
    /**
     * @var string
     */
    protected $typeModel = RegionMappingType::class;

    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'account_id' => [
            'type' => 'int',
            'required' => true
        ],
        'region_id' => [
            'type' => 'int',
            'required' => true
        ],
        'group_id' => [
            'type' => 'int',
            'required' => true
        ],
        'type_id' => [
            'type' => 'int',
            'required' => true
        ]
    ];

    /**
     * @param int $gid
     * @param int $tid
     * @return mixed
     * @throws \ReflectionException
     */
    public function getGroup(int $gid, int $tid) {
        if(method_exists($this, 'getAll')) {
            return $this->getAll(
                sprintf("SELECT * FROM %s WHERE group_id =? and type_id = ?", $this->getName()),
                [$gid, $tid]
            );
        }
    }

    /**
     * @param int $gid
     * @param int $tid
     * @param array $ids
     * @throws \ReflectionException
     */
    public function saveMappings(int $aid, int $tid, array $ids, ?int $gid = null) : void {
        $fields = ["`account_id`", "`type_id`", "`region_id`"];
        if($gid) {
            $fields[] = "`group_id`";
        }

        $sql = sprintf("INSERT INTO %s (%s)", $this->getName(), implode(",", $fields));
        $values = [];
        foreach (array_unique($ids) as $id) {
            $insert = sprintf("%s, %s, %s", $aid, $tid, $id);
            if($gid) {
                $insert .= ", $gid";
            }
            $values[] = sprintf("(%s)", $insert);
        }
        if($values) {
            $sql .= " VALUES " . implode(',', $values);
            if(method_exists($this->getDB(), 'exec')) {
                $this->getDB()::exec($sql);
            }
        }
    }

    /**
     * Really should move this to the abstraction layer
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
     * @param array $ids
     * @param int $typeId
     * @param int $maxChunk
     * @param int|null $gid
     * @return array
     * @throws \ReflectionException
     */
    public function getByIds(array $ids, int $typeId, ?int $gid = null, int $maxChunk = 50) : array  {
        $mappings = [];
        foreach (array_chunk($ids, $maxChunk) as $chunk) {
            $sql = $this->getSelect();
            $sql .= sprintf(" WHERE type_id = ? AND account_id IN(%s)", implode(',', $chunk));
            $clauses = [$typeId];

            if($gid) {
                $sql .= " AND group_id = ?";
                $clauses[] = $gid;
            }
            if(method_exists($this->getDB(), 'getAll')) {
                $rows = $this->getDB()::getAll($sql, $clauses);
                foreach ($rows as $row) {
                    if ( !isset($mappings[$row["account_id"]]) ) {
                        $mappings[$row["account_id"]] = [];
                    }
                    $mappings[$row["account_id"]][] = $row["region_id"];
                }
            }
        }
        return $mappings;
    }
}
