<?php

namespace App\DocCreator\Shortcode;

use App\Factory\Shortcodes;

class SettingsShortcode extends Shortcode
{
    /**
     * @return array
     */
    public function getMapping(): array
    {
        $meta = $this->getDocCreator()->getMeta();
        $v = $meta["config"]["shortcode_version"] ?? self::DEFAULT_SHORTCODES;
        return array_filter(Shortcodes::getCodes($v), static function($value) {
            return $value['type'] == 'settings';
        });
    }
}
