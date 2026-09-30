<?php
namespace App\core;

use App\core\Config;

class Helper{

    protected $helpers = [];

    public function __construct(){}

    public function loadHelper(string $helper)
    {
        $path = Config::get('path.helpers') . "/" . $helper . ".php";

        if(file_exists($path)){
            $this->helpers[$helper] = true;
            require($path);
        }
    }

    public function loadHelpers(array $helpers)
    {
         if(!empty($helpers)){
            foreach($helpers as $helper):
                $this->register($helper);
            endforeach;
        }
    }

    public function register(string $helper)
    {
        $this->helpers[$helper] = false;
        $this->loadHelper($helper);
    }

    public function getHelpers()
    {
        return $this->helpers;
    }

}
