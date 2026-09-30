<?php

namespace CL\Pdf\Html;

use CL\Pdf\Parser;

abstract class Abstraction {

    /**
     * @var array|mixed
     */
    protected array $styles = [];

    /**
     * @var array|mixed
     */
    protected array $props = [];

    /**
     * @var string
     */
    protected string $content = "";

    /**
     * @var array
     */
    protected array $children = [];

    /**
     * @var int
     */
    protected int $childCount = 0;

    /**
     * @var bool
     */
    protected bool $renderChildren = true;

    public function __construct(array $data = []) {
        $this->styles = $data["style"] ?? [];
        $this->setProps($data["props"] ?? []);
        $this->childCount = count($data["children"] ?? []);
        $this->setChildren($data["children"] ?? []);
    }

    public function setProps(array $data)
    {
        foreach($data as $key => $value){
            if($key == 'className'){
                $key = 'class';
            }

            if(!isset($this->props[$key])){
                $this->props[$key] = $value;
            }else{
                if(is_string($value) && is_string($this->props[$key])){
                    $this->props[$key] .= " ".$value;
                }elseif(is_array($this->props[$key])){
                    if(is_array($value)){
                        $this->props[$key] = array_merge($this->props[$key], $value);
                    }else{
                        $this->props[$key][] = $value;
                    }
                }
            }
        }
    }

    /**
     * @return int
     */
    public function getChildCount() : int {
        return $this->childCount;
    }

    /**
     * @return string
     */
    public function getType() : string {
        return (new \ReflectionClass($this))->getShortName();
    }

    /**
     * @return string
     */
    public function getInlineStyles() : string {
        $styles = "";
        if($this->styles) {
            $values = array_map(function($k, $v) {
                $key = Style::map($k);
                return "$key:$v";
            }, array_keys($this->styles), array_values($this->styles));

            $styles = sprintf(
                'style="%s"', implode(";", $values)
            );
        }

        return "";
    }

    /**
     * @return string
     */
    public function getHtmlProperties() : string {
        $html = "";
        if($this->props) {
            $props = array_map(function($k, $v) {
                return sprintf('%s="%s"', $k, $v);
            }, array_keys($this->props), array_values($this->props));
            $html = implode(" ", $props);
        }
        return $html;
    }
    /**
     * @return bool
     */
    public function isEmpty() : bool {
        return (!$this->children && !$this->content);
    }

    /**
     * Look through the whole tree and get all text elements
     * @return array
     */
    public function getText() : array {
        $elements = [];
        foreach($this->children as $child) {
            if(strcasecmp($child->getType(), "text") === 0) {
                $elements[] = $child;
            }
            else {
                $items = $child->getText();
                if($items) {
                    $elements = array_merge($elements, $items);
                }
            }
        }
        return $elements;
    }

    /**
     * @return string
     */
    public abstract function getTag() : string;

    /**
     * @return string
     */
    public function openTag() : string {
        $tag = trim(
            sprintf("<%s %s", $this->getTag(), $this->getInlineStyles())
        );

        if($props = $this->getHtmlProperties()) {
            $tag .= " $props";
        }

        $tag .= ($this->isEmpty()) ? " />" : ">";
        return $tag;
    }

    /**
     * @return string
     */
    public function closeTag() : string {
        return ($this->isEmpty()) ? "" : sprintf("</%s>", $this->getTag());
    }

    /**
     * @param array $children
     * @return $this
     * @throws \Exception
     */
    public function setChildren(array $children = []) {

        foreach($children as $i => $child) {
            if(is_array($child)) {
                if(count($child) === 1 && isset($child[0]) && is_string($child[0])) {
                    $this->setContent($child[0], $i);
                }
                else {
                    if($childEl = $this->loadChild($child)) {
                        $this->children[] = $childEl;
                    }
                    elseif(isset($child["children"])) {
                        $this->setChildren($child["children"]);
                    }
                }
            }
            elseif (is_string($child)) {
                $this->setContent($child, $i);
            }
        }

        return $this;
    }

    /**
     * @param string $content
     * @return void
     */
    public function setContent(string $content, int $index) {
        $this->content .= $content;
    }

    /**
     * @param array $data
     * @return mixed
     * @throws \Exception
     */
    public function loadChild(array $data) {

        $name = $data["name"] ?? false;
        $type = $data["type"] ?? false;

        $childType = ($type) ? $type : $name;

        if(!$childType) {
            throw new \Exception("Element is missing a type or name property");
        }

        return $this->loadChildClass($childType, $data);
    }

    /**
     * @return string
     */
    public function getNs() : string {
        $parts = explode("\\", get_class($this));
        return implode("\\", array_slice($parts, 0, count($parts) - 1));
    }

    /**
     * @param string $childType
     * @param array $data
     * @return mixed
     * @throws \Exception
     */
    public function loadChildClass(string $childType, array $data) {

        $ns = $this->getNs();
        $cls   = $ns . "\\" . ucwords($childType);
        if(class_exists($cls)) {
            return new $cls($data);
        } else if ($cls === "CL\Pdf\Html\Table\Attendance-input") { // TODO: Find a way to extract SOA exceptions from here
            return new \CL\Pdf\Html\Table\TextSOA($data);
        } else if ($cls === "CL\Pdf\Html\Table\Attendance-checkbox") {
            $image = "https://clink-assets.s3.eu-west-2.amazonaws.com/production/c-link/app/soa-checked.PNG";
            $name = $data["props"]["name"] ?? "";
            $innerData = $data["props"]["data"] ?? "";
            if ($innerData[$name]) {
                $data["props"]["src"] = $image;
                return new \CL\Pdf\Html\Table\Image($data);
            } else {
                return null;
            }
        } else if ($cls === "CL\Pdf\Html\Table\Delete-button") {
            return null;
        } else if ($cls === "CL\Pdf\Html\Table\Add-attendance") {
            return null;
        } else if ($cls === "CL\Pdf\Html\Table\Add-section") {
            return null;
        }

        throw new \Exception("Unknown Element Class $cls");
    }

    /**
     * @return array
     */
    public function getChildren() : array {
        return $this->children;
    }

    /**
     * @param string $type
     * @return array
     */
    public function getChildElementsByType(string $type) : array {
        $children = [];
        foreach($this->children as $child) {
            if(strcasecmp($child->getType(), $type) === 0) {
                $children[] = $child;
            }
        }
        return $children;
    }

    /**
     * @param string $name
     * @return string
     * @throws \Exception
     */
    public function getSnippet(string $name, array $vars = []) : Snippet {
        return new Snippet($name, $this, $vars);
    }

    /**
     * @return string
     */
    public function getContent() : string {
        return $this->content;
    }

    public function getProps(): array {
        return $this->props;
    }

    /**
     * @return string
     */
    public function renderChildren() : string {
        $html = "";
        if($this->renderChildren) {
            foreach($this->getChildren() as $child) {
                $html .= $child->render();
            }
        }
        return $html;
    }

    /**
     * @return string
     */
    public function render() : string {
        $html = $this->openTag();
        $html .= $this->renderChildren();
        $html .= $this->getContent();
        $html .= $this->closeTag();

        return $html;
    }

    /**
     * @return array|\Mpdf\Mpdf|\Spipu\Html2Pdf\Html2Pdf
     */
    public function accessParser()
    {
        return Parser::getParser();
    }

    /**
     * @return string
     */
    public function __toString()
    {
        return $this->render();
    }
}
