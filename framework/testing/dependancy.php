<?php


$composer = APP_ROOT . DS . "composer.json";
if(!is_file($composer)) {
    exit("No composer.json file found in `$composer`\n");
}

$composer = json_decode(file_get_contents($composer), true);

foreach($composer["require"] as $package => $version) {


}
