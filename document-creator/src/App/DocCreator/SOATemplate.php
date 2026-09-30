<?php

namespace App\DocCreator;

class SOATemplate
{

    /**
     * @var array|string[]
     */
    protected static array $shortcodes = [
        'ScheduleAttendancesTemplate'
    ];

    /**
     * @return array|string[]
     */
    public static function getShortcodes(): array
    {
        return self::$shortcodes;
    }

    /**
     * @param string $shortcode
     * @return bool
     */
    public static function hasScheduleOfAttendancesShortcode(string $shortcode): bool
    {
        return in_array($shortcode, self::getShortcodes(), true);
    }

    /**
     * @param array $content
     * @param string $soa_content
     */
    public static function parseContent(array &$content, string $soa_content): void
    {
        foreach($content as &$value) {
            if(is_array($value)) {
                $children = $value['children'][0] ?? [];
                if(is_array($children)) {
                    $children = new SOA($children, $soa_content);
                    if(self::hasScheduleOfAttendancesShortcode((string)$children->getType())){
                        $value['children'][0] = $children->getRows();
                    }
                }
                self::parseContent($value, $soa_content);
            }
        }
    }

    /**
     * @param array $content
     * @param array $models
     * @return array
     */
    public static function parse(array $content, array $models): array
    {
        $soa = $models['soa'] ?? [];
        if($soa){
            $soa_content = $soa->getContent();
        }
        self::parseContent($content, $soa_content ?? '');
        return $content ?? [];
    }

}
