<?php

namespace Core\Layer;

use Core\Data\Shape;
use Core\Layer\ResponseAbstract;

interface IncomingInterface extends IOInterface
{
    /**
     * @return Shape
     */
    public function getArgs() : Shape;

    /**
     * @return Shape
     */
    public function getData() : Shape;

    /**
     * @return string
     */
    public function getPath() : string;

    /**
     * @return int
     */
    public function getPathLength() : int;

    /**
     * @param int $i
     * @param int|null $end
     * @return string
     */
    public function getPathByIndex(int $i, int $end = null) : string;

    /**
     * @param Shape $shape
     * @return \Core\Layer\ResponseAbstract
     */
    public function respond(Shape $shape) : ResponseAbstract;
}
