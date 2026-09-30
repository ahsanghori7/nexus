<?php

namespace App\Api\Client\Response;

class JsonResponse implements \JsonSerializable
{
    /**
     * @var array
     */
    protected $data = [];

    protected int $status = 0;

    /**
     * JsonResponse constructor.
     * @param array $data
     */
    public function __construct(array $data, int $status = 0) {
        $this->data = $data;
        $this->status = $status;
    }


    /**
     * @return int
     */
    public function getStatus() : int {
        return $this->status;
    }


    /**
     * @return array
     */
    public function jsonSerialize(): array
    {
        return $this->data;
    }

    /**
     * @return array
     */
    public function getData() : array {
        return $this->data;
    }
}
