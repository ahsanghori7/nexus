<?php

    namespace App\Infrastructure\Testing\Mock;

    use Psr\Http\Message\MessageInterface;
    use Psr\Http\Message\RequestInterface;
    use Psr\Http\Message\ServerRequestInterface;
    use Psr\Http\Message\StreamInterface;
    use Psr\Http\Message\UriInterface;


    class Request implements ServerRequestInterface
    {
        protected $uri;

        protected $headers = [];

        protected $body = "";

        public function __construct(UriInterface $uri, $headers = [], $body = "")
        {
            $this->uri = $uri;
            $this->headers = $headers;
            $this->body = $body;
        }

        public function getServerParams() : array
        {
            return [];
        }

        public function getCookieParams() : array
        {
            return [];
        }

        public function withCookieParams(array $cookies) : self
        {
            return $this;
        }

        public function getQueryParams() : array
        {
            $params = [];

            if ($query = $this->getUri()->getQuery()) {
                $items = explode("&", $query);
                foreach ($items as $item) {
                    $parts = explode("=", $item);
                    if (count($parts) < 2) {
                        $parts[] = true;
                    }
                    list($k, $v) = $parts;
                    $params[$k] = $v;
                }
            }
            return $params;
        }

        public function withQueryParams(array $query) : self
        {
            return $this;
        }

        public function getUploadedFiles() : array
        {
            return [];
        }


        public function withUploadedFiles(array $uploadedFiles) : self
        {
            return $this;
        }


        public function getParsedBody() : mixed
        {
            return null;
        }

        public function withParsedBody($data) : self
        {
            return $this;
        }


        public function getAttributes() : array
        {
            return [];
        }


        public function getAttribute($name, $default = null) : mixed
        {
            return null;
        }

        public function withAttribute($name, $value) : self
        {
            return $this;
        }

        public function withoutAttribute($name) : self
        {
            return $this;
        }


        public function getRequestTarget() : string
        {
            return "";
        }

        public function withRequestTarget($requestTarget) : self
        {
            return $this;
        }

        public function getMethod() : string
        {
            return "";
        }

        public function withMethod($method) : self
        {
            return $this;
        }

        public function getUri() : UriInterface
        {
            return $this->uri;
        }

        public function withUri(UriInterface $uri, $preserveHost = false) : self
        {
            return $this;
        }

        public function getProtocolVersion() : string
        {
            return "";
        }

        public function withProtocolVersion($version) : self
        {
            return $this;
        }

        public function getHeaders() : array
        {
            return $this->headers;
        }

        public function hasHeader($name) : bool
        {
            return isset($this->headers[$name]);
        }

        public function getHeader($name) : array
        {
            return $this->headers[$name] ?? [];
        }

        public function getHeaderLine($name) : string
        {
            return implode(",", $this->getHeader($name));
        }

        public function withHeader($name, $value) : self
        {
            return $this;
        }

        public function withAddedHeader($name, $value) : self
        {
            return $this;
        }

        public function withoutHeader($name) : self
        {
            return $this;
        }

        public function getBody() : StreamInterface
        {
            return $this->body;
        }

        public function withBody(StreamInterface $body) : self
        {
            return $this;
        }
    }
