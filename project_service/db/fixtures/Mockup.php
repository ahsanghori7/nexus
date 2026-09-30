<?php

require 'FixtureShortcodes.php';

class Mockup
{

    /**
     * @var array
     */
    public array $args = [];

    /**
     * @var array|class-string[]
     */
    public array $models = [
        'shortcodes' => FixtureShortcodes::class
    ];

    public function __construct()
    {
        $this->collectArgs();
    }

    /**
     * @return void
     */
    public function collectArgs(): void
    {
        global $argv;
        $args = [];
        if($argv){
            foreach($argv as $arg){
                if(str_contains($arg, "=")){
                    $parts = explode("=", $arg);
                    $args[$parts[0]] = $parts[1];
                }
            }
        }
        $this->args = $args;
    }

    /**
     * @return array
     */
    public function getArgs(): array
    {
        return $this->args;
    }

    /**
     * @param string $key
     * @param $default
     */
    public function getArg(string $key, $default = null)
    {
        return $this->args[$key] ?? $default;
    }

    public function load(string $path)
    {
        if ( file_exists(__DIR__ . "/data/$path.php") ) {
            return include __DIR__ . "/data/$path.php";
        }
        return [];
    }

    public function getModel(string $model)
    {
        if(isset($this->models[$model])){
            return (new $this->models[$model]());
        }
        return null;
    }
}
