<?php


    namespace App\Api\Client;


    use Mockery\Exception;

    class Request
    {
        /**
         * @var string
         */
        protected $url;

        /**
         * @var string
         */
        protected $type;

        /**
         * @var string
         */
        protected $types = [
            "GET",
            "POST",
            "PATCH",
            "PUT",
            "DELETE"
        ];

        /**
         * @var array
         */
        protected $data = [];

        /**
         * @var array
         */
        protected $params = [];

        /**
         * @var array
         */
        protected $headers = [
            "Content-Type" => 'application/json'
        ];

        protected $options = [
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_COOKIESESSION => 1
        ];

        protected $response;

        protected $info;

        protected $error = [];

        /**
         * Request constructor.
         * @param string $url
         */
        public function __construct(string $url, $type = "GET")
        {
            $this->url = $url;
            $this->setType($type);
        }

        /**
         * @param string $type
         * @return $this
         * @throws \Exception
         */
        public function setType(string $type)
        {
            $type = strtoupper($type);
            if (!in_array($type, $this->types)) {
                throw new \Exception("Invalid request type $type");
            }

            if ($type === "POST") {
                $this->options[CURLOPT_POST] = 1;
            } elseif ($type !== "GET") {
                $this->options[CURLOPT_CUSTOMREQUEST] = $type;
            }

            $this->type = $type;
            return $this;
        }

        /**
         * @param array $data
         * @return $this
         */
        public function setData(array $data)
        {
            $this->data = $data;
            return $this;
        }

        /**
         * @param array $headers
         * @return $this
         */
        public function setHeaders(array $headers)
        {
            foreach ($headers as $k => $header) {
                $this->setHeader($k, $header);
            }
            return $this;
        }

        /**
         * @param string $k
         * @param string $v
         * @return $this
         */
        public function setHeader(string $k, string $v)
        {
            $this->headers[$k] = $v;
            return $this;
        }

        /**
         * @param array $params
         * @return $this
         */
        public function setParams(array $params)
        {
            $this->params = $params;
            return $this;
        }

        public function isWrite()
        {
            return $this->type !== "GET";
        }

        /**
         * @param array $options
         * @return $this
         */
        public function setOptions(array $options)
        {
            foreach ($options as $k => $option) {
                $this->options[$k] = $option;
            }
            return $this;
        }

        /**
         * @param $key
         * @param $val
         * @return $this
         */
        public function setOption($key, $val)
        {
            $this->options[$key] = $val;
            return $this;
        }

        /**
         * @return false|float|int|mixed|\Services_JSON_Error|string|void
         */
        public function getBody()
        {
            $type = $this->headers["Content-Type"];
            $data = $this->data;

            if ($type === "application/json") {
                return json_encode($data);
            } elseif ($type === "application/x-www-form-urlencoded") {
                return http_build_query($data);
            } elseif ($type == 'multipart/form-data'){
                return $data;
            }

            return "";
        }

        /**
         * @return string
         */
        public function getRequestUrl()
        {
            $url = $this->url;
            if ($this->params) {
                $url = $url . "?" . http_build_query($this->params);
            }
            return $url;
        }

        /**
         * @return $this
         */
        public function call()
        {
            $ch = curl_init($this->getRequestUrl());
            foreach ($this->options as $k => $option) {
                curl_setopt($ch, $k, $option);
            }


            if ($this->isWrite()) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $this->getBody());
            }

            curl_setopt($ch, CURLOPT_HTTPHEADER,
                array_map(function ($k, $v) {
                    return sprintf("%s:%s", $k, $v);
                }, array_keys($this->headers), $this->headers
                )
            );
            curl_setopt($ch, CURLOPT_TIMEOUT, 0);
            $response = curl_exec($ch);
            $this->info = curl_getinfo($ch);
            if ($response === false) {
                $this->error = [
                    "message" => curl_error($ch),
                    "code" => curl_errno($ch)
                ];
            }

            $this->response = $response;

            return $this;
        }

        /**
         * @return bool
         */
        public function hasError()
        {
            return !empty($this->error);
        }

        /**
         * @return array
         */
        public function getError()
        {
            return $this->error;
        }

        /**
         * @return mixed
         */
        public function getInfo($k=null, $def=null)
        {
            if($k) {
                return $this->info[$k] ?? $def;
            }

            return $this->info;
        }

        /**
         * @param false $cb
         * @return mixed
         */
        public function getResponse($cb = false)
        {
            if ($this->response) {
                if (!is_callable($cb)) {
                    return $this->response;
                } else {
                    return $cb($this->response);
                }
            }
        }

        /**
         * @param bool $asArray
         * @return mixed
         */
        public function json($asArray = true)
        {
            return $this->getResponse(function (string $data) use ($asArray) {
                return json_decode($data, $asArray);
            });
        }

        /**
         * @return int
         */
        public function iDResponse() : int {
            $res = $this->json();
            $id = 0;
            if($res) {
                $data = $res["data"] ?? $res;
                $id = $data["id"] ?? 0;
            }
            return (int) $id;
        }

        /**
         * @return int
         */
        public function getStatus() : int {
            return $this->info["http_code"] ?? 0;
        }

        /**
         * @param int $code
         * @return bool
         */
        public function hasStatus(int $code) : bool {
            if($status = $this->getStatus()) {
                return ($code === $status);
            }
            return false;
        }

        /**
         * If status is in 200, assume success
         * @return bool
         */
        public function isSuccess() : bool {
            $status = $this->getStatus();
            return ($status >= 200 && $status <= 299);
        }
    }
