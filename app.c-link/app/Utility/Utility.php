<?php

namespace App\Utility;

class Utility
{

    private function __construct() {}

    public static function normalize($arr)
    {

        $keys = array_keys($arr);
        $count = count($keys);

        $newArr = [];
        for ($i = 0; $i < $count; $i++) {
            if (is_int($keys[$i])) {
                $newArr[$arr[$keys[$i]]] = null;
            } else {
                $newArr[$keys[$i]] = $arr[$keys[$i]];
            }
        }
        return $newArr;
    }

    public static function commas($arr)
    {
        return implode(",", (array)$arr);
    }

    public static function merge($arr1, $arr2)
    {
        return array_merge((array)$arr1, (array)$arr2);
    }

    public static function normalizeDir(string $path): string
    {
        return rtrim(trim($path), '/');
    }

    /**
     * Create a unique, isolated working directory under $base so concurrent
     * PDF-generation jobs never share/overwrite each other's temp files.
     * Falls back to the system temp dir when no base folder is configured.
     *
     * @param string $base
     * @return string
     */
    public static function uniqueTempDir(string $base): string
    {
        $base = self::normalizeDir($base);
        if ($base === '') {
            $base = sys_get_temp_dir();
        }
        $dir = $base . '/' . uniqid('pdf_', true) . '/';
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        return $dir;
    }

    /**
     * Recursively delete a directory and everything inside it.
     *
     * @param string $dir
     * @return void
     */
    public static function removeDirectory(string $dir): void
    {
        if ($dir === '' || !is_dir($dir)) {
            return;
        }
        foreach (scandir($dir) ?: [] as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path) && !is_link($path)) {
                self::removeDirectory($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }
}
