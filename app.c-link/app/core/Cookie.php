<?php

namespace App\core;

use App\Api\Account;
use App\Models\User;

class Cookie
{

  /**
   * @var string
   */
  protected $cookie_domain;

  public function __construct ()
  {
    /*
     * Set the cookie domain
     */
    $this->cookie_domain = config('cookie.domain');
  }

  /**
   * @param string $token
   * @param int $time
   */
  public function setToken(string $token, int $time): void
  {
    $_COOKIE[$this->getCookieNameByEnvironment('token')] = $token;
    setcookie($this->getCookieNameByEnvironment('token'), $token, $time, "/", config('cookie.domain'));
  }

  /**
   * @param string $cookie
   * @return mixed|string
   */
  public function getCookie(string $cookie)
  {
      return $_COOKIE[$this->getCookieNameByEnvironment($cookie)] ?? null;
  }

  /**
   * @param string $cookie
   * @return string
   */
  public function getCookieNameByEnvironment(string $cookie)
  {
      $environment = config("environment");
      if($environment){
          $cookie .= "_" . $environment;
      }
      return $cookie;
  }

  /**
   * @return bool
   * @throws \App\Api\Exception
   */
  public function allowGhostMode(): bool
  {
    return User::isAdministrator();
  }

  /**
   * Everytime we check for validation we need to increase
   * the expiration time by an increment of the expires time period
   * @param string $cookie_name
   * @param string $cookie_value
   * @param string $expiration_date
   */
  public function renew(string $cookie_name, string $cookie_value, string $expiration_date): void
  {
    $seconds = strtotime($expiration_date) - strtotime(date("Y-m-d H:i:s"));
    setcookie($cookie_name, $cookie_value, time() + $seconds, '/', $this->cookie_domain);
  }

  /**
   * We check that we store to verify the session on account service
   * @return bool
   */
  public function isValid (): bool
  {
      /*
       * verify token on account service
       */
      $session = $this->getUserSession();
      if (!$session || empty($session['user']) ) {
        /*
         * if the user is deleted than the user key will be empty
         * if the session token is expired or is invalid in account service
         * when the session token is valid as well
         */
        $this->removeSessionTokens();
        return false;
      }

      /*
       * if we arrive here means that every check was successfully passed
       * Reset the cookie expiration time
       * Return true
       */

      $result = Account::get('user/renew_session/' . $this->getCookie('token'));
      if(isset($result['token'])){
        $_COOKIE[$this->getCookieNameByEnvironment('token')] = $result['token'];
        $this->renew($this->getCookieNameByEnvironment('token'), $result['token'], $result['expires']);
      }
      return true;

  }

  /**
   * @return array|bool|mixed|object|string
   */
  public function getUserSession()
  {
    $token = $this->getCookie('token');
    if(!$token){
      return false;
    }
    try{
      $result = Account::get('user/session/' . $this->getCookie('token'));
    }catch(\Exception $e){
      return false;
    }

    return $result;
  }

    /**
     * TODO: We can potentially remove this method need to investigate if front end requires it for anything
     * @param int $user_id
     * @param int $time
     */
    public function setUserId(int $user_id, int $time): void
    {
        $_COOKIE['user_id'] = (string)$user_id;
        setcookie('user_id', (string)$user_id, $time, "/", config('cookie.domain'));
    }

  /**
   * Remove the token from account service
   */
  public function removeSessionTokens(): void
  {
    /*
     * session account service token
     */
    $this->remove($this->getCookieNameByEnvironment('token'));

    /*
    * remove the ghost cookie
    */
    $this->remove($this->getCookieNameByEnvironment('ghost'));

    /*
    * remove the user id cookie
    */
    $this->remove('user_id');
  }

  /**
   * @param string $cookie
   */
  public function remove (string $cookie): void
  {
    setcookie($cookie, "", time() - (3600 * 3650), '/', $this->cookie_domain);
  }
}
