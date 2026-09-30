<?php

namespace App\DocCreator;

class TableTemplate
{

    /**
     * @var string
     */
    public const TABLE_TEMPLATE = '';

    /**
     * @var array|string[]
     */
    public static array $shortcodes = [];

    /**
     * @var string
     */
    public static string $model = '';

    /**
     * @var array|string[]
     */
    public static array $table_models = [
        'SimpleRowQuotePrice' => SimpleRowQuotePrice::class,
        'mini_boq' => MiniBoq::class,
        'soa'      => SOA::class,
        'soamc'    => SOAMC::class,
    ];

    /**
     * @return array|string[]
     */
    public static function getShortcodes(): array
    {
        return static::$shortcodes;
    }

    /**
     * @return string
     */
    public static function getModel(): string
    {
        return self::$table_models[static::TABLE_TEMPLATE] ?? Table::class;
    }

    /**
     * @param string $shortcode
     * @return bool
     */
    public static function hasShortcode(string $shortcode): bool
    {
        return in_array($shortcode, self::getShortcodes(), true);
    }

    /**
     * @param array $content
     * @param string $table_content
     */
    public static function parseContent(array &$content, string $table_content): void
    {
        foreach ($content as &$value) {
            if (is_array($value)) {
                $children = $value['children'][0] ?? [];
                if (is_array($children)) {
                    $model    = self::getModel();
                    $children = new $model($children, $table_content);
                    if (self::hasShortcode((string)$children->getType())) {
                        $value['children'][0] = $children->getRows();
                    }
                }
                self::parseContent($value, $table_content);
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
        $table_content = $models[static::TABLE_TEMPLATE] ?? [];
        if ($table_content) {
            $table_content = $table_content->getContent();
        }
        static::parseContent($content, $table_content ?? '');
        return $content ?? [];
    }
}
