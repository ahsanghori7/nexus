<?php

namespace CL\Pdf\Html;

class View extends Abstraction {

    /**
     * @return string
     */
    public function getTag() : string {
        return "";
    }

    /**
     * We overwrite the view object render to avoid nested divs
     * @return string
     */
    public function render() : string {
        return $this->renderChildren();
    }
}
