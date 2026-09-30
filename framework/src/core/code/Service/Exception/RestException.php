<?php

namespace Core\Service\Exception;

use Core\Data\Shape;
use Core\Layer\Http\Code;
use Core\Service\ServiceException;

class RestException extends ServiceException
{

    /**
     * @param Shape $res
     * @param string $method
     * @param string $url
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(Shape $res, string $method, string $url, int $code = 0,  ?\Throwable $previous = null)
    {
        $content   = strval($res->get("content"));
        $json      = json_decode($content, true);
        $curlError = $res->get("error");
        if(is_array($curlError) && isset($curlError["code"]) && $curlError["code"]) {
            $error = $curlError["message"];
            $code  = $curlError["code"];
        }
        elseif(is_array($json) && isset($json["error"])) {
            $error = $json["error"];
        }
        elseif($content) {
            $error = $content;
        }
        else{
            $error = Code::get($code);
        }

        $message = json_encode([
            "type"    => $method,
            "url"     => $url,
            "code"    => $code,
            "message" => $error
        ]);

        parent::__construct(
            is_string($message) ? $message : "Json Parse error in RestException Constructor", $code, $previous
        );
    }


}
