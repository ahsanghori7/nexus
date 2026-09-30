<?php
namespace App\core;

use App\core\Response;
use App\core\Session;

class Redirector{

    public function __construct(){}

  /**
   * @param $location
   * @param string $query
   * @return \App\core\Response
   */
  public function to($location, $query = ""): Response
    {

        if(!empty($query)){
            $query = '?' . http_build_query((array)$query, "", '&');
        }

        $response = new Response('', 302, ["Location" => $location . $query]);

        return $response;
    }

  /**
   * @param $location
   * @param string $query
   */
  public function redirects($location, $query = ""): void
    {
        $response = $this->to($location, $query);
        $response->redirect();
    }

  /**
   * @param string $location
   * @param string $query
   * @return \App\core\Response
   */
  public function root($location = "", $query = ""): Response
    {
        return $this->to(PUBLIC_ROOT . $location, $query);
    }

  /**
   * @return \App\core\Response
   */
  public function dashboard(): Response
    {
        return $this->to(PUBLIC_ROOT . "User");
    }

  /**
   * @param null $redirect_url
   * @return \App\core\Response|null
   */
  public function login($redirect_url = null): ?Response
    {
        if(!empty($redirect_url)){
            return $this->to(PUBLIC_ROOT . config('pages.login')."?redirect=" . urlencode($redirect_url));
        }else{
            return $this->to(PUBLIC_ROOT . config('pages.login'));
        }
    }

  public function logout()
    {
        Session::remove();
        $this->redirects(PUBLIC_ROOT . config('pages.login'));
    }
}
