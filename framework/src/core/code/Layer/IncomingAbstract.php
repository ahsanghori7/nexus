<?php

namespace Core\Layer;

use Core\Data\Shape;

abstract class IncomingAbstract extends IoAbstract
{

    /**
     * @var Shape
     */
    protected static Shape $data;

    /**
     * @return Shape
     */
    public function getData() : Shape {
        return self::$data;
    }

    /**
     * @param string $k
     * @param mixed|null $def
     * @return mixed
     */
    public function get(string $k, mixed $def=null) : mixed {
        return self::$data->get($k, $def);
    }

    /**
     * @return Shape
     */
    abstract public function getArgs() : Shape;

}
