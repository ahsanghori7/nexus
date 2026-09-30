<?php

namespace Api\Model\BoQ;

use Core\Service\Manager;
use Core\Data\Shape;

class Resource
{
    //Resource types : Feel like these should be in the database
    const PROGRAMME_WEEK = 2;
    const EXCLUSION_NOTE = 3;

    /**
     * @param int $boq_id
     * @param string $value
     * @param int $aid
     * @param string $type
     * @param int $status
     * @param int $version
     * @throws \Exception
     */
    public static function addResource(int $boq_id, string $value, int $aid, string $type, int $status, int $version = 1): int
    {
        $res = Manager::getService("project")->write("boq/resource", new Shape(["data" => [
            'boq_id' => $boq_id,
            'text' => $value,
            'id_account' => $aid,
            'type' => $type,
            'status' => $status,
            'version' => $version
        ]]));
        $newId = 0;
        if ($res->get("info.http_code") === 200) {
            $json = $res->json("content");
            if (is_array($json) && isset($json["data"])) {
                $newId = $json['data']['id'];
            }
        }
        return $newId;
    }

    /**
     * @param int $boq_id
     * @param array $data
     * @throws \Exception
     */
    public static function updateResource(int $boq_id, array $data): void
    {
        Manager::getService("project")->update("boq/resource/$boq_id", new Shape(["data" => $data]));
    }

    /**
     * @param Shape $data
     * @throws \Exception
     */
    public static function createResourceVersion(Shape $data): void
    {
        $id = $data->get("boq_id");
        Manager::getService("project")->write("boq/resource/" . $id . "/version", new Shape(["data" => $data->toArray()]));
    }

    /**
     * @param Shape $item
     * @param array $data
     * @throws \Exception
     */
    public static function updateResourceMapping(int $id, array $data = []): void
    {
        Manager::getService("project")->update("boq/resource/" . $id . "/mapping", new Shape(["data" => $data]));
    }

    /**
     * @param int $eid
     * @throws \Exception
     */
    public static function getResourcesByEntityId(int $eid): mixed
    {
        try{
            $res = Manager::getService("project")->fetch("boq/resource/entity/" . $eid);
        }catch(\Exception $e){
            if($e->getCode() === 404){
                return [];
            }
            throw $e;
        }
        $resources = null;
        if ($res->get("info.http_code") === 200) {
            $json = $res->json("content");
            if (is_array($json) && isset($json["data"])) {
                $resources = $json['data'];
            }
        }
        return $resources;
    }

    /**
     * @param int $id
     * @throws \Exception
     */
    public static function getResourceById(int $id): mixed
    {
        $res = Manager::getService("project")->fetch("boq/resource/" . $id);
        $resource = null;
        if ($res->get("info.http_code") === 200) {
            $json = $res->json("content");
            if (is_array($json) && isset($json["data"])) {
                $resource = $json['data'];
            }
        }
        return $resource;
    }

     /**
     * @param int $id
     * @throws \Exception
     */
    public static function getTypes(): mixed
    {
        $res = Manager::getService("project")->fetch("boq/resource/type");
        $resource = null;
        if ($res->get("info.http_code") === 200) {
            $json = $res->json("content");
            if (is_array($json) && isset($json["data"])) {
                $resource = $json['data'];
            }
        }
        return $resource;
    }
}
