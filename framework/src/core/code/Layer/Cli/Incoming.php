<?php

namespace Core\Layer\Cli;

use Core\Data\Shape;
use Core\Layer\ResponseAbstract;
use Core\Layer\IncomingInterface;
use Core\Layer\IncomingAbstract;
use Core\Layer\Cli\Incoming\Arguments as CliArgumentParser;

use Core\Layer\Cli\Incoming\Response;

class Incoming extends IncomingAbstract implements IncomingInterface
{
    /**
     * @var string|mixed
     */
    protected string $path;

    /**
     * @var string|mixed
     */
    protected string $script;

    const PATH_DELIMITER = ":";

    /**
     * @var Shape
     */
    protected static Shape $arguments;

    public function __construct() {
        global $argv;
        $this->script = $argv[0] ?? "";
        $this->app    = $argv[1] ?? "";
        $this->path   = $argv[2] ?? "";
        self::$data = new Shape([
            "method" => "GET"
        ]);
        self::$arguments = CliArgumentParser::parse(
            (count($argv ) > 2) ? array_splice($argv, 3) : []
        );
    }

    /**
     * @return string
     */
    public function getPath() : string {
        return $this->path;
    }

    /**
     * @return Shape
     */
    public function getArgs() : Shape {
        return self::$arguments;
    }

    /**
     * @return Shape
     */
    public function getJson() : Shape {
        return $this->getData()->getShape("json");
    }

    /**
     * @param Shape $shape
     * @return ResponseAbstract
     */
    public function respond(Shape $shape) : ResponseAbstract {
        return new Response($shape);
    }
}
