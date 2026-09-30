<?php

namespace App\Utility;

class Dir {

    const DEFAULT_DIR_PERMS = 0750;

    /**
     * @param string $path
     * @param bool $rewrite
     * @param int $perms
     * @param bool $recurse
     * @return bool
     * @throws \Exception
     */
    public static function create(string $path, bool $rewrite=true, int $perms=Dir::DEFAULT_DIR_PERMS, bool $recurse=true) : bool {
        if(!$path) {
            throw new \Exception("Failed to create path, empty string or null given");
        }

        if(is_dir($path)) {
            if($rewrite) {
                self::delete($path);
            }
            else {
                return true;
            }
        }

        if(!is_writable(dirname($path))) {
            throw new \Exception("Failed to write $path parent not writable");
        }

        return mkdir($path, $perms, $recurse);
    }

    /**
     * @param string $path
     * @param bool $rewrite
     * @param int $perms
     * @param bool $recurse
     * @return string
     * @throws \Exception
     */
    public static function mkTmpPath(string $path, bool $rewrite=true, $perms=Dir::DEFAULT_DIR_PERMS, $recurse=true) {
        $tmp = sys_get_temp_dir() . "/" . $path;

        if(!self::create($tmp, $rewrite, $perms, $recurse)) {
            throw new \Exception("Failed to create path $tmp");
        }
        return $tmp;
    }

    /**
     * @param string $dir
     * @return bool
     */
    public static function exists(string $dir) : bool {
        return is_dir($dir);
    }

    /**
     * @param string $path
     * @return array
     */
    public static function getFiles(string $path) : array {
        $files = [];
        if(self::exists($path)) {
            foreach(self::getIterator($path) as $result) {
                if(!$result->isDir()) {
                    $files[] = $result;
                }
            }
        }

        return $files;
    }

    /**
     * @param string $path
     * @return \RecursiveIteratorIterator
     */
    public static function getIterator(string $path) {
        return new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path));
    }

    /**
     * @param string $path
     * @return array
     */
    public static function getContents(string $path) : array {
        $contents = [];
        if(self::exists($path)) {
            foreach(scandir($path) as $object) {
                if ($object != "." && $object != "..") {
                    $contents[$object] = $path . "/" . $object;
                }
            }
        }
        return $contents;
    }

    /**
     * @param string $path
     * @return array
     */
    public static function getSubDirs(string $path) : array {
        $dirs = [];
        if(self::exists($path)) {
            foreach(self::getIterator($path) as $result) {
                if($result->isDir()) {
                    $dirs[] = $result;
                }
            }
        }

        return $dirs;
    }

    /**
     * @param string $root
     * @param string $prefix
     * @return string
     */
    public static function getPath(string $root, string $prefix = "/") : string {
        return ($prefix == substr($root, -1)) ? $root : $root . $prefix;
    }

    /**
     * @param string $name
     * @param array $replaceDs
     * @return string
     */
    public static function cleanFolderName(string $name, array $replaceDs = ["/" => "-", " " => "_"]) : string {
        $new = str_replace([".", "\\"], "", $name);
        if($replaceDs) {
            foreach ($replaceDs as $k => $v) {
                $new = str_replace($k, $v, $new);
            }
        }
        return $new;
    }


    /**
     * @param string $path
     * @return bool
     */
    public static function delete(string $path) : bool {
        if(self::exists($path)) {
            foreach(self::getContents($path) as $name => $object) {
                if(is_file($object)) {
                    unlink($object);
                }
                else {
                    self::delete($object);
                    rmdir($object);
                }
            }
            rmdir($path);
            return true;
        }
        return false;
    }
}
