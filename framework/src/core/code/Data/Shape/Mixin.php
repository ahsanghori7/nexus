<?php

namespace Core\Data\Shape;

use Core\Data\Shape;

class Mixin
{
    /**
     * @var null|Callable
     */
    protected $getter;

    /**
     * @var null|Callable
     */
    protected $setter;


    /***
     * @param $get
     * @param $set
     * @return void
     */
    public function __construct(Callable $get = null, Callable $set = null){
        $this->getter = $get;
        $this->setter = $set;
    }

    /**
     * @param mixed $value
     * @param Shape $shape
     * @return mixed
     */
    public function set(mixed $value, Shape $shape) : mixed
    {
        if(is_callable($this->setter)) {
            return call_user_func_array($this->setter, [$value, $shape]);
        }

        return $value;
    }

    /**
     * @param mixed $value
     * @param Shape $shape
     * @return mixed
     */
    public function get(mixed $value, Shape $shape) : mixed {
        if(is_callable($this->getter)) {
            return call_user_func_array($this->getter, [$value, $shape]);
        }
        return $value;
    }
}
