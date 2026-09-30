<?php
namespace App\Utility;

use \App\core\Environment as Env;

class Url {

    /**
     * @var string
     */
    protected string $base;

    public function __construct(string $base) {
        $this->base = $base;
    }

    /**
     * @param string $suffix
     * @param bool $trailingSlash
     * @return string
     */
    public function get(string $suffix = "", bool $trailingSlash = false) : string {

        $url = $suffix;
        $parse_url = parse_url($url);

        /*
         * If the url doesn't contain a scheme we need to format the url
         */
        if(!isset($parse_url['scheme'])){
            $url = sprintf(
                "%s/%s",
                rtrim($this->base, '/'),
                ltrim($url, "/")
            );
        }

        return !$trailingSlash ? rtrim($url, '/') : $url;
    }

    /**
     * @param string $key
     * @param string $fallback
     * @param false $trailingSlash
     * @return string
     */
    public function getUriFromEnv(string $key, string $fallback="", $trailingSlash = false) : string {
        $uri = Env::getValue($key, $fallback, );
        return $this->get($uri, $trailingSlash);
    }

    /**
     * @param string $suffix
     * @return string
     */
    public static function getSiteUrl(string $suffix = "") : string {
        return rtrim(SITE_URL, "/") . "/" . ltrim($suffix, "/");
    }
}
