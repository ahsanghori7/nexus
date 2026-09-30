<?php


namespace App\DocCreator\RelayLoader;

use App\core\Request as RequestCore;

class Request extends RequestCore
{

    protected $relayArgs = [];

    /**
     * Request constructor.
     * @param array $config
     */
    public function __construct($config = []){
        $this->relayArgs =  $config['args'] ?? [];
        parent::__construct($config);
    }

    /**
     * @param $key
     * @param null $default
     * @return mixed|null
     */
    public function getQueryValue($key, $default = null) {
        return $this->relayArgs[$key] ?? $default;
    }
}
