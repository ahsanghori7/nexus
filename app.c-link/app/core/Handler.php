<?php

namespace App\core;

use App\core\Logger;
use App\controllers\ErrorsController;

class Handler
{
    private function __construct()
    {
    }

    public static function register()
    {
        error_reporting(0);

        set_error_handler(__CLASS__ . "::handleError");
        set_exception_handler(__CLASS__ .'::handleException');
        register_shutdown_function(__CLASS__ ."::handleFatalError");
    }

    public static function handleFatalError()
    {
        if (PHP_SAPI === 'cli') {
            return;
        }
        $error = error_get_last();

        if (!is_array($error)) {
            return;
        }

        $fatals = [E_USER_ERROR, E_ERROR, E_PARSE, E_COMPILE_ERROR ];

        if (!in_array($error['type'], $fatals, true)) {
            return;
        }

        self::handleException(new \ErrorException($error['message'], 0, $error['type'], $error['file'], $error['line']));
    }

    public static function handleError($errno, $errmsg, $filename, $linenum)
    {
        $errors = [E_USER_ERROR, E_ERROR, E_PARSE, E_COMPILE_ERROR];
        if (!in_array($errno, $errors, true)) {
            return;
        }
        throw new \ErrorException($errmsg, 0, $errno, $filename, $linenum);
    }

    public static function handleException($e)
    {
        try {
            $msg = Logger::Log(get_class($e), $e->getMessage(), $e->getFile(), $e->getLine());
            if (!$msg) {
                die("Failed to log");
            }
        } catch (\Exception $ex) {
            $e = $ex;
        } catch (\Error $er) {
            $e = $er;
        }
        self::render($e)->send();
    }

    private static function render($e)
    {
        return (new ErrorsController())->error($e->getCode(), $e);
    }
}
