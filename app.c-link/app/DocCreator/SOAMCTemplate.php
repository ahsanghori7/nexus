<?php

namespace App\DocCreator;

class SOAMCTemplate extends SOATemplate
{
    /**
     * @var string
     */
    public const TABLE_TEMPLATE = 'soamc';

    /**
     * @param array $content
     * @param string $table_content
     */
    public static function parseContent(array &$content, string $table_content): void
    {
        foreach ($content as &$value) {
            if (is_array($value)) {
                if (isset($value['children']) && is_array($value['children'])) {
                    foreach ($value['children'] as $idx => &$child) {
                        if (is_array($child)) {
                            $type = $child['type'] ?? null;
                            if ($type && self::hasShortcode((string)$type)) {
                                $model = self::getModel();
                                $childModel = new $model($child, $table_content);
                                $value['children'][$idx] = $childModel->getRows();
                            } else {
                                self::parseContent($child, $table_content);
                            }
                        }
                    }
                }
                foreach ($value as &$subval) {
                    if (is_array($subval)) {
                        self::parseContent($subval, $table_content);
                    }
                }
            }
        }
    }
}
