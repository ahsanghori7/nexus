<?php

namespace Core\Layer;

interface IOInterface
{
    /**
     * @return string
     */
    public function getType() : string;

    /**
     * @param string $type
     * @return bool
     */
    public function isType(string $type) : bool;

    /**
     * @return string
     */
    public function getDirection() : string;

    /**
     * @param string $direction
     * @return bool
     */
    public function isDirection(string $direction) : bool;

}
