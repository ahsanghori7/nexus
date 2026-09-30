<?php


namespace App\Api;

use App\Api\Client\Response\JsonResponse;
use App\Api\Client\Response\JsonException;
use App\core\Config;
use App\Api\Client\Request;

abstract class Client
{
    /**
     * @var array
     */
    protected static $security = [];

    /**
     * @param string $k
     * @return false
     */
    public static function getForwardingAddress(string $k) {}

    /**
     * @return mixed
     */
    public static function getConfig($suffix = "")
    {
        $cls = get_called_class();
        $reflection = new \ReflectionClass($cls);
        if (array_key_exists('API_CONFIG_KEY', $reflection->getConstants())) {
            $key = $cls::API_CONFIG_KEY;
        } else {
            $key = strtolower($reflection->getShortName());
        }

        if ($suffix) {
            $key = $key . "." . $suffix;
        }

        return Config::get('api.' . $key);
    }

    /**
     * @return array
     */
    public static function getSecurity()
    {
        return self::$security;
    }

    /**
     * @param $key
     * @param $data
     */
    public static function setCache($key, $data)
    {
        self::$cache[$key] = $data;
    }

    /**
     * @param $key
     * @return array|mixed
     */
    public static function getCache($key)
    {
        return self::$cache[$key] ?? [];
    }

    /**
     * @param $endpoint
     * @param $data
     * @param string $verb
     * @param false $debug
     * @return mixed|string[]
     * @throws Exception
     */
    public static function call($endpoint, $data, $verb = "POST", $debug = false)
    {
        $conf = self::getConfig();
        $result = curl($conf["url"] . $endpoint, $data, $verb);
        if ($result) {
            $result = json_decode($result, true);
        } else {
            $result = ["error" => ["friendly" => "An error has occurred"]];
        }

        if (isset($result["error"])) {
            $error = $result["error"];
            $message = $error["friendly"] ?? $error["description"];
            // Use appropriate status code from error response if available, otherwise default to 500 for general API failures
            $statusCode = $error["status_code"] ?? $error["code"] ?? 500;
            throw new Exception($message, $statusCode);
        }

        return $result["data"];
    }

    /**
     * @param string $suffix
     * @return string
     */
    public static function getBaseUrl(string $suffix = ""): string
    {
        $conf = self::getConfig();
        return $conf["url"] . $suffix;
    }

    /**
     * @param string $uri
     * @return Request
     */
    public static function getRequest(string $uri, $type = "GET")
    {
        $cls = get_called_class();
        $request = new Request($cls::getBaseUrl($uri), $type);
        //Really need to move the api client logic to instance instead of static..
        if (method_exists($cls, "getApiHeaders")) {
            if ($headers = $cls::getApiHeaders()) {
                $request->setHeaders($headers);
            }
        }
        return $request;
    }

    /**
     * @param string $uri
     * @param array $params
     * @param array $headers
     * @return mixed
     * @throws \Exception
     */
    public static function get(string $uri, array $params = [], array $headers = [])
    {
        $cls = get_called_class();

        $response = $cls::getRequest($uri)->setHeaders($headers)->setParams($params)->call();

        $json = $response->json();

        if ($json && isset($json["data"])) {
            return $json["data"];
        } elseif (isset($json["error"])) {
            $error = $json["error"];
            $message = $json["friendly"] ?? $error["description"];
            // Use appropriate status code from error response if available, otherwise default to 400
            $statusCode = $json["status_code"] ?? $json["code"] ?? 400;
            throw new \Exception("Api Error: " . $message, $statusCode);
        } else {
            throw new \Exception("An api GET error occurred for uri: $uri", 404);
        }
    }

