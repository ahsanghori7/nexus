<?php

global $argv;

$src  = $argv[1] ?? false;
$type = $argv[2] ?? false;

if(!$src) {
    exit("No Source File Supplied");
}
if(!$type) {
    exit("No Document Type Arg Supplied");
}


$file = __DIR__ . "/$type/$src.json";
if(!is_file($file)) {
    exit("Source File incorrect path $file");
}

$info = pathinfo($file);
if($info["extension"] !== "json") {
    exit("Source File incorrect type, json required");
}

$json = json_decode(file_get_contents($file), true);
if(!$json) {
    exit("Json Decode Failed, invalid json supplied");
}

function replace_recurse(&$object, $func) {
    foreach($object as $k => $v) {
        if($k === "children") {
            foreach($v as $i => $child) {
                if(is_array($child)) {
                    $object[$k][$i] =  replace_recurse($child, $func);
                    if(empty($object[$k][$i])) {

                    }
                }
            }
        }
        else {
            $new =  $func($k, $v);
            if(is_null($new)) {
                unset($object[$k]);
            }
        }
    }
    return $object;
}

$newObj = replace_recurse($json[0], function($k, $v) {
    if($k === "style") {
        return null;
    }
    if($k === "type" && ($v === "footer" || $v === "header")) {
        return null;
    }
    if($k === "props" && is_array($v) && empty($v)) {
        return null;
    }

    return $v;
});

echo json_encode($newObj, JSON_PRETTY_PRINT);
