<?php

namespace Core\Layer\Http;


use Core\Data\Shape;
use Core\Layer\Http\Incoming\Response;
use Core\Layer\ResponseAbstract;
use Core\Util\Url;
use Core\Layer\IncomingInterface;
use Core\Layer\IncomingAbstract;

class Incoming extends IncomingAbstract implements IncomingInterface
{
    /**
     * @var Url
     */
    protected static Url $url;

    /**
     * @var Shape
     */
    protected static Shape $arguments;

    public function __construct() {
        if(!isset(self::$url)) {
            self::$url = new Url(sprintf(
                "%s://%s%s",
                $_SERVER["REQUEST_SCHEME"] ?? "http",
                $_SERVER["HTTP_HOST"] ?? "",
                $_SERVER["REQUEST_URI"] ?? "",
            ));

            $data = file_get_contents("php://input");
            self::$arguments = new Shape(self::$url->getArguments());
            $json = json_decode(is_string($data) ? $data : "", true);

            self::$data = new Shape([
                "json"  => new Shape(is_array($json) ? $json : []),
                "form"  => new Shape($_POST),
                "files" => $_FILES,
                "method"  => $_SERVER["REQUEST_METHOD"] ?? "GET",
                "cookies" => new Shape($_COOKIE),
                "header" =>  new Shape(getallheaders())

            ]);
            array_map(function($k, $v) {self::$data->set($k, $v);}, array_keys($_SERVER), $_SERVER);
        }
    }

    /**
     * @return string
     */
    public function getPath() : string {
        return self::$url->getPath();
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
