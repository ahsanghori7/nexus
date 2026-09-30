<?php

namespace CL\Pdf\Html;

class Snippet
{
    /**
     * @var string
     */
    protected string $path;

    /**
     * @var Abstraction
     */
    protected Abstraction $el;

    /**
     * @var array
     */
    protected array $vars = [];

    public function __construct(string $name, Abstraction $element, array $vars = []) {
        $path = __DIR__ . "/snippets/$name.php";

        if(is_file($path)) {
            $this->path = $path;
        }
        else {
            throw new \Exception("Invalid html snippet path $path");
        }
        $this->el   = $element;
        $this->vars = $vars;
    }

    /**
     * @return Abstraction
     */
    public function getElement() : Abstraction {
        return $this->el;
    }

    /**
     * @return array
     */
    public function getVars() : array {
        return $this->vars;
    }

    /**
     * @param $k
     * @param $def
     * @return mixed|null
     */
    public function getVar($k, $def = null) {
        return $this->vars[$k] ?? $def;
    }

    /**
     * @param $k
     * @param $def
     * @return void
     */
    public function echoVar($k, $def) {
        $v = $this->getVar($k, $def);
        if(is_scalar($v)) {
            echo (string) $v;
        }
    }

    /**
     * @return string
     */
    public function getContent() : string
    {
        $content = "";
        ob_start();
        include $this->path;
        $content = ob_get_contents();
        ob_end_clean();
        return $content;
    }
}
