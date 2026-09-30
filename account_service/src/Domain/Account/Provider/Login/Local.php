<?php

namespace App\Domain\Account\Provider\Login;

use App\Infrastructure\Environment;

class Local extends LoginServiceAbstract{

    /**
     * @param array $meta
     */
    public function __construct(array $meta = []) {
        // Local provider doesn't use meta data, but accepts for compatibility
    }


    /**
     * Return the default redirect url for local provider
     * @param int $accountId
     * @return string
     */
    public function get_redirect_url(int $accountId = 0) : string {
        return Environment::getValue('DEFAULT_REDIRECT_LOGIN_URL', "");
    }

    /**
     * @throws \Exception
     */
    public function login(array $data) : bool {
        throw new \Exception("Local Login via password is not implemented via sso routes");
    }

    /**
     * @param array $data
     * @return string
     * @throws \Exception
     */
    public function getUserEmail(array $data) : string {
        throw new \Exception("Local Login via password is not implemented via sso routes");
    }

    /**
     * @param array $data
     * @return bool
     * @throws \Exception
     */
    public function validate(array $data) : bool {
        throw new \Exception("Local Login via password is not implemented via sso routes");
    }
}
