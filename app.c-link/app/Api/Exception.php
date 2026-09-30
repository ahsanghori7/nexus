<?php


    namespace App\Api;


    use Throwable;

    class Exception extends \Exception
    {
        protected $apiResponseMessage;

        public function __construct($message = "", $code = 0, Throwable $previous = null)
        {
            parent::__construct($message, $code, $previous);
        }
    }
