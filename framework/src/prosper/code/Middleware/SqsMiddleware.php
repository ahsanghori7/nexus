<?php

namespace Prosper\Middleware;
use Core\Data\Shape;
use Core\Middleware\ServiceMiddleware;

class SqsMiddleware extends ServiceMiddleware
{
    public const SERVICE = 'sqs';

    /**
     * @param string $key
     * @param string $path
     * @return callable
     */
    public static function writeAll(string $key, string $path) : callable {
        return function (Shape $action) use($key, $path) {
            foreach($action->getArray($key) as $item) {
                $body = json_encode($item);
                self::getService()->write($path, new Shape(
                    [
                        'body'     => $body,
                        'group_id' => md5($body ?: "")
                    ]
                ));
            }
        };
    }
}