    /**
     * @param string $uri
     * @param array $params
     * @param array $headers
     * @return mixed
     * @throws \Exception
     */
    public static function delete(string $uri, array $params = [], array $headers = [])
    {
        $cls = get_called_class();
        $response = $cls::getRequest($uri, 'DELETE')->setHeaders($headers)->setParams($params)->call();
        $json = $response->json();
        if (isset($json["error"])) {
            $error = $json["error"];
            $message = $json["friendly"] ?? $error["description"];
            // Use appropriate status code from error response if available, otherwise default to 400
            $statusCode = $json["status_code"] ?? $json["code"] ?? 400;
            throw new \Exception($message, $statusCode);
        }

        return $response;
    }

    /**
     * Abstract hook for api headers
     * @return array
     */
    public static function getApiHeaders(): array
    {
        return [];
    }

    /**
     * @param string $uri
     * @param array $data
     * @param array $headers
     * @param array $options
     */
    public static function post(string $uri, array $data, array $headers = [], array $options = [])
    {
        $cls = get_called_class();
        $request = $cls::getRequest($uri, "POST")
            ->setHeaders($headers)
            ->setOptions($options)
            ->setData($data)->call();

        return $request;
    }

    /**
     * @param string $uri
     * @param array $data
     * @param array $headers
     * @param array $options
     */
    public static function patch(string $uri, array $data = [], array $headers = [], array $options = [])
    {
        $cls = get_called_class();
        $request = $cls::getRequest($uri, "PATCH")
            ->setHeaders($headers)
            ->setOptions($options)
            ->setData($data)->call();

        return $request;
    }

    /**
     * @param string $uri
     * @param array $data
     * @param array $headers
     * @param array $options
     * @return mixed
     */
    public static function postForm(string $uri, array $data, array $headers = [], array $options = [])
    {
        $headers["Content-Type"] = "application/x-www-form-urlencoded";
        $cls = get_called_class();
        return $cls::post($uri, $data, $headers, $options);
    }

    /**
     * @param array $data
     * @return JsonResponse
     */
    public static function jsonResponse(array $data, int $status = 0)
    {
        return new JsonResponse($data, $status);
    }

    /**
     * @param string $file
     * @param bool $removeFile
     */
    public static function downloadResponse(string $file, bool $removeFile = false, $filename = null): void
    {
        if (file_exists($file)) {
            $file_info = pathinfo($file);
            $name = is_string($filename) ? $filename : $file_info['basename'];
            header('Content-Type: ' . $file_info['extension']);
            header("Content-Disposition: attachment; filename={$name}");
            header('Content-Length: ' . filesize($file));
            readfile($file);
            if ($removeFile) {
                unlink($file);
            }
            exit;
        }
        throw new \Exception("The file does not exist : $file", 404);
    }

    /**
     * @param string $uri
     * @param array $params
     * @param array $headers
     * @param array $options
     * @return void
     * @throws \Exception
     */
    public static function downloadContentFromUrl(string $uri, array $params = [], array $headers = [], array $options = []): void
    {
        $cls = get_called_class();
        $response = $cls::getRequest($uri)->setHeaders($headers)->setParams($params)->call();
        $content  = $response->getResponse();
        if ($content) {
            header('Content-Type: '.$options['type']);
            header('Content-Length: ' . strlen($content));
            header('Content-disposition: inline; filename="'.$options['name'].'"');
            header('Cache-Control: public, must-revalidate, max-age=0');
            header('Pragma: public');
            echo $content;
            exit;
        }
        throw new \Exception("No content found for uri: $uri", 404);
    }

    /**
     * @param $message
     * @param string $level
     */
    public static function errorLog($message, $level = "fatal")
    {
        error_log(sprintf(
            "%s|%s : %s",
            $level,
            get_called_class(),
            $message
        ));
    }

    /**
     * @param string $message
     * @param int $code
     * @param \Exception|null $e
     * @throws JsonException
     */
    public static function throwJsonException(string $message, int $code = 500, ?\Exception $e = null, $error = "")
    {
        if ($e || $error) {
            self::errorLog(($e) ? $e->getMessage() : $error);
        }
        throw new JsonException($message, $code);
    }

    /**
     * @return bool
     */
    public static function isEnabled(): bool
    {
        return (bool) self::getConfig("enabled");
    }
}
