<?php

namespace App\DocCreator;

class MiniBoqTemplate extends TableTemplate
{

    /**
     * @var string
     */
    public const TABLE_TEMPLATE = 'mini_boq';

    /**
     * @var array|string[]
     */
    public static array $shortcodes = [
        'MiniBoqTemplate',
        "MiniBoqTotal",
    ];

    public static function parseContent(array &$content, string $table_content): void
    {
        if ($table_content) {
            foreach ($content as &$value) {
                if (is_array($value)) {
                    $children = $value['children'][0] ?? [];
                    if (is_array($children)) {
                        $children = new MiniBoq($children, $table_content);
                        if (self::hasShortcode((string)$children->getType())) {
                            $value['children'][0] = $children->getRows();
                        }
                        if (self::hasShortcode((string)$children->getSubType())) {
                            $value['children'][0] = $children->getRowsTotal();
                        }
                    }
                    self::parseContent($value, $table_content);
                }
            }
        }
    }
}
