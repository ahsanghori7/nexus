<?php

namespace Core\Service\Testing;

use Core\Data\Shape;
use Core\Service\RestService;

class MockRestService extends RestService
{
    /**
     * @var array
     */
    protected array $mockResponses = [];

    /**
     * @param string $path
     * @param array<string, string> $params
     * @return Shape
     */
    public function fetch(string $path, array $params=[]) : Shape {
        return $this->getMockRequest($path);
    }

    /**
     * @param string $path
     * @param array<string, string> $params
     * @return Shape
     */
    public function delete(string $path, array $params=[]) : Shape {
        return $this->getMockRequest($path, "DELETE");
    }

    /**
     * @param string $path
     * @param Shape $shape
     * @return Shape
     * @throws \Exception
     */
    public function write(string $path, Shape $shape) : Shape {
        return $this->getMockRequest($path, "POST");
    }

    /**
     * @param string $path
     * @param Shape $shape
     * @return Shape
     * @throws \Exception
     */
    public function update(string $path, Shape $shape) : Shape {
        return $this->getMockRequest($path, "UPDATE");
    }

    /**
     * @param string $path
     * @param Shape $res
     * @return $this
     */
    public function setRequest(string $path, Shape $res, string $type = "GET") : MockRestService {
        $this->mockResponses[$type][$path] = $res;
        return $this;
    }

    /**
     * @param string $path
     * @param Shape $res
     * @return $this
     */
    public function setRequests(array $paths) : MockRestService {
        foreach($paths as $data) {
            $this->setRequest(
                $data["path"] ?? null,
                $data["res"] ?? null,
                $data["method"] ?? "GET"
            );
        }
        return $this;
    }

    /**
     * @param string $file
     * @param string $path
     * @param string $suffix
     * @param string $dir
     * @return $this
     * @throws \Exception
     */
    public function loadRequestFromResultMock(
        string $file, string $path, string $suffix="Rest/Results", string $dir = __DIR__, callable $filter = null
    ) : MockRestService {
        $filepath = $dir . DIRECTORY_SEPARATOR . $suffix . DIRECTORY_SEPARATOR . $file . ".json";
        if(file_exists($filepath)) {
            $data = new Shape(json_decode(file_get_contents($filepath), true));
            $this->setRequest($path,
                ($filter) ? $filter($data) : $data
            );
        }
        else {
            throw new \Exception("Invalid mock results set path $filepath");
        }
        return $this;
    }

    /**
     * @param string $path
     * @param string $type
     * @return Shape
     * @throws \Exception
     */
    public function getMockRequest(string $path, string $type = "GET") : Shape {
        if(isset($this->mockResponses[$type][$path])) {
            return $this->mockResponses[$type][$path];
        }
        throw new \Exception("No Mock response set for $type $path");
    }
}
