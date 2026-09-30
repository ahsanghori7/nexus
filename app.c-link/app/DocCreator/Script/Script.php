<?php
namespace App\DocCreator\Script;

class Script
{
    /**
     * @param string $script
     * @param mixed ...$script_data
     */
    public static function run(string $script, ...$script_data): void
    {
        foreach($script_data as $key => $value){
            $script = str_replace("$$key", $value, $script);
        }
        exec($script);
    }
}
