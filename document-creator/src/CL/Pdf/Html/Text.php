<?php

namespace CL\Pdf\Html;

class Text extends Abstraction {

    /**
     * @var array
     */
    protected array $lines = [];
    /**
     * @return string
     */
    public function getTag() : string {
        if($this->childCount > 1) {
            return "div";
        }
        return "p";
    }

    /**
     * @param string $content
     * @return void
     */
    public function setContent(string $content, int $index)
    {
        $this->lines[] = $content;

        if($this->childCount > 1) {
            if($content !== "<br/>" ){
                $content = "<div>" . $content . "</div>";
            }
        }

        parent::setContent($content, $index);
    }

    /**
     * @return array
     */
    public function getLines() : array {
        return $this->lines;
    }

}
