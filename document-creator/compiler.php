<?php

require("src/Args.php");
require("src/Document.php");

global $argv;

if(!isset($argv[1])) {
    exit("Missing required arg path to directory to compile");
}
$path = realpath($argv[1]);
if(!$path) {
    exit("$path is not a valid directory path");
}

if($m = Args::getOpt("m")) {
    $manifest = $m;
}
else {
    $manifest = $path . "/manifest.json";
}

if(!is_file($manifest)) {
    exit("$path no manifest json found");
}

$json = json_decode(file_get_contents($manifest), true);
if(!$json) {
    exit("Invalid json found in manifest");
}

$versionKey = Args::getOpt("v", "default");
$sectionsList = $json["sections"] ?? false;
if(!$sectionsList) {
    exit("Missing sections key");
}

if(!isset($sectionsList[$versionKey])) {
    exit("Invalid Manifest key $versionKey");
}

$sections = $sectionsList[$versionKey];
$document = [
    "name" => "document",
    "header" => [
      "company_name" => "",
      "address" => [],
      "company_reg" => "",
      "web_address" => "",
      "logo" => ""
    ],
    "footer" => ["company_name" => "", "subcontract" => "" ],
    "props"  => ["className" => "edit-document-document" ],
    "children" => []
];

$output = $json["output_file"] ?? basename($path) . ".json";
foreach($sections as $part) {
    $filepath = "$path/$part.json";
    if(strpos($part, ".") === 0) {
        $filepath = realpath($path . "/$part.json");
    }

    if(!is_file($filepath)) {
        exit("Invalid file path for document component $part : $filepath");
    }

    $section = json_decode(file_get_contents("$path/$part.json"), true);
    if(!$section) {
        exit("Invalid Json found in $part.json");
    }
    if(isset($section[0]["children"])) {
        foreach($section[0]["children"] as $page) {
            if($page) {
                $document["children"][] = $page;
            }
        }
    }
    else {
        exit("Invalid Json structure, not pages found in $part.json");
    }
}

Document::save($document, $output, dirname($path));
