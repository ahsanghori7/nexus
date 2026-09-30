<?php


    namespace App\Infrastructure\Testing\Mock;

    use Psr\Http\Message\UriInterface;

    class Uri implements UriInterface
    {

        protected $path = "";

        protected $query = "";

        protected $host;

        protected $port;

        public function __construct($path = "", $query = "", $host = "test.com", $port = 80)
        {
            $this->path = $path;
            $this->query = $query;
            $this->host = $host;
            $this->port = $port;
        }

        public function getScheme() : string
        {
            return "";
        }

        public function getAuthority() : string
        {
            return "";
        }

        public function getUserInfo() : string
        {
            return "";
        }

        public function getHost() : string
        {
            return $this->host;
        }

        public function getPort() : int
        {
            return $this->port;
        }

        public function getPath() : string
        {
            return $this->path;
        }

        public function getQuery() : string
        {
            return $this->query;
        }

        public function getFragment() : string
        {
            return "";
        }

        public function withScheme($scheme) : self
        {
            return $this;
        }

        public function withUserInfo($user, $password = null) : self
        {
            return $this;
        }

        public function withHost($host) : self
        {
            return $this;
        }

        public function withPort($port) : self
        {
            return $this;
        }

        public function withPath($path) : self
        {
            $this->path = $path;
            return $this;
        }

        public function withQuery($query) : self
        {
            $this->query = $query;
            return $this;
        }

        public function withFragment($fragment) : self
        {
            return $this;
        }

        public function __toString() : string
        {
            return "";
        }
    }
