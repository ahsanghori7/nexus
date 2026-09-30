<?php

namespace Core\Middleware;
use Core\Config;
use Core\Middleware\Exception as MiddlewareException;
use Core\Router\Route\Action;
use Core\Service\Manager;
use Core\Data\Shape;
use Core\Util\Url;
use Core\Service\Exception\RestException;

/**
 * ToDo: Move session logic into a registered session handler
 * https://www.php.net/manual/en/function.session-set-save-handler.php
 */

class Session
{

    const DATA_KEY = "session";

    /**
     * @var bool
     */
    protected static bool $initialized = false;

    /**
     * @param string $token
     * @return Shape|void
     * @throws Exception
     */
    public static function getUserDataByToken(string $token)
    {
        if(!$token){
            return;
        }
        try {
            $res = Manager::getService("account")->fetch("user/session/$token");
            return new Shape(['code' => $res->get("info.http_code"), "json" => $res]);
        }
        catch(RestException $re) {
            $code = $re->getCode();
            //If not an auth error relay exception as service failure
            if($code !== 401) {
                throw new MiddlewareException("ServiceFailure",
                    "Account Service Failed with message" . $re->getMessage()
                );
            }
            return new Shape(['code' => 401, "json" => null]);
        }

    }

    /**
     * @param string $token
     * @return Shape
    */
    public static function getGhostModeUserFromToken(string $token): Shape
    {
        try {
            $ghost_data = [];
            $res = Manager::getService("account")->fetch("user/session/$token");
            $environment = Config::get("environment");
            if ($res->get("data.meta")) {
                $meta = json_decode($res->get("data.meta"), true);
                $key = "ghost_" . $environment;
                $ghost_user_id  = $meta[$key] ?? null;
                if ($ghost_user_id) {
                    $user = Manager::getService("account")->fetch(sprintf("user/%s/profile", $ghost_user_id));
                    $account = Manager::getService("account")->fetch(sprintf("account/%s", $user->get("data.account_id")));
                    $ghost_data = [
                        "user" => $user->get("data")->toArray(),
                        "account" => $account->get("data")->toArray(),
                    ];
                }
            }
        } catch (\Exception $e) {
            $ghost_data = [];
        }
        return new Shape($ghost_data);
    }

    /**
     * @return Callable
     */
    public static function init() : Callable {
        return function(Action $shape) {
            if(!is_null($shape->get(self::DATA_KEY))) {
                return $shape;
            }

            if (session_status() === PHP_SESSION_NONE) {
                if(!session_start()) {
                    throw new MiddlewareException("system", "Failed to create session");
                }
            }

            $token = $shape->getRoute()
                ->getRequest()
                ->getData()
                ->getShape("cookies")
                ->string(Config::get("session.cookie_name"));
            $session = new Shape([Config::get("session.cookie_name")  => $token]);
            if($token) {
                $res = self::getUserDataByToken($token);
                if($res) {
                    $session->set("status", $res->get("code"));
                    if ( $session->get("status") === 200 ) {
                        $session->merge(
                            $res->getShape("json")->getShape("data")
                        );
                    }
                }
            }
            $shape->set(self::DATA_KEY, $session);
        };
    }

    /**
     * @return Callable
     */
    public static function exists(Callable $callback = null) : Callable {
        return function(Shape $shape) use ($callback) : bool {
            self::init()($shape);
            $session = $shape->getShape(self::DATA_KEY);
            $token   = $session->get("token");
            $status  = $session->get("status");

            $state   = (!is_null($token) && $status === 200);
            if($state && is_callable($callback)) {
                $callback($shape);
            }
            return $state;
        };
    }

    /**
     * @param string $dataKey
     * @return \Closure
     */
    public static function validateToken(string $dataKey): Callable
    {
        return function(Shape $shape) use($dataKey) {
            $token = $shape->get($dataKey);
            try {
                Manager::getService("account")->fetch("user/session/$token");
            }
            catch(RestException $re) {
                throw new MiddlewareException("noSession", "Token failed authentication");
            }
        };
    }

    /**
     * @return Callable
     */
    public static function validate() : Callable {
        return function(Shape $shape) {
            $calledClass = get_called_class();
            forward_static_call([$calledClass,"init"])($shape);
            $token = $shape->getShape(self::DATA_KEY)->get("token");
            if(!$token) {
                throw new MiddlewareException("noSession", "No session token found");
            }
            if($shape->getShape(self::DATA_KEY)->get("status") === 401) {
                throw new MiddlewareException("noSession", "Token failed authentication");
            }
            if (method_exists($calledClass, "post_validate_hook")) {
                $calledClass::post_validate_hook($shape);
            }
        };
    }

