<?php

namespace App\controllers;

use App\core\Controller;
use App\core\Config;

class ErrorsController extends Controller
{

  public function initialize()
  {
  }

  /**
   * @param $error_response
   * @param int $errorPage
   */
  public function display($error_response, ?int $errorPage = null)
  {

    if ($error_response && !$errorPage) {
      $errorPage = 500;
    }

    /*
         * If we are in production we dont need to show any error message at all
         * regardless of what the debug value is set to
         */
    if (Config::get('environment') !== 'development') {
      if (file_exists($page = Config::get('path.views') . "errors/" . $errorPage . '.php')) {
        include $page;
      }
      die();
    }

    if (app()->request->isAjax()) {
      echo json_encode(array("error" => true));
    } else {
      print_r('<pre>' . $error_response . '</pre>');
      die;
    }
  }

  public function error($code, $error_response = null, $error_data = null)
  {

    //clear out any html output that was rendered before the error
    $this->response->clearBuffer();

    if (function_exists('config')) {
      if (config('debug.debug')) {
        $_SESSION['function_name'] = "Error Code: " . $code;
        if ($error_data) {
          prd($error_response, $error_data);
        } else {
          prd($error_response);
        }
      }
    }

    $this->display($error_response, $code);
  }

  public function NotFound($error_response = null)
  {
    $this->display($error_response, 400);
  }

  public function Unauthenticated($error_response = null)
  {
    $this->display($error_response, 401);
  }

  public function Unauthorized($error_response = null)
  {
    $this->display($error_response, 403);
  }

  public function BadRequest($error_response = null)
  {
    $this->display($error_response, 400);
  }

  public function System($error_response = null)
  {
    $this->display($error_response, 500);
  }
}
