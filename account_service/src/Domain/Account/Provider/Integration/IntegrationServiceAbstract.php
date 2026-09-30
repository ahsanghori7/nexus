<?php

namespace App\Domain\Account\Provider\Integration;

abstract class IntegrationServiceAbstract
{

    const DEFAULT_SERVICE_NAME = '';

    /**
     * @var array
     */
    protected array $client_secrets_keys = [];

    /**
     * @var array
     */
    protected array $client_secrets = [];

    /**
     * @var array
     */
    protected array $provider_data = [];

    /**
     * @param array $data
     * @return void
     */
    public function setProviderData(array $data): void {
        $this->provider_data = $data;
    }

    /**
     * @return array
     */
    public function getProviderData(): array {
        return $this->provider_data;
    }

    /**
     * @return array
     */
    public function getClientSecretsKeys(): array {
        return $this->client_secrets_keys;
    }

    /**
     * @return array
     */
    public function getClientSecrets(): array {
        return $this->client_secrets;
    }

}
