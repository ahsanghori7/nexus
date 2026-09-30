<?php

namespace App\core;

use App\Utility\Utility;
use App\controllers\ErrorsController;

class Controller
{

    public $view;
    public $request;
    public $response;
    public $redirector;
    public $components = [
        'Auth' => [
            'authenticate' => ['User'],
            'authorize'    => ['Controller']
        ],
        'Security'
    ];
    public static $instance;
    public $last_component = null;

    protected $titles = [];
    protected $Auth;
    protected $Security;
    protected $Cookie;
    protected $Request;
    protected $email;

    public function __construct(?Request $request = null, ?Response $response = null)
    {

        $this->request      =  $request  !== null ? $request  : new Request();
        $this->response     =  $response !== null ? $response : new Response();
        $this->view         =  new View($this);
        $this->redirector   =  new Redirector();

        self::$instance = $this;
    }

    public static function getInstance()
    {
        if (is_null(static::$instance)) {
            static::$instance = new self(new Request(), new Response());
        }

        return static::$instance;
    }

    public function startupProcess()
    {

        $this->initialize();
        $this->beforeAction();

        $result = $this->triggerComponents();

        if ($result instanceof Response) {
            return $result;
        }
    }

    public function removeComponent(string $component)
    {
        if (isset($this->components[$component])) {
            unset($this->components[$component]);
        } else {
            foreach ($this->components as $component_key => $component_name):
                if ($component_name == $component) {
                    unset($this->components[$component_key]);
                }
            endforeach;
        }
    }

    public function group(array $pages)
    {
        if (!$this->last_component) {
            return;
        }

        if (!in_array($this->request->params['action'], $pages)) {
            unset($this->components[$this->last_component]);
            unset($this->last_component);
        }

        return $this;
    }

    public function addComponent(string $key, $value)
    {
        //existing components
        $components = Utility::normalize($this->components);

        if (!$key) {
            error(500, 'You need to supply a key for a component');
        }

        $this->components[$key] = $value;
        $this->last_component = $key;

        return $this;
    }

    public function initialize()
    {

        $this->loadComponents();
    }

    public function loadComponents()
    {

        if (!empty($this->components)) {

            $components = Utility::normalize($this->components);

            foreach ($components as $component => $config) {

                $class = 'App\\core\\components\\' . $component . "Component";

                if (class_exists($class)) {
                    $this->{$component} = empty($config) ? new $class($this) : new $class($this, $config);
                }
            }
        }
    }

    private function triggerComponents()
    {

        $components = Utility::normalize($this->components);

        $result = null;
        foreach ($components as $component_key => $component_value) {
            if ($component_key === "Auth") {
                $authenticate = $this->Auth->config("authenticate");
                if (!empty($authenticate)) {
                    if (!$this->Auth->authenticate()) {
                        $result = $this->Auth->unauthenticated();
                    }
                }
                // delay checking authorize till after the loop
                $authorize = $this->Auth->config("authorize");
            } else {

                if (is_array($component_value)) {
                    foreach ($component_value as $component_method):
                        if (method_exists($this->$component_key, $component_method)) {
                            $this->{$component_key}->$component_method();
                        }
                    endforeach;
                }

                $result = $this->{$component_key}->startup();
            }

            if ($result instanceof Response) {
                return $result;
            }
        }

        // authorize
        if (!empty($authorize)) {
            if (!$this->Auth->authorize()) {
                $result = $this->Auth->unauthorized();
            }
        }

        if ($result instanceof Response) {
            return $result;
        }

        return $result;
    }

    public function error($code, $error_response = null)
    {

        $errors = [
            404 => "notfound",
            401 => "unauthenticated",
            403 => "unauthorized",
            400 => "badrequest",
            500 => "system"
        ];

        if (!isset($errors[$code])) {
            $code = 500;
        }

        $action = isset($errors[$code]) ? $errors[$code] : "System";
        $this->response->setStatusCode($code);

        // clear, get page, then send headers
        $this->response->clearBuffer();

        (new ErrorsController($this->request, $this->response))->{$action}($error_response);

        return $this->response;
    }

    public function beforeAction()
    {

        $action = $this->request->param('action');
        if (isset($this->titles[$action])) {
            $this->view->setContextItem("title", $this->titles[$action]);
        }

        $message = $_SESSION["message"] ?? "";
        $this->view->setContextItem("message", $message);
        if ($message) {
            $_SESSION["message"] = "";
        }
    }


    public function __get($name)
    {

        return $this->loadModel($name);
    }

    public function loadModel($model)
    {

        $uc_model = ucwords($model);
        $factory = $uc_model . "Factory";

        if (class_exists($factory)) {
            return $this->$model = new $factory();
        }

        if (class_exists($uc_model)) {
            return $this->$model = new $uc_model();
        }

        $uc_model = 'App\core\\' . $uc_model;
        if (class_exists($uc_model)) {
            return $this->$model = new $uc_model();
        }
    }

    public function forceSSL()
    {
        $secured  = "https://" . $this->request->fullUrlWithoutProtocol();
        return $this->redirector->to($secured);
    }
}
