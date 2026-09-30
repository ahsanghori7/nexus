<?php

namespace App\DocCreator;

class HiddenFields
{

    /**
     * @param array $content
     * @param array $doc_shortcodes
     * @param array $shortcodes_values
     */
    public static function parseContent(array &$content, array $doc_shortcodes = [], array $shortcodes_values = []): void
    {
        foreach($content as $index => &$value) {
            if(is_array($value)) {
                $hidden = $value['children'][0]['props']['hidden'] ?? [];
                //if we have the key hidden and is not an empty array
                if(!empty($hidden) && is_array($hidden)){
                    $hide = true;
                    foreach($hidden as $hidden_value){
                        //if the hidden key depends on an existing config key
                        if(isset($doc_shortcodes[$hidden_value['key']])){
                            $item = $doc_shortcodes[$hidden_value['key']];
                            $shortcode = $item['code'] ?? null;
                            //if the shortcode value is entered from the config (sidebar form)
                            if(isset($shortcodes_values[$shortcode])){
                                $key = array_search($shortcodes_values[$shortcode], $item['options'], true);
                                //match the shortcode index with the required hidden index
                                if($hidden_value['value'] != $key){
                                    $hide = false;
                                    break;
                                }
                            }
                        }
                    }
                    if($hide){
                        $value['children'][0]['children'] = [];
                    }
                }

                self::parseContent($value, $doc_shortcodes, $shortcodes_values);
            }
        }
    }

    /**
     * @param array $content
     * @param array $doc_shortcodes
     * @param array $shortcodes_values
     * @return array
     */
    public static function parse(array $content, array $doc_shortcodes = [], array $shortcodes_values = []): array
    {
        self::parseContent($content, $doc_shortcodes, $shortcodes_values);
        return $content ?? [];
    }

}
