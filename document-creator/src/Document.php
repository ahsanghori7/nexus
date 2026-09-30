<?php

class Document
{

    public static function save(array $data, string $outputFile, string $path = "") {
        if(!$path) {
            $path = __DIR__;
        }
        file_put_contents($path . "/$outputFile", json_encode([$data], JSON_PRETTY_PRINT));
    }

    /** ToDo: move logic from complier to build a documnet from a manifest */
    public static function build($manifestPath) {}


    /** ToDo: move logic from loading and validating manifest into own class */
    public static function getMainfest($path) : array {

    }
}
