<?php

namespace App\Domain\Account\Provider\Login;

use App\Domain\User\UserRepository;
use App\Domain\User\User;
use App\Domain\User\Token;

abstract class LoginServiceAbstract {

    /**
     * @var User
     */
    protected User $user;

    /**
     * @var Token
     */
    protected Token $token;

    /**
     * @var bool
     */
    protected bool $isLoggedIn = false;

    /**
     * @param int $accountId
     * @return string
     */
    public abstract function get_redirect_url(int $accountId = 0) : string;

    /**
     * @param array $data
     * @return bool
     */
    public abstract function login(array $data) : bool;

    /**
     * @param array $data
     * @return bool
     */
    public abstract function validate(array $data) : bool;

    /**
     * @param array $data
     * @return string
     */
    public abstract function getUserEmail(array $data) : string;

    /**
     * @param string $jwt
     * @return array
     */
    public function decodeJwt(string $jwt): array {
        [$headerB64, $payloadB64, $signatureB64] = explode('.', $jwt);

        $payloadJson = base64_decode(strtr($payloadB64, '-_', '+/'));
        return json_decode($payloadJson, true);
    }

    /**
     * @return User
     */
    public function getUser() : User {
        return $this->user;
    }

    /**
     * @return Token
     */
    public function getToken() : Token {
        return $this->token;
    }

    /**
     * @return bool
     */
    public function isLoggedIn() : bool {
        return $this->isLoggedIn;
    }

    /**
     * @return UserRepository
     */
    public function getUserRepository() : UserRepository {
        return new UserRepository();
    }

    public function loadUser(string $email) : User {
        $user = $this->getUserRepository()->getUser($email);
        if(!$user->isLoaded()) {
            throw new \Exception("User Not Found");
        }
        return $user;
    }

    /**
     * @param array $data
     * @param string $app
     * @return bool
     */
    public function validateAndLoginUser(array $data, string $app = "") : bool {
        if(!$this->validate($data)) {
            throw new \Exception("Failed To validate SSO Login Data");
        }

        $user  = $this->loadUser($this->getUserEmail($data));
        $token = $this->getUserRepository()->createSSOSession($user, $app);

        $this->user = $user;
        $this->token = $token;
        $this->isLoggedIn = true;

        return $this->isLoggedIn;
    }
}
