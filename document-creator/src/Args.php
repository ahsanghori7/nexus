<?php

class Args
{
    public static function getOpt(string $key, mixed $default = false) : mixed {
        $options = self::getOpts();
        return $options[$key] ?? $default;
    }

    public static function getOpts() : array {
        global $argv;
        $options = [];
        foreach($argv as $i => $a) {

            if($opt = self::getParamByIndex($a, $i)) {
                $options[array_keys($opt)[0]] = array_values($opt)[0];
            }
        }
        return $options;
    }

   public static function getRequired(string $key, string $error) {
        $o = self::getOpt($key);
        if(!$o) {
            exit("\n" . $error . "\n");
        }
        return $o;
    }

    public static function getParamByIndex(string $k, int $i) : array {
        global $argv;
        $opt = [];
        if(str_starts_with($k, "-")) {
            $param = str_replace("-", "", $k);
            $opt = [$param => true];
            if(isset($argv[$i + 1]) &&  !str_starts_with($argv[$i + 1], "-")) {
                $opt[$param] = $argv[$i + 1];
            }
        }
        return $opt;
    }
}
