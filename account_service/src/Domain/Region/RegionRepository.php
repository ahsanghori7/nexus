<?php

namespace App\Domain\Region;

use App\Domain\AbstractRepository;
use App\Domain\Region\Region;
use App\Domain\Region\RegionMapping;


class RegionRepository extends AbstractRepository
{
    /**
     * Allow a default model to be set for get model function
     */
    const DEFAULT_MODEL = "region";

    /**
     * @var string[]
     */
    protected $models = [
        "region" => Region::class,
        "region_mapping" => RegionMapping::class,
        "region_group" => RegionGroup::class,
    ];

    /**
     * @param array $ids
     * @param string $type
     * @param int|null $gid
     * @return array
     * @throws \Exception
     */
    public function getMappings(array $ids, string $type, ?int $gid = null) : array {

        $mapping = $this->getModel("region_mapping");
        $typeId = null;
        if(method_exists($mapping, 'getTypeModel')) {
            $typeId = $mapping->getTypeModel()->getLabelId($type);
        }
        if(!$typeId) {
            throw new \Exception("Invalid Mapping Type $type");
        }

        if(method_exists($mapping, 'getByIds')) {
            return $mapping->getByIds($ids, $typeId, $gid);
        }
        return [];
    }

    /**
     * @param int $accountId
     * @param array $regions
     * @param string $type
     * @param int|null $groupId
     * @param bool $addOnly
     * @throws \ReflectionException
     */
    public function map(int $accountId, array $regions, string $type, ?int $groupId = null, bool $addOnly=false) : void {

        $mapping = $this->getModel("region_mapping");
        $typeId = null;
        if(method_exists($mapping, 'getTypeModel')) {
            $typeId = $mapping->getTypeModel()->getLabelId($type);
        }
        if(!$typeId) {
            throw new \Exception("Invalid Mapping Type $type");
        }
        $where = ["account_id" => $accountId, "type_id" => $typeId];
        if($groupId) {
            $where["group_id"] = $groupId;
        }
        if(!$addOnly) {
            $mapping->deleteWhere($where);
        }
        if($this->validateRegions($regions)) {
            if(method_exists($mapping, 'saveMappings')) {
                $mapping->saveMappings($accountId, $typeId, $regions, $groupId);
            }
        }
    }

    /**
     * @return array
     * @throws \ReflectionException
     */
    public function getRegions() : array {
        $regions = [];
        foreach($this->getModel("region")->findAll() as $region) {
            $regions[$region["id"]] = $region;
        }
        return $regions;
    }

    /**
     * @param array $ids
     * @return bool
     * @throws \ReflectionException
     */
    public function validateRegions(array $ids) : bool {
        $regions = $this->getRegions();
        if(count($ids) > 0) {
            foreach ($ids as $id) {
                if (!is_int($id)) {
                    throw new \Exception("Region must be an integer,". gettype($id) ." supplied.");
                }
                if (!isset($regions[$id])) {
                    throw new \Exception("Invalid Region Id $id");
                }
            }
            return true;
        }
        return false;
    }
}
