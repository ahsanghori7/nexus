<?php

namespace App\core\components;

use App\core\Component;
use App\core\Config;
use App\core\Logger;
use App\core\Session;

class SecurityComponent extends Component
{

    protected $config = [
        'form' => [],
        'requireSecure' => [],
        'requirePost' => [],
        'requireAjax' => [],
        'requireGet' => [],
        'validateForm' => true,
        'validateCsrfToken' => false
    ];


    public function startup()
    {

        if (!$this->secureRequired()) {
            return $this->invalidRequest('forceSSL', 'secured requred');
        }
    }

    private function secureRequired()
    {
        $key = "requireSecure";
        if (!empty($this->config[$key])) {
            if (in_array($this->request->param('action'), $this->config[$key], true) || $this->config[$key] === ['*']) {
                if (!$this->request->isSSL()) {
                    return false;
                }
            }
        }
        return true;
    }

    private function invalidRequest($callback = null, $debug_message = '')
    {
        if (is_callable([$this->controller, $callback])) {
            return $this->controller->{$callback}();
        }
        if (function_exists($callback)) {
            $callback();
        }
        if ($debug_message) {
            throw new \Exception($debug_message, 400);
        }
        throw new \Exception('The request has been denied' . $debug_message, 400);
    }

    public function requireSecure($actions = [])
    {
        $this->config['requireSecure'] = (array)$actions;
    }

    public function requirePost($actions = [])
    {
        $this->config['requirePost'] = (array)$actions;
    }

    public function requireAjax($actions = [])
    {
        $this->config['requireAjax'] = (array)$actions;
    }

    public function requireGet($actions = [])
    {
        $this->config['requireGet'] = (array)$actions;
    }

    public function secure($parameters = array())
    {
        // no parameters submitted or sizeoverflow
        if (empty($parameters) || $this->request->dataSizeOverflow()) {
            return false;
        }

        //no CsrfToken or invalid CsrfToken
        if (!$this->CsrfToken()) {
            return false;
        }

        $allowed_array = array();

        //prepare fields
        $temp = array();
        foreach ($parameters as $key => $param) {
            if (is_numeric($key)) {
                $temp[$param] = 'normal';
            } else {
                $temp[$key] = $param;
            }
        }
        unset($parameters);

        //secure fields
        foreach ($temp as $key => $value) {
            if (!isset($this->request->data[$key])) {
                $allowed_array[$key] = NULL;
            } else {
                if ($value == 'htmlclean') {
                    $allowed_array[$key] = $this->secureStriptags($this->request->data[$key]);
                } elseif ($value == 'number') {
                    $allowed_array[$key] = $this->secureNumber($this->request->data[$key]);
                } elseif ($value == 'email') {
                    $allowed_array[$key] = $this->secureEmail($this->request->data[$key]);
                } elseif ($value == 'url') {
                    $allowed_array[$key] = $this->secureUrl($this->request->data[$key]);
                } elseif ($value == 'file') {
                    $allowed_array[$key] = $this->secureFile($this->request->data[$key]);
                } else { //if($value == 'normal')
                    $allowed_array[$key] = $this->secureTrim($this->request->data[$key]);
                }
            }
        }

        $this->request->data = $allowed_array;

        unset($temp, $allowed_array);
    }

    function sanitize_filename($filename)
    {
        $filename = preg_replace('/[^\w\-\.]/', '_', $filename);
        $filename = ltrim($filename, '.');
        return substr($filename, 0, 255);
    }

    function secureFile(&$file = [], $separator = '')
    {

        if (!isset($file['name']) || (!isset($file['error']) || $file['error'] != 0) || $file['size'] == 0) {
            return false;
        }

        $file['name'] = self::sanitize_filename($file['name']);

        return $file;
    }

    public function secureStriptags($value = '')
    {
        $value = is_array($value) ? array_map([$this, 'secureEmail'], $value) : strip_tags(trim($value));
        return $value;
    }

    public function secureNumber($value = '')
    {
        $value = is_array($value) ? array_map([$this, 'secureNumber'], $value) : filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        return $value;
    }

    public function secureEmail($value = '')
    {
        $value = is_array($value) ? array_map([$this, 'secureEmail'], $value) : filter_var($value, FILTER_SANITIZE_EMAIL);
        return $value;
    }

    public function secureUrl($value = '')
    {
        $value = is_array($value) ? array_map([$this, 'secureEmail'], $value) : filter_var($value, FILTER_SANITIZE_URL);
        return $value;
    }

    public function secureTrim($value = '')
    {
        $value = is_array($value) ? array_map([$this, 'secureTrim'], $value) : trim($value);
        return $value;
    }

    public function form($config)
    {

        if (empty($config['fields']) || $this->request->dataSizeOverflow()) {
            return false;
        }

        if (!in_array(Config::get('csrf.token_name'), $config['fields'], true)) {
            $config['fields'][] = Config::get('csrf.token_name');
        }

        // exclude any checkboxes, radio buttons, possible empty arrays, ...etc.
        $exclude = empty($config["exclude"]) ? [] : (array)$config["exclude"];
        if (!in_array('submit', $exclude, true)) {
            $exclude[] = 'submit';
        }

        foreach ($config['fields'] as $field) {
            if (!array_key_exists($field, $this->request->data)) {
                //This is super rubbish... I just dont have time to fix it properly....
                if ($field !== "mailing_list_consent") {
                    throw new \Exception('Missing field ' . $field);
                }
            }
        }

        //validate csrftoken
        return $this->CsrfToken();
    }


    public function CsrfToken($config = [])
    {

        $userToken = null;
        if ($this->request->isPost()) {
            $userToken = $this->request->data(Config::get('csrf.token_name'));
        } else {
            $userToken = $this->request->query(Config::get('csrf.token_name'));
        }

        if (empty($userToken) || $userToken !== Session::getCsrfToken()) {
            //Logger::log("CSRF Attack", "User: ". Session::getUserId() ." provided invalid CSRF Token " . $userToken, __FILE__, __LINE__);
            return false;
        }

        return $userToken === Session::getCsrfToken();
    }
}
