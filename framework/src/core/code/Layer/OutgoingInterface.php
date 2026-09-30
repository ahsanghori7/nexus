<?php

namespace Core\Layer;

use Core\Data\Shape;

interface OutgoingInterface extends IOInterface
{
    /**
     * @param Shape $args
     * @return OutgoingInterface
     */
    public function setArgs(Shape $args) : OutgoingInterface;

    /**
     * @param Shape $data
     * @return OutgoingInterface
     */
    public function setData(Shape $data) : OutgoingInterface;

    /**
     * @param string $path
     * @return OutgoingInterface
     */
    public function setPath(string $path) : OutgoingInterface;

    /**
     * @return Shape
     */
    public function getResponse() : Shape;

    /**
     * @param array<int, mixed> $options
     * @return OutgoingInterface
     */
    public function setOptions(array $options) : OutgoingInterface;

    /**
     * @param array<string, mixed> $headers
     * @return OutgoingInterface
     */
    public function setHeaders(array $headers) : OutgoingInterface;

}
