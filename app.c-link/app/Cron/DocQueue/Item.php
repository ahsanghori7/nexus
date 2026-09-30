<?php

namespace App\Cron\DocQueue;


class Item {

    /**
     * @var array
     */
    protected array $sids = [];

    /**
     * @var array
     */
    protected array $uids = [];

    /**
     * @var array
     */
    protected array $data = [];

    /**
     * @var int
     */
    protected int $did = 0;

    public function __construct(array $data) {

        $did  = (int)($data["did"]  ?? 0);
        $sids = (array)($data["sids"] ?? []);
        $uids = (array)($data["suids"] ?? []);

        if(!$did) {
            throw new \Exception("Missing Document Id");
        }
        if(!$sids) {
            throw new \Exception("Missing Subcontractor Id(s)");
        }

        $this->did  = $did;
        $this->sids = $sids;
        $this->uids = $uids;
        $this->data = $data;
    }

    /**
     * @return int
     */
    public function getDid() : int {
        return $this->did;
    }

    /**
     * @return array
     */
    public function getSids() : array {
        return $this->sids;
    }

    /**
     * @return array
     */
    public function getUids() : array {
        return $this->uids;
    }

    /**
     * @return array
     */
    public function getData() : array {
        return $this->data;
    }
}
