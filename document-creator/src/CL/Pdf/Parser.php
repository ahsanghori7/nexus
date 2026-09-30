<?php

namespace CL\Pdf;

use CL\Pdf\Html\Document;
use Mpdf\Mpdf;
use App\DocCreator\HtmlParser;

class Parser
{


    const CSS_STYLE_MODE = 1;

    /**
     * @var array
     */
    protected $document = [];

    /**
     * @var array
     */
    protected static $parser = [];

    public function __construct(array $data)
    {
        $this->document = new Document($data[0] ?? []);
    }


    /**
     * @return array
     */
    public function getPages(): array
    {
        $pages = [];
        foreach ($this->data as $item) {
            $type = $item["name"] ?? false;
            if ($type === "page") {
                $pages[] = $item;
            }
        }
        return $pages;
    }

    public function generateHtml(): string
    {

        self::newParser();

        $html = '';
        $header = '';
        $footer = '';
        if ($this->document->getHeader()) {
            $header = $this->document->getHeader()->render();
        }
        if ($this->document->getFooter()) {
            $vars = $this->document->getFooter()->getVars();
            if (!key_exists('html', $vars)) {
                $footer = $this->document->getFooter()->render();
            }
        }

        foreach ($this->document->getChildren() as $child) {
            $rendered = HtmlParser::parseOuterTags(HtmlParser::parseTags($child->render()));
            self::getParser()->SetHTMLHeader($header);
            self::getParser()->SetHTMLFooter($footer);
            self::getParser()->AddPage('P', '', '', '', '', 18, 18, 30, 20, 8, 10);
            self::getParser()->WriteHTML($rendered);
            $html .= $header . $rendered . $footer;
        }

        return $html;
    }

    public static function getParser()
    {
        foreach (glob(__DIR__ . "/styles/*.css") as $file) {
            $css = file_get_contents($file);
            if ($css) {
                self::$parser->WriteHTML($css, 1);
            }
        }
        return self::$parser;
    }

    /**
     * @return Mpdf
     * @throws \Mpdf\MpdfException
     */
    public static function newParser(): Mpdf
    {
        return self::$parser = new Mpdf([
            'default_font' => 'Arial',
            'mode' => 'utf-8',
            'format' => 'A4',
            'setAutoBottomMargin' => 'pad'
        ]);
    }

    public  function parse()
    {
        $html =  $this->generateHtml();
        return self::getParser();
    }
}
