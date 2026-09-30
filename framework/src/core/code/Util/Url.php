<?php

namespace Core\Util;

class Url
{
    public function __construct(
        /** @var string */
        protected string $url
    ){}

    /**
     * @param string $key
     * @return string
     */
    public function getUrlComponent(string $key) : string|int
    {
        $parsed = parse_url($this->url);
        if($parsed && isset($parsed[$key])) {
            return $parsed[$key];
        }
        return "";
    }

    /**
     * @return string
     */
    public function getHost() : string {
        $host = $this->getUrlComponent("host");
        return is_string($host) ? $host : "";

    }

    /**
     * @return string
     */
    public function getScheme() : string {
        $scheme = $this->getUrlComponent("scheme");
        return is_string($scheme) ? $scheme : "";
    }

    /**
     * @return string
     */
    public function getPath() : string {
        $path = $this->getUrlComponent("path");
        return is_string($path) ? $path : "";
    }

    /**
     * @return array<int, string>
     */
    public function getPathParts() : array {
        return array_values(array_filter(explode("/", $this->getPath())));
    }

    /**
     * @param int $i
     * @return string
     */
    public function getUri(int $i) : string {
        return $this->getPathParts()[$i] ?? "";
    }

    /**
     * @return array<string, string>
     */
    public function getArguments() : array {
        $query = $this->getUrlComponent("query");
        if($query && is_string($query)) {
            parse_str($query, $output);
            return $output ?? [];
        }
        return [];
    }
}
