<?php
namespace App\Factory;

use App\core\Config;
use App\Models\Shortcode;
use App\Models\Collection;

class Shortcodes {

    /**
     * @var Collection
     */
    protected static Collection $shortcodes;

    /**
     * @var array
     */
    protected static array $codes = [];

    /**
     * @return array
     */
    public static function getCodes(string $version = "1.0") : array {
        if(!self::$codes) {
            $conf = Config::get('document.shortcodes');
            $versions = glob($conf["path"] . "/*");
            foreach($versions as $file) {
                $info = pathinfo($file);
                self::$codes[$info["filename"]] = json_decode(file_get_contents($file), true);
            }
        }

        if($version) {
            return self::$codes[$version] ?? [];
        }
        return self::$codes;
    }

    /**
     * @return array
     */
    public static function loadShortcodes() : array {
        $conf = Config::get('document.shortcodes');
        $mappings   = json_decode(file_get_contents($conf["mapping"]), true);
        $items      = [];
        foreach($mappings as $sc) {
            foreach($sc["templates"] as $slug) {
                $items[] = [
                    "codes" => function() { return self::getCodes(); },
                    "slug"  => $slug,
                    "versions" => $sc["versions"]
                ];
            }
        }
        return $items;
    }

    /**
     * @return Collection
     */
    public static function getShortcodes() : Collection {

        if(!isset(self::$shortcodes)) {
            self::$shortcodes = new Collection(
                 self::loadShortcodes(),
                Shortcode::class,
                null,
                "slug"
            );
        }
        return self::$shortcodes;
    }

    /**
     * @param string $slug
     * @return mixed
     */
    public static function getBySlug(string $slug) {
        return self::getShortcodes()->filterByStringField("slug", $slug)->getFirst();
    }
}
