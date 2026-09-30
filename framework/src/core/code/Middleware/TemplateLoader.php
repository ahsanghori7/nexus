<?php

namespace Core\Middleware;
use Core\Data\Shape;
use Core\Middleware\Exception;
use Core\Middleware\Template\MissingVariableException;

class TemplateLoader
{

    /**
     * @var array|string[][]
     */
    protected static array $templatePool = [
        "main" => [
            "path" => ""
        ]
    ];

    /**
     * @param string $templateName
     * @param string $templatePool
     * @param array<string, mixed> $args
     * @return Callable
     * @throws \Exception
     */
    public static function load(string $templateName, string $templatePool = "main",  array $args = []) : Callable {
        $template = self::getTemplate($templateName, $templatePool);
        return function(Shape $shape) use ($template, $args) {
            ob_start();
            extract($args);
            try {
                include($template);
            }
            catch(MissingVariableException $m) {
                throw new Exception(
                    "failedTemplateLoad", $m->getMessage()
                );
            }
            $html = $shape->get("html", "");
            $html = is_string($html) ? $html .= ob_get_contents() : ob_get_contents();
            $shape->set("html", $html);
            ob_clean();
        };
    }

    /**
     * We allow a location to be registered for templates
     * @param string $name
     * @param string $location
     * @return void
     */
    public static function setTemplatePool(string $name, string $location) : void {
        if(!is_dir($location)) {
            throw new \Exception("Invalid template path $location");
        }
        self::$templatePool[$name] = ["path" => $location];
    }

    /**
     * @param string $name
     * @param string $pool
     * @return string
     * @throws \Exception
     */
    public static function getTemplate(string $name, string $pool) : string {
        $path = self::getFullPath($name, $pool);
        if(!is_file($path)) {
            throw new \Exception("Invalid $pool template $name");
        }

        return $path;
    }

    /**
     * @param string $name
     * @param string $pool
     * @return string
     * @throws \Exception
     */
    public static function getFullPath(string $name, string $pool) : string {
        if(!isset(self::$templatePool[$pool])) {
            throw new \Exception("Invalid template pool $pool");
        }

        return sprintf(
            "%s%s%s",
            rtrim(self::$templatePool[$pool]["path"], DS),
            DS,
            ltrim($name, DS)
        );
    }
}
