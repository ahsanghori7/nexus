<?php
namespace App\core;

use App\core\{Request, Response, Helper, Config};

class App
{

  protected static $instance;
  public $request = null;
  public $response = null;
  public $helper = null;
  private $aliases = null;
  private $controller = null;
  private $controller_name = null;
  private $method = null;
  private $args = array();
  private $defaultController = 'HomeController';
  private $defaultMethod = 'index';

  /**
   * App constructor.
   */
  public function __construct ()
  {

    $this->registerControllerAliases();
    $this->request = new Request();
    $this->response = new Response();
    static::setInstance($this);
    $this->registerHelpers();
  }

  protected function registerControllerAliases ()
  {
    $this->aliases = [

    ];
  }

  /**
   *
   */
  private function registerHelpers ()
  {
    $this->helper = new Helper();
    $this->helper->loadHelpers(Config::get('helpers'));
  }

  /**
   * @return mixed
   */
  public static function getInstance ()
  {
    if ( is_null(static::$instance) ) {
      static::$instance = new self;
    }

    return static::$instance;
  }

  /**
   * @param App|null $application
   * @return App|null
   */
  public static function setInstance (?App $application)
  {
    return static::$instance = $application;
  }

  /**
   * @return \App\core\Response
   * @throws \ReflectionException
   */
  public function run ()
  {

    $this->splitUrl();
    $redirect_url = ($this->controller  === 'HomeController') ? SITE_URL : DASHBOARD_URL;

    if ( !self::isControllerValid($this->controller) ) {
        $error_code = '404';
        if($this->method !== $error_code){
            redirect($redirect_url. '/' . $error_code);
        }
        $this->method = 'error_page';
    }

    if ( !empty($this->controller) ) {

      if ( !self::isMethodValid($this->controller, $this->method) ) {
        $error_code = '404';
        if($this->method !== $error_code){
            redirect($redirect_url. '/' . $error_code);
        }
        $this->method = 'error_page';
      }

      if ( !empty($this->method) ) {
        if ( !self::areArgsValid($this->controller, $this->method, $this->args) ) {
          $error_code = '403';
          if($this->method !== $error_code){
              redirect($redirect_url. '/' . $error_code);
          }
          $this->method = 'error_page';
        }
      } else {
        $this->method = $this->defaultMethod;
      }

      return $this->invoke($this->controller, $this->method, $this->args);

    } else {

      $this->method = $this->defaultMethod;
      return $this->invoke($this->defaultController, $this->method, $this->args);
    }

  }

  public function splitUrl ()
  {

    $url = $this->request->query("url");

    if ( !empty($url) ) {

      $url = explode('/', filter_var(trim($url, '/'), FILTER_SANITIZE_URL));

      if ( !empty($url[0]) ) {

        $url[0] = str_replace("-", "_", $url[0]);

        if ( isset($this->aliases[$url[0]]) ) {
          $this->controller_name = $url[0];
          $url[0] = $this->aliases[$url[0]];
        } else {
          $this->controller_name = $url[0];
        }
      }

      $this->controller = !empty($url[0]) ? ucwords($url[0],"_") . 'Controller' : null;
      $this->method = !empty($url[1]) ? $url[1] : null;

      $this->controller_name = str_replace("_", "-", $this->controller_name);
      $this->controller = str_replace("_", "", $this->controller);

      if ( !self::isControllerValid($this->controller) ) {
        $this->controller = $this->defaultController;
        $this->method = $url[0];
        $this->controller_name = $this->defaultController;
        unset($url[0]);
      } else {
        unset($url[0], $url[1]);
      }

      $this->args = !empty($url) ? array_values($url) : [];
    }

    //I just want to match - for a action
    $this->method = str_replace("-", "_", (string)$this->method);

  }

  /**
   * @param $controller
   * @return bool
   */
  private static function isControllerValid ($controller)
  {

    if ( !empty($controller) ) {
      if ( strtolower($controller) === "errorscontroller" ||
        !file_exists(APP . 'controllers/' . $controller . '.php') ) {
        return false;
      } else {
        return true;
      }

    } else {
      return true;
    }

  }

  /**
   * @param $controller
   * @param $method
   * @return bool
   */
  private static function isMethodValid ($controller, $method)
  {

    if ( !empty($method) ) {

      if ( !preg_match('/\A[a-z_-]+\z/i', $method) ||
        !method_exists('App\\controllers\\' . $controller, $method) ||
        strtolower($method) === "index" ) {
        return false;
      } else {
        return true;
      }

    } else {
      return true;
    }

  }

  /**
   * @param $controller
   * @param $method
   * @param $args
   * @return bool
   * @throws \ReflectionException
   */
  private static function areArgsValid ($controller, $method, $args)
  {
    $reflection = new \ReflectionMethod ('App\\controllers\\' . $controller, $method);
    $count  = 0;
    foreach ($reflection->getParameters() as $param) {
        if(!$param->isOptional()) {
            $count ++;
        }
    }

    return count($args) >= $count;
  }

  /**
   * @param $controller
   * @param string $method
   * @param array $args
   * @return \App\core\Response
   */
  private function invoke ($controller, $method = "index", $args = [])
  {

    $this->request->addParams(['controller' => $controller, 'action' => $method, 'args' => $args, 'controller_name' => $this->controller_name]);

    $controller = 'App\\controllers\\' . $controller;

    $this->controller = new $controller($this->request, $this->response);

    $result = $this->controller->startupProcess();

    if ( $result instanceof Response ) {
      return $result->send();
    }

    if ( !empty($args) ) {
      $response = call_user_func_array([$this->controller, $method], $args);
    } else {
      $response = $this->controller->{$method}();
    }

    if ( $response instanceof Response ) {
      return $response->send();
    }

    return $this->response->send();
  }
}
