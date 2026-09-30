<?php

namespace App\Api\Client\Response;

class JsonException extends \Exception implements \JsonSerializable
{
    /**
     * @return array
     */
    public function jsonSerialize(): array
    {
        return [
            "status" => $this->getCode(),
            "error" => $this->getMessage(),
            "success" => false
        ];
    }
}
