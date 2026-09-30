<?php

namespace Core\Layer;
use Core\Data\Shape;

abstract class ResponseAbstract
{
    /**
     * @var Shape
     */
    protected Shape $transport;

    /**
     * @param Shape $transport
     */
    public final function __construct(Shape $transport) {
        $this->transport = $transport;
    }

    /**
     * @return Shape
     */
    public function getTransport() : Shape {
        return $this->transport;
    }

    /**
     * @return string
     */
    public abstract function getContent() : string;

    /**
     * @return string
     */
    public function __toString(): string
    {
        return $this->getContent();
    }
}
