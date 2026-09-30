<?php

namespace CL\Pdf\Html\Table;

use CL\Pdf\Html\Abstraction;
use DOMDocument;
use DOMXPath;

class Column extends Abstraction
{
    /**
     * @return string
     */
    public function getTag(): string
    {
        return "";
    }

    private function setOlTypesByDepth($html) {
        libxml_use_internal_errors(true);

        $dom = new DOMDocument();
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html);

        $xpath = new DOMXPath($dom);
        $olNodes = $xpath->query('//ol');

        foreach ($olNodes as $ol) {
            $depth = 0;
            $parent = $ol->parentNode;

            while ($parent) {
                if ($parent->nodeName === 'ol') {
                    $depth++;
                }
                $parent = $parent->parentNode;
            }

            if ($depth === 1) {
                $ol->setAttribute('type', 'a');
                $ol->setAttribute('style', 'list-style-type: lower-alpha;');
            } elseif ($depth === 2) {
                $ol->setAttribute('type', 'i');
                $ol->setAttribute('style', 'list-style-type: lower-roman;');
            }
        }

        $innerHTML = '';
        $elementBody = $dom->getElementsByTagName('body');
        if ($elementBody->length) {
            $body = $elementBody->item(0);
            foreach ($body->childNodes as $child) {
                $innerHTML .= $dom->saveHTML($child);
            }
        }

        return $innerHTML;
    }

    /**
     * @param string $content
     * @param int $i
     * @return void
     */
    public function setContent(string $content, int $i)
    {
        if ($this->getChildCount() > 0 && ($i - 1) !== $this->getChildCount() && $content) {
            $content = $this->setOlTypesByDepth($content);
        }
        $this->content .= $content;
    }


    public function render(): string
    {
        return $this->getContent();
    }
}
