<?php

namespace Core\Middleware\Exception;
use Core\Middleware\Exception;

class Relay extends Exception
{
    /**
     * @param array<mixed> $errors
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(array $errors, int $code = 0, \Throwable $previous = null)
    {
        $json = json_encode($errors);
        if(!$json) {
            $json = "Failed to encode json from string : " . strval($errors);
        }

        parent::__construct("RelayError", $json, $code, $previous);
    }
}
