<?php

namespace App\core;

use UnexpectedValueException;

class Request
{
    private static $trustedHostPatterns = [];
    public $params = [
    "controller" => null, "action"  => null, "args"  => null, "controller_name"  => null
  ];

    public $data = [];
    public $query = [];
    public $url = null;

    public function __construct($config = [])
    {
        $this->data    = $this->mergeData($_POST, $_FILES);
        $this->query   = $_GET;
        $this->params += isset($config["params"]) ? $config["params"] : [];
        $this->url     = $this->fullUrl();
    }

    /**
     * @param array $post
     * @param array $files
     * @return array
     */
    private function mergeData(array $post, array $files): array
    {
        foreach ($post as $key => $value) {
            if (is_string($value)) {
                $post[$key] = trim($value);
            }
        }
        return array_merge($files, $post);
    }

    /**
     * @param array $exclude
     * @return int
     */
    public function countData(array $exclude = []): int
    {
        $count = count($this->data);
        foreach ($exclude as $field) {
            if (array_key_exists($field, $this->data)) {
                $count--;
            }
        }
        return $count;
    }

    /**
     * @return array|mixed|object
     */
    public function getJson()
    {
        return json_decode(file_get_contents("php://input"), true);
    }

    /**
     * @return false|string
    */
    public function getStream()
    {
        return file_get_contents("php://input");
    }

    /**
     * @param array $keys
     * @return array|mixed|object
     * @throws \Exception
     */
    public function getRequiredJson(array $keys = [])
    {
        $json = $this->getJson();
        if (!$json) {
            throw new \Exception("Bad Request missing json");
        }
        if ($keys) {
            foreach ($keys as $key) {
                if (!isset($json[$key])) {
                    throw new \Exception("Bad Request missing json key $key");
                }
            }
        }
        return $json;
    }

    /**
     * @param $key
     * @return mixed|null
     */
    public function data($key)
    {
        return array_key_exists($key, $this->data) ? $this->data[$key] : null;
    }

    /**
     * @param $key
     * @return mixed|null
     */
    public function query($key)
    {
        return array_key_exists($key, $this->query) ? $this->query[$key] : null;
    }


    /**
     * @param $key
     * @return mixed|null
     */
    public function param($key)
    {
        return array_key_exists($key, $this->params) ? $this->params[$key] : null;
    }

    /**
     * @return bool
     */
    public function isAjax(): bool
    {
        //if we allow to view ajax request directly from url
        if (Config::get('debug.ajax_direct_view') && $this->params['controller_name'] == 'ajax') {
            return true;
        }

        if (!empty($_SERVER['HTTP_X_REQUESTED_WITH'])) {
            return strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
        }
        return false;
    }

    /**
     * @param $key
     * @param null $default
     * @return mixed|null
     */
    public function getQueryValue($key, $default = null)
    {
        $query= $this->getQuery();
        return $query[$key] ?? $default;
    }

    /**
     * @return array
     */
    public function getData(): array
    {
        return $this->data;
    }

    /**
     * @param null $k
     * @return array
     */
    public function getQuery($k=null)
    {
        $parse = parse_url($this->url);
        $query = [];
        if (isset($parse["query"])) {
            foreach (explode("&", $parse["query"]) as $p) {
                list($k, $v) = explode("=", $p);
                if (!$v) {
                    $v = true;
                }
                $query[$k] = $v;
            }
        }
        return $query;
    }

    /**
     * @return bool
     */
    public function isPost(): bool
    {
        return $_SERVER["REQUEST_METHOD"] === "POST";
    }

    /**
     * @return string
     */
    public function getMethod(): string
    {
        return $_SERVER["REQUEST_METHOD"];
    }

    /**
     * @param string $method
     * @return bool
     */
    public function isMethod(string $method): bool
    {
        return (strcasecmp($method, $this->getMethod()) === 0);
    }

    /**
     * @return bool
     */
    public function isGet(): bool
    {
        return $_SERVER["REQUEST_METHOD"] === "GET";
    }

    /**
     * @return bool
     */
    public function isSSL(): bool
    {
        return isset($_SERVER['HTTPS']) && !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== "off";
    }

    /**
     * @param array $params
     * @return $this
     */
    public function addParams(array $params): Request
    {
        $this->params = array_merge($this->params, $params);
        return $this;
    }

