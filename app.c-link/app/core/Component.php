<?php
namespace App\core;

use App\core\Controller;

class Component{

    protected $controller;
    protected $request;
    protected $config = [];

    public function __construct(Controller $controller, array $config = []){
        $this->controller = $controller;
        $this->request    = $controller->request;
        $this->config     = array_merge($this->config, $config);
    }

     public function config($key, $value = null){

         // set
         if($value !== null){
             $this->config = array_merge($this->config, [$key => $value]);
             return $this;
         }

         // get
         return array_key_exists($key, $this->config)? $this->config[$key]: null;
     }

}
