<?php

namespace CL\Pdf\Html;

class Document extends Abstraction {

    /**
     * @var
     */
    protected static Document $instance;

    protected array $documentStyles = [
        "globals" => [
            "table" => [
                "width:800px",
            ],
            "td" => [
                "width:50%",
                "font-size:16px"
            ]
        ],
        "classes" => [

        ]
    ];


    protected Abstraction $header;

    protected Abstraction $footer;

    public function __construct(array $data = [])
    {
        self::$instance = $this;

        if(isset($data["header"])) {
            $this->header = new Header($data["header"]);
        }

        if(isset($data["footer"])) {
            $this->footer = new Footer($data["footer"]);
        }

        parent::__construct($data);
    }

    /**
     * @return Document
     * @throws \Exception
     */
    public static function getInstance() : Document {
        if(!self::$instance) {
            throw new \Exception("Document not initialized");
        }
        return self::$instance;
    }

    /**
     * @return string
     */
    public function getTag() : string {
        return "document";
    }

    public function getHeader() {
        return $this->header ?? false;
    }

    public function getFooter() {
        return $this->footer ?? false;
    }

    /**
     * For Documents we can ignore inline styles
     * @return string
     */
    public function getInlineStyles() : string {
        $inline = "";
        foreach($this->documentStyles as $type => $styles) {
            foreach($styles as $k => $style) {
                $key = $k;
                if($type === "classes") {
                    $key = "." . $key;
                }
                $inline .= sprintf("%s {%s} ", $key, implode(";", $style));
            }
        }
        return $inline;
    }

    /**
     * @return string
     */
    public function render() : string {

        $html = trim(sprintf("<!DOCTYPE html><html>", $this->getTag()));
        $html .= "<head><style>";
        $html .=  $this->getInlineStyles();
        $html .= "</style></head><body>";


        foreach($this->getChildren() as $child) {
            $html .= $child->render();
        }

        $html .= "</body></html>";
        return $html;
    }
}
