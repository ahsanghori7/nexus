<?php

namespace App\Infrastructure;

class Environment
{
    /**
     * @var array
     */
    protected static $values = [];

    /**
     * Populate the static config values by envfile
     * @param string $path
     * @param string $file
     * @throws \Exception
     */
    public static function loadEnvFile(string $path, string $file = ".env"): void
    {
        $ds = DIRECTORY_SEPARATOR;
        $env = implode($ds, [rtrim($path, $ds), ltrim($file, $ds)]);
        if (!file_exists($env)) {
            throw new \Exception("Failed to load .env @ $env");
        }
        foreach (explode("\n", file_get_contents($env)) as $line) {
            $line = trim(str_replace("export", "", $line));  // Trim whitespace

            // Skip empty lines and comments
            if (empty($line) || $line[0] === '#') {
                continue;
            }

            $parts = explode("=", $line, 2);  // Split the line into at most two parts
            if (count($parts) === 2) {
                [$k, $v] = $parts;
                if (isset(self::$values[$k])) {
                    throw new \Exception("Configuration Error: Key exists for $k");
                }
                self::$values[$k] = self::cast(trim($v));
            } else {
                // Handle the case where the line does not have a key-value format
                error_log("Invalid line in .env file: $line");
            }
        }
    }

    /**
     * Cast a value to its correct typing
     * @param string $value
     * @return bool|float|int|string
     */
    public static function cast(string $value)
    {
        if (is_numeric($value)) {
            if (strpos($value, ".")) {
                return floatval($value);
            } else {
                return intval($value);
            }
        }

        if (in_array(strtolower($value), ["true", "false"])) {
            return strtolower($value) === "true";
        }

        return $value;
    }

    /**
     * Get a value from config array, or default if not exist
     * @param string $k
     * @return mixed|null
     */
    public static function getValue(string $k, $default = null)
    {
        if (isset(self::$values[$k])) {
            return self::$values[$k];
        }

        return $default;
    }

    /**
     * Expose static config values
     */
    public function getValues()
    {
        return self::$values;
    }

    /**
     *    Return a array of config values, by key prefix i.e
     * @example getValueGroup("db")
     * [
     * "db" => [
     * "db_name" => "test",
     * "db_user" => "root"
     * ]
     * ]
     * @param string $prefix
     * @return array
     */
    public static function getValueGroup(string $prefix): array
    {
        $values = [];
        foreach (self::$values as $key => $value) {
            if (preg_match("/^$prefix/", $key)) {
                $parts = explode("_", $key);
                if ($parts[0] === $prefix) {
                    $values[implode("_", array_slice($parts, 1))] = $value;
                }
            }
        }
        return $values;
    }

    /**
     *    Test Whether app is running inside a docker container
     */
    public static function isDocker()
    {
        return self::getValue("DOCKERISED", false);
    }

    /**
     *    Test Whether app is running in production mode
     */

    public static function isProduction()
    {
        $env = self::getValue("ENVIRONMENT", false);
        //By default use production mode
        if (!$env) {
            return true;
        }

        return $env === "production";
    }
}
