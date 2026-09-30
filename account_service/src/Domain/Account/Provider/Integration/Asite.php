<?php

namespace App\Domain\Account\Provider\Integration;

class Asite extends IntegrationServiceAbstract
{

    /**
     * @var array
     */
    protected array $client_secrets_keys = [
        "email",
        "password"
    ];

    /**
     * @var array
     */
    protected array $client_secrets = [];

    /**
     * Asite constructor.
     */
    public function __construct()
    {

    }
}
