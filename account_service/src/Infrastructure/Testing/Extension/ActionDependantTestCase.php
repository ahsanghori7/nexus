<?php

    namespace App\Infrastructure\Testing\Extension;

    use App\Infrastructure\Testing\Mock\Request;
    use App\Infrastructure\Testing\Mock\Uri;
    use App\Infrastructure\Testing\Mock\Model;
    use PHPUnit\Framework\TestCase;

    abstract class ActionDependantTestCase extends TestCase
    {
        public function getRequest($uri=null, $headers=[], $body="")
        {
            if(!$uri) {
                $uri = $this->getUri();
            }

           return new Request($uri,$headers,$body);
        }

        public function getModel($name, $records)
        {
            if(is_int($records)) {
                $records  = array_pad([], $records, 0);
            }
            return new Model($name, $records);
        }

        public function mockRequest(array $url = [],  array $request = []) {
            $uri = call_user_func_array([$this, "getUri"], $url);
            array_unshift($request, $uri);
            return call_user_func_array([$this, "getRequest"], $request);
        }

        public function getUri($path="", $query="", $host="test.com", $port=80) {
            return new Uri($path, $query, $host, $port);
        }
    }
