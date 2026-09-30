<?php

namespace Api\Middleware\Storage;

use Core\Middleware\ServiceMiddleware;

abstract class StorageMiddleware extends ServiceMiddleware
{

    /**
     * @var string
     */
    public static string $provider = '';

    /**
     * @var array
     */
    public static array $config = [];


    /**
     * @return mixed
     */
    abstract public static function getCredentials(): mixed;


    /**
     * @return \Core\Service\ServiceAbstract
     * @throws \Exception
     */
    public static function getStorageService(): \Core\Service\ServiceAbstract
    {
        return static::getService();
    }

    /**
     * @param string $key
     * @return mixed
     */
    abstract public static function getData(string $key = ''): mixed;

    /**
     * @param string $provider
     * @return void
     */
    public static function setProvider(string $provider): void
    {
        self::$provider = $provider;
    }

    /**
     * @return string
     */
    public static function getProvider(): string
    {
        return self::$provider;
    }

    /**
     * @param array $config
     * @return void
     */
    public static function setConfig(array $config): void
    {
        static::$config += $config;
    }

    /**
     * @return array
     */
    public static function getConfig(): array
    {
        return static::$config;
    }

    /**
     * @param string $key
     * @param $default
     * @return mixed|null
     */
    public static function getConfigKey(string $key, $default = null): mixed
    {
        return static::$config[$key] ?? $default;
    }
}
