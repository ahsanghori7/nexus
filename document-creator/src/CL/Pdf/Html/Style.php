<?php

namespace CL\Pdf\Html;

class Style
{
    protected static array $mappings = [

          "flexDirection"   => "flex-flow",
          "backgroundColor" => "background-color",
          "flexWrap"        => "wrap",
          "minHeight"       => "min-height",
          "fontFamily"      =>  "font-family",
          "justifyContent"  => "justify-content",
          "alignItems"      => "text-align"
    ];

    /**
     * @param string $k
     * @return string
     */
    public static function map(string $k) : string {
        return self::$mappings[$k] ?? $k;
    }

}
