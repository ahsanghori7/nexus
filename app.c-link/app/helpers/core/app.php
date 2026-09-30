<?php

use App\Api\Account;
use App\core\App;
use App\core\Config;
use App\core\Controller;
use App\core\Session;
use App\Factory\UserFactory;
use App\Utility\Arrays;

if (!function_exists('app')) {
    function app()
    {
        return Controller::getInstance();
    }
}

if (!function_exists('container')) {
    function container()
    {
        return App::getInstance();
    }
}

if (!function_exists('curl')) {
    function curl(string $url, array $data, string $type = 'POST', string $content_type = 'json')
    {
        $curl_type = strtoupper($type);
        $content_type = strtolower($content_type);

        $ch = curl_init($url);

        if ($curl_type === 'POST') {
            if ($content_type === 'json') {
                $data = json_encode($data);
            }
            if ($content_type === 'form') {
                $data = http_build_query($data);
            }
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }

        if ($content_type === 'form') {
            $content_type = 'application/x-www-form-urlencoded';
        }

        if ($content_type === 'json') {
            $content_type = 'application/json';
        }

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        if ($curl_type === 'DELETE' || $curl_type === 'PATCH' || $curl_type === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $curl_type);
        }

        curl_setopt($ch, CURLOPT_COOKIESESSION, true);

        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: ' . $content_type));
        $result = curl_exec($ch);
        $curl_info = curl_getinfo($ch);
        curl_close($ch);

        if (isset($curl_info['http_code']) && $curl_info['http_code'] === 200) {
            if ($result == '') {
                $result = true;
            }
        }

        return $result;
    }
}

if (!function_exists('api')) {
    function api(string $endpoint, array $data = [], string $curl_type = 'POST')
    {
        $result = curl(Config::get('api.account.url') . $endpoint, $data, $curl_type);

        if ($result) {
            $result = json_decode($result, true);
        }

        return $result;
    }
}

if (!function_exists('error')) {
    function error($errorCode, $errorMessage, $errorData = [])
    {
        throw new \Exception($errorMessage, $errorCode);
    }
}

if (!function_exists('email')) {
    function email()
    {
        return app()->email;
    }
}

if (!function_exists('config')) {
    function config($key = null)
    {
        return Config::get($key) ?? null;
    }
}

if (!function_exists('safe_json_encode')) {
    function safe_json_encode(array $array = [])
    {
        return Arrays::safe_json_encode($array);
    }
}

if (!function_exists('request_data')) {
    function request_data($key = null, bool $filter_html = false)
    {
        if ($filter_html) {
            return e_html(app()->request->data($key));
        }
        return app()->request->data($key);
    }
}

if (!function_exists('query_data')) {
    function query_data($key = null, bool $filter_html = true)
    {
        if ($filter_html) {
            return e_html(app()->request->query($key));
        }
        return app()->request->query($key);
    }
}

if (!function_exists('isAjax')) {
    function isAjax()
    {
        return app()->request->isAjax();
    }
}

if (!function_exists('redirect')) {
    function redirect($url = null)
    {
        app()->redirector->redirects($url);
    }
}

if (!function_exists('self_redirect')) {
    function self_redirect()
    {
        redirect(app()->request->url);
    }
}

if (!function_exists('csrf_token')) {
    function csrf_token($url = null)
    {
        return Session::getCsrfToken() ?? null;
    }
}

if (!function_exists('logout')) {
    function logout($url = null)
    {
        app()->redirector->logout();
    }
}

if (!function_exists('logout_url')) {
    function logout_url($url = null)
    {
        return SITE_URL . '/logout';
    }
}

function login_url_redirect($account_id)
{
    if ($account_id) {
        try {
            $provider = Account::get("account/{$account_id}/sso/provider");
            $redirectUrl = $provider['redirect_url'];
            if($redirectUrl && !empty($redirectUrl)) {
                echo "<script>window.location.href = '". SITE_URL ."/auth';</script>";
                exit;
            }
        } catch (\Exception $th) {
            // user will be redirected to login screen
        }
    }
    echo "<script>window.location.href = '". SITE_URL ."/login';</script>";
    exit;
}

if (!function_exists('e_html')) {
    function e_html($html = null)
    {
        return app()->view->encodeHTML($html);
    }
}

if (!function_exists('e_url')) {
    function e_url($url = null)
    {
        $url = filter_var($url, FILTER_SANITIZE_URL);
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            return $url;
        }
        return false;
    }
}

if (!function_exists('set_notification')) {
    function set_notification($message, $type = 'notification')
    {
        //checkhere
        if ($type == 'error') {
            $_SESSION['error'] = $message; //$db->show_one($message);
        } else {
            $_SESSION['notification'] = $message; //$db->show_one($message);
        }
    }
}

if (!function_exists('set_error')) {
    function set_error($message, $type = 'error')
    {
        set_notification($message, 'error');
    }
}

if (! function_exists('ghostUserID')) {
    function ghostUserID()
    {
        if (isGhost()) {
            return $_SESSION['ghost_user_id'] ?? 0;
        }
        return 0;
    }
}


if (! function_exists('ghostID')) {
    function ghostID()
    {
        if (isGhost()) {
            return $_SESSION['ghost_id'] ?? null;
        }
        return null;
    }
}

if (! function_exists('ghostRole')) {
    function ghostRole()
    {
        if (isGhost()) {
            return $_SESSION['ghost_role'] ?? null;
        }
    }
}

if (! function_exists('isGhost')) {
    function isGhost()
    {
        if (isset($_SESSION['ghost']) && $_SESSION['ghost'] == 1) {
            return true;
        }
        return false;
    }
}

