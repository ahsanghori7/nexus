<?php

namespace App\Models\Shortcode;

class Parser
{
    /**
     * @var array|string[]
     */
    public static array $map = [
        "money" => "getPennyValue"
    ];

    /**
     * @param array $values
     * @param array $shortcodes
     * @return array
     */
    public static function parseValues(array $values, array $shortcodes) {
        foreach($shortcodes as $items) {
            foreach($items as $k => $item) {
                $v = $values[$k] ?? false;
                if($v) {
                    $values[$k] = self::parse(
                        $item["type"] ?? "",
                        $v
                    );
                }
            }
        }
        return $values;
    }

    /**
     * @param string $method
     * @param $val
     * @return false|mixed|void
     */
    public static function parse(string $method, $val) {
        if($val) {
            if(isset(self::$map[$method]))  {
                return forward_static_call([get_called_class(), self::$map[$method]], $val);
            }
        }
        return $val;
    }

    /**
     * @param $val
     * @return int
     */
    public static function getPennyValue($val) : int {
        if(is_string($val)) {
            $val = preg_replace("/[^0-9]/", "", $val);
        }

        return (int) $val;
    }
}
