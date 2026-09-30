<?php

use App\core\Config;

/**
 * C-link.com as a domain isnt legacy, but we need a function do sperate it from app.c-link
 * @param string $suffix
 * @return string
 */
function getClinkUrl(string $suffix = "")
{
    $url = rtrim(Config::get('url.c-link'), "/");
    if ($suffix) {
        $url .= "/" . ltrim($suffix, "/");
    }
    return $url;
}

if (!function_exists('clink_url')) {
    function clink_url(string $page = '')
    {
        return getClinkUrl($page);
    }
}
