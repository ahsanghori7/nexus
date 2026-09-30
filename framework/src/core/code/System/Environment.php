<?php

namespace Core\System;

class Environment
{
    /**
     * @var array<string, mixed>
     */
    protected static array $vars;

    /**
     * @return array<string, mixed>
     */
    public static function getVars() : array {
        if(!isset(self::$vars)) {
            self::$vars = getenv();
        }
        return self::$vars;
    }


    /**
     * @param string $k
     * @param mixed|null $default
     * @return mixed
     */
    public static function get(string $k, mixed $default = null) : mixed {
        $vars = self::getVars();
        return $vars[$k] ?? $default;
    }

    /**
     * @param string $k
     * @param mixed|null $default
     * @return mixed
     */
    public static function getValue(string $k, mixed $default = null) : mixed {
        return self::get($k, $default);
    }

    /**
     * @param array $vars
     */
    public static function setVars(array $vars): void
    {
        self::$vars = $vars;
    }

    /**
     * @param string $k
     * @param bool $def
     * @return bool
     */
    public static function getBool(string $k, bool $def = false) : bool {
        $v = self::get($k, $def);
        if(is_numeric($v)) {
            return ((int)$v !== 0);
        }
        if(is_string($v)) {
            return in_array(strtolower($v), ["yes", "y", "true"]);
        }

        return is_bool($v) ? $v : $def;
    }

    /**
     * @param string $path
     * @return array<string, mixed>
     * @throws \Exception
     */
    public static function loadEnv(string $path) : array {
        $vars = self::getVars();
        $file = $path . "/.env";
        if(is_file($file)) {
            if($content = file_get_contents($file)) {
                $lines = explode("\n", $content);
            }
            else {
                throw new \Exception("Failed to get $file contents");
            }
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') {
                    continue;
                }
                if (str_starts_with($line, 'export ')) {
                    $line = substr($line, 7);
                }
                [$k, $v] = explode('=', $line, 2);
                $vars[trim($k)] = trim($v);
            }
            self::$vars = $vars;
        }
        else {
            throw new \Exception("Incorrect envvar path ($path) given");
        }

        return self::$vars;
    }
}
