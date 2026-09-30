<?php

namespace Core\Middleware;

class Exception extends \Exception
{
    /**
     * @var string
     */
    protected string $id;

    public function __construct(string $id, string $message = "", int $code = 0, \Throwable $previous = null)
    {
        $this->id = $id;
        parent::__construct($message, $code, $previous);
    }

    /**
     * @return string
     */
    public function getId() : string {
        return $this->id;
    }
}
