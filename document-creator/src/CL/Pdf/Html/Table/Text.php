<?php

namespace CL\Pdf\Html\Table;

use CL\Pdf\Html\Abstraction;

class Text extends Abstraction {
    /**
     * @return string
     */
    public function getTag(): string
    {
        return "";
    }

    /**
     * @param string $content
     * @param int $i
     * @return void
     */
    public function setContent(string $content, int $i)
    {
        if($this->getChildCount() > 0 && ($i - 1) !== $this->getChildCount()) {
            $props = $this->getProps();
            if (isset($props['class'])) {
                $class = $props['class'];
                $content = '<p class="'.$class.'">' . $content . "</p>";
            } else {
                $content = "<p>" . $content . "</p>";
            }
        }
        $this->content .= $content;
    }


    public function render() :string {
        return $this->getContent();
    }
}
