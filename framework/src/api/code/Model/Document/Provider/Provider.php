<?php

namespace Api\Model\Document\Provider;

use Core\Middleware\ServiceMiddleware;
use Api\Middleware\Storage\SSMMiddleware as StorageSSMMiddleware;

abstract class Provider extends ServiceMiddleware
{

    public CONST PROVIDER_NAME   = '';
    public CONST DEFAULT_STORAGE = StorageSSMMiddleware::class;

    /**
     * @var string
     */
    protected static string $apiUrl = '';

    /**
     * @var array|\class-string[]
     */
    protected static array $providers = [
        'asite' => Asite::class
    ];

    abstract public function authenticate();

    /**
     * @param string $path
     * @return string
     */
    public function getApiUrl(string $path = ''): string
    {
        return static::$apiUrl . $path;
    }

    /**
     * @param string $providerName
     * @param array $config
     * @return Provider|null
     */
    public static function getProvider(string $providerName, array $config = []): ?Provider
    {
        if (array_key_exists(strtolower($providerName), self::$providers)) {
            $providerClassName = self::$providers[strtolower($providerName)];
            $providerClass = (new $providerClassName());
            $providerClass->setConfig($config);
            return $providerClass;
        }

        return null;
    }

    /**
     * @return string
     */
    public function getStorageService()
    {
        $storage = $this->getCredentialStorage();
        $storage::setProvider($this->getProviderName());
        return $storage::getStorageService();
    }

    /**
     * @param array $config
     * @return void
     */
    public function setConfig(array $config = []): void
    {
        $storage = $this->getCredentialStorage();
        $storage::setConfig($config);
    }

    /**
     * @return mixed
     */
    public function getCredentials(): mixed
    {
        $storage = $this->getCredentialStorage();
        $storage::setProvider($this->getProviderName());
        return $storage::getCredentials();
    }

    /**
     * @return string
     */
    public function getCredentialStorage(): string
    {
        return self::DEFAULT_STORAGE;
    }

    /**
     * @return string
     */
    public function getProviderName(): string
    {
        return static::PROVIDER_NAME;
    }
}
