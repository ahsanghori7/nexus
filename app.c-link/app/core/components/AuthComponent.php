<?php
namespace App\core\components;

use App\core\Config;
use App\Utility\Utility;
use App\core\Session;
use App\core\Component;


class AuthComponent extends Component{

    protected $config = [
        'authenticate' => [],
        'authorize' => []
    ];

    public function startup(){

         // authenticate
         if(!empty($this->config["authenticate"])){
             if(!$this->authenticate()){
                 return $this->unauthenticated();
             }
         }

         // authorize
         if(!empty($this->config["authorize"])){
             if(!$this->authorize()){
                 return $this->unauthorized();
             }
         }
     }

    public function unauthenticated(){
        if($this->request->isAjax()) {
            error(403, 'You are not authenticated');
        }else{
            $redirect = $this->controller->request->isGet() ? $this->controller->request->uri(): "";
            return $this->controller->redirector->login($redirect);
        }
    }

    public function unauthorized(){
        error(403, 'You are not authorized to do this action.');
    }

    public function authenticate(){
         return $this->check($this->config["authenticate"], "authenticate");
    }

    public function authorize(){
        return $this->check($this->config["authorize"], "authorize");
    }

    private function check($config, $type){

         if (empty($config)) {
             throw new \Exception($type . ' methods arent initialized yet in config');
         }

         $auth = Utility::normalize($config);

         foreach($auth as $method => $config){

             $method = "_" . ucfirst($method) . ucfirst($type);

             if (!method_exists(__CLASS__, $method)) {
                 throw new \Exception('Auth Method doesnt exists: ' . $method);
             }

             if($this->{$method}($config) === false){
                 return false;
             }
         }

        return true;
    }

  public function isLoggedIn ()
  {
    if ( app()->Cookie->isValid() ) {
      return true;
    }

    return false;
  }

  private function _ControllerAuthorize ()
  {
    if ( !method_exists($this->controller, 'isAuthorized') ) {
      throw new \Exception(sprintf('%s does not implement an isAuthorized() method.', get_class($this->controller)));
    }
    return (bool)$this->controller->isAuthorized();
  }

  private function _UserAuthenticate ()
  {

    if ( !$this->isLoggedIn() ) {
      return false;
    }

    if ( !isset($_SESSION[Config::get('csrf.token_name')]) ) {
      Session::generateCsrfToken();
    }

    return true;
  }
}
