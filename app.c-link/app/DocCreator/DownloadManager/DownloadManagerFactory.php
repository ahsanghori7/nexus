<?php

namespace App\DocCreator\DownloadManager;

class DownloadManagerFactory
{
    /**
     * Registry of provider key -> class name.
     * Add new providers here to extend the system without touching application code.
     */
    private static array $providers = [
        'asite' => AsiteProvider::class,
    ];

    /**
     * Resolve and instantiate a DownloadManager provider by its reference key.
     *
     * @param  string $provider  The value of the shortcode's "reference" key, e.g. "asite"
     * @return DownloadManagerProviderInterface
     * @throws \InvalidArgumentException When the provider is not registered
     */
    public static function make(string $provider): DownloadManagerProviderInterface
    {
        $key   = strtolower($provider);
        $class = self::$providers[$key] ?? null;

        if ($class === null) {
            throw new \InvalidArgumentException(
                "Unknown DownloadManager provider: '{$provider}'. " .
                "Registered providers: " . implode(', ', array_keys(self::$providers))
            );
        }

        return new $class();
    }

    /**
     * Check whether a given reference key maps to a registered provider.
     *
     * @param  string $provider
     * @return bool
     */
    public static function supports(string $provider): bool
    {
        return isset(self::$providers[strtolower($provider)]);
    }
}
