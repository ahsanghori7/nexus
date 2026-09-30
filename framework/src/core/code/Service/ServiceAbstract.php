<?php

namespace Core\Service;

use Core\Data\Shape;
use Core\Service\Auth\AuthInterface;
use Core\Layer\OutgoingInterface;


abstract class ServiceAbstract extends Shape {

    /**
     * @var String
     */
    const CONTENT_TYPE = "";

    /**
     * @var AuthInterface
     */
    protected AuthInterface $auth;

    /**
     * @var bool
     */
    protected bool $enabled = true;

    /**
     * @param AuthInterface $interface
     * @return ServiceAbstract
     */
    public function setAuth(AuthInterface $interface) : ServiceAbstract {
        $this->auth = $interface;
        return $this;
    }

    /**
     * @param bool $enabled
     * @return $this
     */
    public function setEnabled(bool $enabled) : ServiceAbstract {
        $this->enabled = $enabled;
        return $this;
    }

    /**
     * @return bool
     */
    public function isEnabled() : bool
    {
        return $this->enabled;
    }

    /**
     * @param string $path
     * @return OutgoingInterface
     */
    public abstract function getNewRequest(string $path) : OutgoingInterface;

    /**
     * @param string $suffix
     * @return string
     */
    public abstract function getPath(string $suffix = "") : string;

    /**
     * @param string $suffix
     * @param array<string, mixed> $params
     * @param array<string, mixed> $headers
     * @param array<string, mixed> $data
     * @return OutgoingInterface
     * @throws \Exception
     */
    public function makeRequest(string $suffix, array $params = [], array $data = [], array $headers = []) : OutgoingInterface {

        $request = $this->getNewRequest($this->getPath($suffix));
        if($params) {
            $request->setArgs(new Shape($params));
        }
        if($data) {
            $request->setData(new Shape($data));
        }

        $headers = array_merge(["Content-Type" => $this::CONTENT_TYPE], $headers);
        $request->setHeaders($headers);
        $this->applyAuth($request);
        return $request;
    }

    /**
     * @param OutgoingInterface $request
     * @return OutgoingInterface
     */
    public function applyAuth(OutgoingInterface $request) : OutgoingInterface {
        if(isset($this->auth)) {
            $this->auth->apply($request);
        }
        return $request;
    }
    /**
     * @param string $path
     * @param array<string, mixed> $params
     * @return Shape
     */
    public abstract function fetch(string $path, array $params=[]) : Shape;

    /**
     * @param string $path
     * @param Shape $shape
     * @return Shape
     */
    public abstract function write(string $path, Shape $shape) : Shape;

    /**
     * @param string $path
     * @param Shape $shape
     * @return Shape
     */
    public abstract function update(string $path, Shape $shape) : Shape;

    /**
     * @param string $path
     * @param array<string, string> $params
     * @return Shape
     */
    public abstract function delete(string $path, array $params=[]) : Shape;

}
