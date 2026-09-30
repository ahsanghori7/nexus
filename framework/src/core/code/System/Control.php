<?php

namespace Core\System;

use Core\Data\Shape;

class Control
{
    /**
     * @return void
     */
    public static function shutdown() {
        self::callHandler("shutdown");
    }

    /**
     * @var array<array<int, callable>>
     */
    protected static array $handlers = [];

    /**
     * @param string $key
     * @param callable $handler
     * @return void
     */
    public static function setHandler(string $key, Callable $handler) : void {
        self::$handlers[$key][] = $handler;
    }

    /**
     * @param string $type
     * @param mixed|null $args
     * @return void
     */
    public static function callHandler(string $type, mixed $args = null) : void {
        array_map(function($i) use($args) {
            if(is_callable($i)) {
                $i($args);
            }
        }, self::$handlers[$type] ?? []);
    }

    /**
     * @param callable $f
     * @return Shape
     */
    public static function buffer(callable $f) : Shape {
        ob_start();
        $output = $f();
        $buffer = ob_get_contents();
        ob_end_clean();
        return new Shape(["output" => $output, "buffer" => $buffer]);
    }

    /**
     * @param array<string, array<Callable>> $handlerGroup
     * @return void
     */
    public static function setHandlers(array $handlerGroup) : void {
        foreach($handlerGroup as $type => $handlers) {
            foreach($handlers as $handler) {
                if(is_callable($handler)) {
                    self::setHandler($type, $handler);
                }
            }
        }
    }

    /**
     * @param string $app
     * @param string $prefix
     * @return string
     * @throws \Exception
     */
    public static function getAppPath(string $app, string $prefix = ''): string {

        $dirs = glob(APPS_SRC . "/*");
        if(is_array($dirs)) {
            foreach ($dirs as $path) {
                if ( is_dir($path) && strcasecmp(basename($path), $app) === 0 ) {
                    return rtrim($path, '/') . "/" . ltrim($prefix, '/');
                }
            }
        }
        throw new \Exception('Unknown app '.$app);
    }

    /**
     * @param string $app
     * @param string $file_path
     * @return mixed
     * @throws \Exception
     */
    public static function loadAppFile(string $app, string $file_path): mixed
    {
        $file = self::getAppPath($app, $file_path);
        if(is_file($file)){
            return require($file);
        }
        throw new \Exception('Cannot find file path '.$file_path);
    }
}

register_shutdown_function([Control::class, 'shutdown']);