    /**
     * @return Callable
     */
    public static function checkAccount() : Callable {
        return function(Shape $shape) {
            self::init()($shape);

            $user = $shape->getShape("session")->getShape("user");

            /*
             * If the user is admin has global permission
             */
            if(!Generic::isAccountType($shape, ['administrator'])) {
                /*
                 * The user is not an admin and the account id from url don't match the account id from the session
                 */
                if($shape->get("uriArgs.aid") != $user->get("account_id")){
                    throw new MiddlewareException("noPermissionAccount", "You don't have permission");
                }

            }
        };

    }

    /**
     * @return Callable
     */
    public static function login() : Callable {
        return function(Action $shape) {
            self::init()($shape);
            $form  = $shape->getRoute()->getRequest()->getData()->getShape("form");
            $res   = Manager::getService("account")->write("user/session", new Shape(['data' => $form->toArray()]));

            if($res->get("info.http_code") === 401) {
                throw new MiddlewareException("authError", "Invalid user or password");
            }

            if($res->get("info.http_code") === 500) {
                throw new MiddlewareException("serviceError", "Service return error response");
            }

            $json = $res->getShape("json")->getShape("data");
            if($json->get("status") === false){
                throw new MiddlewareException("accountInactive", "Account inactivate");
            }

            $shape->set("user", new Shape($json->getShape("user")->toArray()));
            $shape->set("token", $json->get("token", ""));
        };
    }

    /**
     * @return Callable
     */
    public static function CsfrInit() : Callable {
        return function(Shape $shape) {
            self::init()($shape);
            $token = bin2hex(openssl_random_pseudo_bytes(16));
            $shape->set("csfr_token", $token);
            $_SESSION["csfr_token"] = $token;
        };
    }

    /**
     * @param string $message
     * @param string $type
     * @return void
     */
    public static function setMessage(string $message, string $type) {
        if(!isset($_SESSION["messages"])) {
            $_SESSION["messages"] = [
                $type => []
            ];
        }
        $_SESSION["messages"][$type] = $message;
    }

    /**
     * @return array
     */
    public static function cleanMessages() : array
    {
        $messages = [];
        if(isset($_SESSION["messages"])) {
            $messages = $_SESSION["messages"];
            if(!is_array($messages)) {
                $messages = [];
            }
            $_SESSION["messages"] = [];
        }
        return $messages;
    }

    /**
     * @return Callable
     */
    public static function CsfrValidate($csfr_token = null) : Callable {
        return function(Action $action) use ($csfr_token) {
            self::init()($action);
            $form = $action->getRoute()->getRequest()->getData()->getShape("form");

            $requestToken = $form->has("csfr_token") ? $form->get("csfr_token") : $csfr_token;
            $sessionToken = $_SESSION["csfr_token"] ?? null;

            if (empty($requestToken)) {
                throw new MiddlewareException("authError", "CSFR Missing");
            }
            if (!$requestToken == $sessionToken) {
                throw new MiddlewareException("authError", "CSFR Token Mismatch");
            }
        };
    }

    /**
     * @param string $name
     * @param string $key
     * @param Shape $config
     * @return \Closure
     */
    public static function setCookie(string $name, string $key, Shape $config) {
        return function($shape) use($name, $key, $config) {
            setcookie(
                $name,
                $shape->string($key),
                intval($config->get("expires", 0)),
                $config->string("path", "/"),
                trim($config->string("cookie_domain", "")),
                ($config->get("secure", false) === true),
                ($config->get("httponly", false) === true),
            );
        };
    }

    /**
     * @param string $name
     * @return Callable
     */
    public static function unsetCookie(string $name, Shape $config) : Callable {
        return function() use($name, $config) {
            if(isset($_COOKIE[$name])) {
                setcookie(
                    $name, "", time() - (3600 * 24),
                    $config->string("path", "/"),
                    trim($config->string("cookie_domain", "")),
                    (bool)$config->get("secure", false),
                    (bool)$config->get("httponly", false)
                );
                unset($_COOKIE[$name]);
            }
        };
    }

    /**
     * @return Callable
     */
    public static function destroy() : Callable {
        return function(Action $shape) {
            $token = $shape->getRoute()->getRequest()->getData()->getShape("cookies")->string("token");
            if($token) {
                Manager::getService("account")->delete("user/session/$token");
            }
        };
    }
}
