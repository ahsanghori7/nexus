<?php

namespace Core\Layer\Http;


use Core\Data\Shape;
use Core\Layer\IoAbstract;
use Core\Layer\OutgoingInterface;

class Outgoing extends IoAbstract implements OutgoingInterface
{

    /**
     * @var string
     */
    protected string $path;

    /**
     * @var Shape
     */
    protected Shape $arguments;

    /**
     * @var Shape
     */
    protected Shape $data;

    /**
     * @var array<int, mixed>
     */
    protected array $options = [
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_COOKIESESSION => 1
    ];

    /**
     * @var array<string, string>
     */
    protected array $headers = [];


    /**
     * @param string $path
     * @param array<int, mixed> $options
     * @param array<string, string> $headers
     */
    public function __construct(string $path = "", array $options = [], array $headers = [])
    {
        $this->path = $path;
        $this->setHeaders($headers)->setOptions($options);
    }

    /**
     * @return string
     */
    public function getPath() : string {
        return $this->path;
    }

    /**
     * @param Shape $args
     * @return Outgoing
     */
    public function setArgs(Shape $args) : Outgoing {
        if(!isset($this->arguments)) {
            $this->arguments = $args;
        }
        else {
            foreach($args->toArray() as $k => $v) {
                if(is_string($k)) {
                    $this->arguments->set($k, $v);
                }
            }
        }

        return $this;
    }

    /**
     * @return Shape
     */
    public function getArgs() : Shape {
        if(!isset($this->arguments)) {
            $this->arguments = new Shape();
        }
        return $this->arguments;
    }

    /**
     * @param Shape $data
     * @return $this
     */
    public function setData(Shape $data) : Outgoing {
        $this->data = $data;
        return $this;
    }

    /**
     * @param array<int, mixed> $options
     * @return $this
     */
    public function setOptions(array $options) : Outgoing {
        foreach($options as $k => $v) {
            $this->options[$k] = $v;
        }
        return $this;
    }

    /**
     * @param array<string, string> $headers
     * @return $this
     */
    public function setHeaders(array $headers) : Outgoing {
        foreach($headers as $k => $v) {
            $this->headers[$k] = $v;
        }
        return $this;
    }

    /**
     * @param string $path
     * @return OutgoingInterface
     */
    public function setPath(string $path) : OutgoingInterface {
        $this->path = $path;
        return $this;
    }

    /**
     * @return mixed
     */
    public function getBody() : mixed
    {
        $type = $this->headers["Content-Type"] ?? "";
        if(isset($this->data)) {
            $data = $this->data->toArray();
            if ($type === "application/json") {
                return json_encode($data);
            } elseif ($type === "application/x-www-form-urlencoded") {
                return http_build_query($data);
            } elseif ($type == 'multipart/form-data'){
                return $data;
            }
        }
        return "";
    }

    public function getResponse() : Shape
    {
        $path = $this->getPath();

        /*
         * Making sure that every args keys has an actual value
         * PHP stan fails at this, expecting array filter to be passed a callable, as it casts internally and I feel there is
         * no value writing extra logic here for no benifit
         */
        /** @phpstan-ignore-next-line */
        $args = array_filter(
            $this->getArgs()->toArray(),
            static fn($v): bool => is_scalar($v) && $v !== '' && $v !== null
        );
        if($args) {
            $path .= "?" . http_build_query($args);
        }

        $ch = curl_init($path);
        if(!$ch) {
            throw new \Exception("Failed to init Curl");
        }
        foreach ($this->options as $k => $option) {
            curl_setopt($ch, $k, $option);
        }

        if ($body = $this->getBody()) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER,
            array_map(function ($k, $v) {
                return sprintf("%s:%s", $k, $v);
            }, array_keys($this->headers), $this->headers
            )
        );

        $response = curl_exec($ch);
        $info = curl_getinfo($ch);
        curl_close($ch);

        return new Shape([
            "info" => $info,
            "content" => $response,
            "error" => [
                "message" => curl_error($ch),
                "code" => curl_errno($ch)
            ],
        ], [
            "json" => new Shape\Mixin(function($value, $shape) {
                $content = json_decode($shape->get("content"), true);
                return new Shape(is_array($content) ? $content : []);
            })
        ]);
    }
}
