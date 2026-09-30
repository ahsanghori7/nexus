<?php

namespace CL\Pdf\Html\Table;

use CL\Pdf\Html\Abstraction;

class Shorttext extends Abstraction {

    /**
     * Here we need to allow a max amount of chars per line
     */
    protected int $maxChars = 80;


    public function __construct(array $data = [])
    {
        if(isset(data["props"]["max_chars"])) {
            $this->maxChars = (int) $data["props"]["max_chars"];
            delete($data["props"]["max_chars"]);
        }

        parent::__construct($data);
    }

    /**
     * @return string
     */
    public function getTag(): string
    {
        return "td";
    }

    public function chunkText(string $text) {
        $chunks = [];
        $words = explode(" ", $text);
        $row   = "";
        foreach($words as $word) {
            $len = strlen($word);
            if(strlen($row) + strlen($word) >= $this->maxChars) {
                $chunks[] = trim($row);
                $row = "";
            }
            else {
                $row .= $word . " ";
            }
        }
        return $chunks;
    }


    /**
     * @param string $content
     * @return void
     */
    public function setContent(string $content) {

        $paragraphs = [];
        $len = strlen($content);
        if($len > $this->maxChars) {
            $paragraphs = $this->chunkText($content);
        }
        else {
            $paragraphs[] = $content;
        }

        foreach($paragraphs as $p) {
            $this->content .= "<p>" . $p . "</p>";
        }
    }

}