    /**
     * @return int
     */
    public function contentLength(): int
    {
        return (int)$_SERVER['CONTENT_LENGTH'];
    }


    /**
     * @return bool
     */
    public function dataSizeOverflow(): bool
    {
        $contentLength = $this->contentLength();
        return empty($this->data);
    }

    /**
     * @return mixed|null
     */
    public function uri()
    {
        return isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : null;
    }

    /**
     * @return string
     */
    public function host(): string
    {
        if (php_sapi_name() === 'cli') {
            return "";
        }

        if (!$host = $_SERVER['HTTP_HOST']) {
            if (!$host = $this->name()) {
                $host = $_SERVER['SERVER_ADDR'];
            }
        }
        $host = strtolower(trim($host));

        // Check for non-standard ports and append them
        $port = $_SERVER['SERVER_PORT'];
        if ($port && $port != 80 && $port != 443 && !strpos($host, ':')) {
            $host .= ':' . $port;
        }

        if ($host && preg_replace('/(?:^\[)?[a-zA-Z0-9-:\]_]+\.?/', '', $host) !== '') {
            throw new UnexpectedValueException(sprintf('Invalid Host "%s"', $host));
        }

        // checkhere
        // check the hostname against a trusted list of host patterns to avoid host header injection attacks
        if (count(self::$trustedHostPatterns) > 0) {
            foreach (self::$trustedHostPatterns as $pattern) {
                if (preg_match($pattern, $host)) {
                    return $host;
                }
            }

            throw new UnexpectedValueException(sprintf('Untrusted Host "%s"', $host));
        }

        return $host;
    }

    /**
     * @return mixed|null
     */
    public function name()
    {
        return isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : null;
    }

    /**
     * @return mixed|null
     */
    public function referer()
    {
        return isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : null;
    }

    /**
     * @return mixed|null
     */
    public function clientIp()
    {
        return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : null;
    }

    /**
     * @return mixed|null
     */
    public function userAgent()
    {
        return isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : null;
    }

    /**
     * @return string
     */
    public function protocol(): string
    {
        return $this->isSSL() ? 'https' : 'http';
    }

    /**
     * @return string
     */
    public function getProtocolAndHost(): string
    {
        return $this->protocol() . '://' . $this->host();
    }

    /**
     * @param string $dashboard
     * @return mixed|array|bool|string
     */
    public function redirectDashboard(string $dashboard = '')
    {
        if (!$dashboard) {
            $dashboard = user_role(true);
        }
        return $dashboard;
    }

    /**
     * @param string $controller
     * @return string
     */
    public function dashboardUrl(string $controller = ''): string
    {

        //check herer
        //this will not work from ajax because the controller will be "ajax" and not specialist/main-contractor etc
        $controller = e_html($controller);
        if ($controller) {
            return $this->root() . $this->param('controller_name') . '/' . $controller;
        }

        return $this->root() . $this->param('controller_name');
    }

    /**
     * @return string
     */
    public function fullUrl(): string
    {
        $uri = $this->uri();
        if ( str_contains((string)$uri, '?') ) {
            list($uri) = explode('?', $uri, 2);
        }

        $query    = "";
        $queryArr = $this->query;
        unset($queryArr['url']);
        unset($queryArr['redirect']);

        if (!empty($queryArr)) {
            $query .= '?' . http_build_query($queryArr, "", '&');
        }

        return $this->getProtocolAndHost() . $uri . $query;
    }

    /**
     * @return string|string[]|null
     */
    public function fullUrlWithoutProtocol()
    {
        return preg_replace('#^https?://#', '', $this->fullUrl());
    }

    /**
     * @return string|string[]
     */
    public function getBaseUrl()
    {
        $baseUrl = str_replace(['public', '\\'], ['', '/'], dirname($_SERVER['SCRIPT_NAME']));
        return $baseUrl;
    }

    /**
     * @return string
     */
    public function root(): string
    {
        return $this->getProtocolAndHost() . $this->getBaseUrl();
    }

    /**
     * @param string $key
     * @return array
     */
    public static function getArgArray(string $key): array
    {
        if (isset($_GET[$key])) {
            return explode(",", rtrim(ltrim($_GET[$key], "["), "]"));
        }
        return [];
    }

    /**
     * @param string $key
     * @return array|mixed
     */
    public static function getArg(string $key)
    {
        return $_GET[$key] ?? null;
    }
}
