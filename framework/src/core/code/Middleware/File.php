<?php

namespace Core\Middleware;

use Core\Middleware\Exception as MiddlewareException;
use Core\Data\Shape;

class File
{
    /**
     * @param string $fileKey
     * @return Callable
     */
    public static function output(string $fileKey) : Callable {
        return function(Shape $shape) use ($fileKey) {
            $file = $shape->get($fileKey);
            if($file && file_exists($file)){
                header('Content-Type: ' . mime_content_type($file));
                header('Content-Disposition: attachment; filename="' . basename($file) . '"');
                header('Content-Length: ' . filesize($file));
                ob_clean();
                flush();
                readfile($file);
                exit;
            }
            throw new MiddlewareException("FileOutput", "File was not found");
        };
    }
}
