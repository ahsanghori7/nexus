<?php

namespace Core\Layer\Cli;


use Core\Data\Shape;
use Core\Layer\IoAbstract;
use Core\Layer\OutgoingInterface;

class Outgoing extends IoAbstract implements OutgoingInterface
{

    /**
     * @var string
     */
    protected string $path;

    /**
     * @var Shape
     */
    protected Shape $arguments;

    /**
     * @var Shape
     */
    protected Shape $data;

    /**
     * @var array<int, mixed>
     */
    protected array $options = [];

    /**
     * @var array<string, string>
     */
    protected array $headers = [];


    /**
     * @param string $path
     * @param array<int, mixed> $options
     * @param array<string, string> $headers
     */
    public function __construct(string $path = "", array $options = [], array $headers = [])
    {
        $this->path = $path;
        $this->setHeaders($headers)->setOptions($options);
    }

    /**
     * @return string
     */
    public function getPath() : string {
        return $this->path;
    }

    /**
     * @param Shape $args
     * @return Outgoing
     */
    public function setArgs(Shape $args) : Outgoing {
        if(!isset($this->arguments)) {
            $this->arguments = $args;
        }
        else {
            foreach($args->toArray() as $k => $v) {
                if(is_string($k)) {
                    $this->arguments->set($k, $v);
                }
            }
        }

        return $this;
    }

    /**
     * @return Shape
     */
    public function getArgs() : Shape {
        if(!isset($this->arguments)) {
            $this->arguments = new Shape();
        }
        return $this->arguments;
    }

    /**
     * @param Shape $data
     * @return $this
     */
    public function setData(Shape $data) : Outgoing {
        $this->data = $data;
        return $this;
    }

    /**
     * @param array<int, mixed> $options
     * @return $this
     */
    public function setOptions(array $options) : Outgoing {
        foreach($options as $k => $v) {
            $this->options[$k] = $v;
        }
        return $this;
    }

    /**
     * @param array<string, string> $headers
     * @return $this
     */
    public function setHeaders(array $headers) : Outgoing {
        foreach($headers as $k => $v) {
            $this->headers[$k] = $v;
        }
        return $this;
    }

    /**
     * @param string $path
     * @return OutgoingInterface
     */
    public function setPath(string $path) : OutgoingInterface {
        $this->path = $path;
        return $this;
    }

    /**
     * @return mixed
     */
    public function getBody() : mixed
    {
        return "";
    }

    public function getResponse() : Shape
    {
        return new Shape();
    }
}
