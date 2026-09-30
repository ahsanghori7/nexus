<?php

namespace App\Domain\Account\Provider;

use App\Domain\AbstractModel;
use App\Domain\Account\Provider\Login\Local;
use App\Domain\Account\Provider\Login\Entra;
use App\Domain\Account\Provider\Integration\Asite;
use App\Domain\Account\Provider\Login\Google;

/**
 * Class Provider
 * @package App\Domain\Account\Provider
 */
class Provider extends AbstractModel
{

    const NAME = "provider";
    /**
     * @var array
     */
    protected $columns = [
        'id' => [
            'type' => 'int'
        ],
        'label' => [
            'type' => 'string',
            'required' => true
        ],
        'type_id' => [
            'type' => 'int',
            'required' => true
        ],
        'created_at' => [
            'type' => 'datetime'
        ]
    ];

    /**
     * @var array
     */
    protected array $providers = [
        "login" => [
            "default" => Local::class,
            "local"   => Local::class,
            "entra"   => Entra::class,
            "google"   => Google::class,
        ],
        "integration" => [
            "default" => null,
            "asite"   => Asite::class,
        ]
    ];


    /**
     * @param string $provider
     * @param array $meta
     * @return mixed|void
     */
    public function getProviderDefaultService(string $provider, array $meta = [])
    {
        if(isset($this->providers[$provider]['default'])){
            return new ($this->providers[$provider]['default'])($meta);
        }
    }

    /**
     * @param string $provider
     * @param array $meta
     * @return mixed
     */
    public function getProviderService(string $provider, array $meta = []): mixed
    {
        if($this->isLoaded()) {
            if(isset($this->providers[$provider][$this->getData('label')])) {
                $cls = $this->providers[$provider][$this->getData('label')];
                return new $cls($meta);
            }
        }
        return $this->getProviderDefaultService($provider);
    }
}
