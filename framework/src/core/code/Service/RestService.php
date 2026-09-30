<?php

namespace Core\Service;

use Core\Data\Collection;
use Core\Data\Shape;
use Core\Layer\Http\Outgoing as HttpRequest;
use Core\Layer\OutgoingInterface;
use Core\Service\Exception\RestException;

class RestService extends ServiceAbstract
{
    /**
     * @var String
     */
    const CONTENT_TYPE = "application/json";

    /**
     * @var array<string, Collection>
     */
    protected static array $typeCache = [];

    /**
     * @param string $path
     * @return OutgoingInterface
     */
    public function getNewRequest(string $path) : OutgoingInterface
    {
        return new HttpRequest($path);
    }

    /**
     * @param string $uri
     * @return string
     */
    public function getPath(string $uri = "") : string {
        $url = $this->get("url", "");
        if(is_string($url)) {
            $url = rtrim($url, "/") . "/". ltrim($uri,"/");
        }
        else {
            throw new \Exception("Url must be string");
        }
        return $url;
    }

    /**
     * @param string $path
     * @param array<string, string> $params
     * @return Shape
     */
    public function fetch(string $path, array $params=[], array $options = [], array $headers = []) : Shape {
       $res     = $this->makeRequest($path, $params, headers:$headers)->setOptions($options)->getResponse();
       $content = $res->get("content");
       $json    = is_string($content) ? json_decode($content, true) : [];
       $code    = $res->get("info.http_code");
       if($code !== 200) {
           throw new RestException($res,
               "GET",
               strval($res->get("info.url")),
               intval($code));
       }

       if(is_array($json)) {
           $res->set("data", new Shape($json["data"] ?? $json));
       }

       return $res;
    }

    /**
     * @param string $path
     * @param array<string, string> $params
     * @return Shape
     */
    public function delete(string $path, array $params=[]) : Shape {
        return $this->makeRequest($path, $params)->setOptions([
            CURLOPT_CUSTOMREQUEST => "DELETE"
        ])->getResponse();
    }

    /**
     * @param string $path
     * @param Shape $shape
     * @return Shape
     * @throws \Exception
     */
    public function write(string $path, Shape $shape) : Shape {
        return $this->makeRequest($path, (array)$shape->get("params",[]), (array)$shape->get("data",[]), (array)$shape->get("headers",[]))->setOptions(
            (array)$shape->get("options",[]) + [
                CURLOPT_CUSTOMREQUEST => "POST"
            ]
        )->getResponse();
    }

    /**
     * @param string $path
     * @param Shape $shape
     * @return Shape
     * @throws \Exception
     */
    public function update(string $path, Shape $shape) : Shape {
        return $this->makeRequest($path, (array)$shape->get("params",[]), (array)$shape->get("data",[]), (array)$shape->get("headers",[]))->setOptions(
            (array)$shape->get("options",[]) + [
                CURLOPT_CUSTOMREQUEST => "PATCH"
            ]
        )->getResponse();
    }



    /**
     * @param string $resource
     * @return Collection
     * @throws \Exception
     */
    public function fetchTypes(string $resource) : Collection {
        if(!isset(self::$typeCache[$resource])) {
            $res  = $this->fetch($resource . "/type");
            $data = array_map(function ($i) {
                if(is_array($i)) {
                    return [
                        "id"    => $i["id"] ?? null,
                        "label" => $i["label"] ?? null
                    ];
                }
            }, $res->getShape("data")->toArray());

            self::$typeCache[$resource] = new Collection(
                $data, Shape::class
            );
        }
        return self::$typeCache[$resource];
    }
}