if (! function_exists('isAdmin')) {
    function isAdmin()
    {
        if (user_role() == 'admin' || user_role() == 'administrator' || isGhost()) {
            return true;
        }
        return false;
    }
}

if (! function_exists('is_administrator')) {
    function is_administrator()
    {
        if (user_role() == 'admin' || user_role() == 'administrator' || isGhost()) {
            return true;
        }
        return false;
    }
}

if (!function_exists('user_id')) {
    function user_id()
    {
        if (!UserFactory::getUser()) {
            return 0;
        }
        return UserFactory::getUser()->getId();
    }
}

if (! function_exists('isLoggedIn')) {
    function isLoggedIn()
    {
        return app()->Cookie->isValid();
    }
}

if (! function_exists('user_role')) {
    function user_role($parent = false)
    {
        if (!UserFactory::getUser()) {
            return '';
        }
        return UserFactory::getUser()->getRole($parent);
    }
}

if (!function_exists('ip')) {
    function ip($key = null)
    {
        return Session::get('ip') ?? null;
    }
}

if (!function_exists('user_agent')) {
    function user_agent($key = null)
    {
        return Session::get('user_agent') ?? null;
    }
}

if (!function_exists('is_url')) {
    function is_url($key = null)
    {
        return true;
    }
}

if (!function_exists('secure')) {
    function secure($array = [])
    {
        return app()->Security->secure($array);
    }
}

if (!function_exists('dashboard_url')) {
    function dashboard_url(string $dashboard = '')
    {
        return app()->request->dashboardUrl($dashboard);
    }
}

if (!function_exists('redirect_dashboard')) {
    function redirect_dashboard(string $controller = '')
    {
        return redirect(SITE_URL . '/' . app()->request->redirectDashboard($controller));
    }
}

if (!function_exists('reset_email')) {
    function reset_email()
    {
        Session::set('override_email', null);
        return Session::get('override_email') ?? Session::get('user_email') ?? null;
    }
}

if (!function_exists('prd')) {
    function prd($print_r = '', ...$print_rAll)
    {
        if (!isset($print_r)) {
            die();
        }
        echo "<style>body{font-family:monospace!important;}</style>";
        echo pr($print_r);
        foreach ($print_rAll as $k => $v):
            if ($v) {
                echo pr($v);
            } else {
                echo pr(false);
            }
        endforeach;
        die();
    }
}

if (!function_exists('pr')) {
    function pr($print_r = '', ...$print_rAll)
    {
        static $no_calls = 1; ?>
        <div style='padding-left:10px;width:100%;height:auto;position:relative;'>
            <?php
            if (empty($print_r)) {
                $count = 0;
            } else {
                if (is_array($print_r)) {
                    $count = count($print_r);
                } else {
                    $count = 1;
                }
            }
            if (!isset($_SESSION['function_attr'])) {
                $_SESSION['function_attr'] = [];
            }
            ?>
            <div class="print_r_debug"
                style="border-radius: 4px;cursor:pointer;width:100%;background-color:#C5C7C8;padding: 5px;"><b
                    style="font-size:130%;margin-left: 5px;"><?php echo $_SESSION['function_name'] ?? null; ?> |
                    Print: <?php echo $no_calls; ?> | Count: <?php echo $count; ?></b></div>
            <?php
            unset($_SESSION['function_name']);
            unset($_SESSION['function_attr']);
            echo "<style>body{font-family:monospace!important;}</style>";
            echo dqs_print_r_multiple($print_r);
            if (!empty($print_rAll)) {
                foreach ($print_rAll as $v):
                    if ($v) {
                        echo dqs_print_r_multiple($v);
                    }
                endforeach;
            }
            $no_calls++; ?>
        </div>
        </div>
<?php
    }
}

if (!function_exists('dqs_print_r_multiple')) {
    function dqs_print_r_multiple($print_r)
    {
        if (is_null($print_r)) {
            echo "<div class='print_r_debug_content' style='padding:0px'><pre>NULL</pre></div>";
        } else {
            if (gettype($print_r) != 'object') {
                $print_r = str_replace("<br/>", "\n", $print_r);
            }
            if (is_array($print_r)) {
                $formatted = print_r($print_r, true);
                echo "<div class='print_r_debug_content' style='padding:0px'><pre>" . htmlspecialchars($formatted, ENT_QUOTES, 'UTF-8', true) . "</pre></div>";
            } elseif ($print_r != '') {
                if (gettype($print_r) == 'object') {
                    $formatted = print_r($print_r, true);
                    echo "<div class='print_r_debug_content' style='padding:0px'><pre>" . htmlspecialchars($formatted, ENT_QUOTES, 'UTF-8', true) . "</pre></div>";
                } else {
                    echo "<div class='print_r_debug_content' style='padding:0px'><pre>" . htmlspecialchars($print_r, ENT_QUOTES, 'UTF-8', true) . "</pre></div>";
                }
            } else {
                echo "<div class='print_r_debug_content' style='padding:0px'><pre></pre></div>";
            }
        }
    }

    function baseUrl()
    {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off' ? 'https' : 'http';
        $host = $_SERVER['SERVER_NAME'];
        $port = $_SERVER['SERVER_PORT'];

        // Append port number if it's non-standard
        if ($port && $port != 80 && $port != 443) {
            $host .= ':' . $port;
        }

        return sprintf("%s://%s", $protocol, $host);
    }
}

/**
 * @param string $suffix
 * @return string
 */
function getClinkUrl(string $suffix = "")
{
    $url = rtrim(Config::get('url.c-link'), "/");
    if ($suffix) {
        $url .= "/" . ltrim($suffix, "/");
    }
    return $url;
}
function clink_url(string $page = '')
{
    return getClinkUrl($page);
}
