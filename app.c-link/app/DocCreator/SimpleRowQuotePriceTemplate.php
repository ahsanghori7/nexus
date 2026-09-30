<?php

namespace App\DocCreator;

class SimpleRowQuotePriceTemplate extends TableTemplate
{

    /**
     * @var string
     */
    public const TABLE_TEMPLATE = 'document';

    /**
     * @var int
     */
    public const DEFAULT_VAT = 20;

    /**
     * @var array|string[]
     */
    public static array $shortcodes = [
        "SimpleRowQuotePrice",
        "MiniBoqTotal"
    ];

    /**
     * @param array $content
     * @param array $models
     * @param float $price
     * @param int $vat
     * @return array
     */
    public static function parse(array $content, array $models, float $price = 0, int $vat = 0): array
    {
        $table_content = $models[static::TABLE_TEMPLATE] ?? [];
        if ($table_content) {
            $table_content = $table_content->getContent();
        }
        static::parseContent($content, $table_content ?? '', $price, $vat);
        return $content ?? [];
    }

    public static function parseContent(array &$content, string $table_content, float $price = 0, int $vat = 0): void
    {
        if ($table_content) {
            $currency_symbol = config('currency.symbol');
            $quotePrice = 0;
            foreach ($content as &$value) {
                if (is_array($value)) {
                    $children = $value['children'] ?? [];
                    if (is_array($children) && count($children) > 0) {
                        $children = new SimpleRowQuotePrice($value, $table_content);

                        $id = isset($children->getProps()["id"]) ? $children->getProps()["id"] : false;
                        if (self::hasShortcode($id)) {
                            $value['children'][1]["children"][1]["children"][0] = $currency_symbol . number_format($price, 2);
                        }

                        $subtype = $children->getSubType() ?? false;
                        if (self::hasShortcode($subtype)) {
                            $subtotal = $currency_symbol . number_format($price, 2);
                            $total = $currency_symbol . number_format($price + $vat / 100 * $price, 2);
                            $value["children"][0]["children"][1]["children"] = [$subtotal];
                            $value["children"][1]["children"][1]["children"] = [$vat . "%"];
                            $value["children"][2]["children"][1]["children"] = [$total];
                        }
                    }
                    self::parseContent($value, $table_content, $price, $vat);
                }
            }
        }
    }
}
