<?php
namespace App\core;

use App\core\Config;

class Session{

    private function __construct() {}

    public static function init()
    {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function getIsLoggedIn(){

        return empty($_SESSION["is_logged_in"]) || !is_bool($_SESSION["is_logged_in"]) ? false : $_SESSION["is_logged_in"];
    }

    public static function ghostID()
    {
        $role = self::getUserRole();
        $ghost = query_data('ghost');

        if($role == 'administrator' || (isset($_SESSION['ghost']) && $_SESSION['ghost'] == 1)){

            if(isset($ghost)){
                return $ghost;
            }

            if(isset($_SESSION['ghost_id']) && $_SESSION['ghost_id']){
                return $_SESSION['ghost_id'];
            }

            return false;
        }
        return false;
    }

    public static function resetGhost()
    {
        $ghost = query_data('reset_ghost') ?? query_data('ghost_reset') ?? null;

        if(isset($ghost)){
            unset($_SESSION['role'], $_SESSION['role_display'], $_SESSION['ghost'], $_SESSION['ghost_id'], $_SESSION['ghost_role'], $_SESSION['ghost_user_role'], $_SESSION['role_original'], $_SESSION['ghost_user_id']);
        }
    }

    public static function getUserId(){
        return empty($_SESSION["user_id"]) ? null : (int)$_SESSION["user_id"];
    }


    public static function getUserRole(int $user_id = 0){
        return empty($_SESSION["role"]) ? null : $_SESSION["role"];
    }


    public static function getCsrfToken()
    {
        if(!isset($_SESSION[Config::get('csrf.token_name')])){
          self::generateCsrfToken();
        }

        return empty($_SESSION[Config::get('csrf.token_name')]) ? null : $_SESSION[Config::get('csrf.token_name')];
    }

    public static function set($key, $value){
        $_SESSION[$key] = $value;
    }

    public static function get($key){
        return array_key_exists($key, $_SESSION)? $_SESSION[$key]: null;
    }

    //the csrf token is refresh only on user log in
    public static function generateCsrfToken(){
        $token = md5(uniqid((string)rand(), true));
        $_SESSION[Config::get('csrf.token_name')] = $token;
        return $_SESSION[Config::get('csrf.token_name')];
    }

    public static function reset($data){

        // remove old and regenerate session ID.
        if(session_status() == PHP_SESSION_ACTIVE){
            session_regenerate_id(true);
        }
        $_SESSION = array();

        $_SESSION["is_logged_in"] = true;
        $_SESSION["user_id"]      = (int)$data["user_id"];
        $_SESSION["role"]         = $data["role"];

        // save these values in the session,
        // they are needed to avoid session hijacking and fixation
        $_SESSION['ip']             = $data["ip"];
        $_SESSION['user_agent']     = $data["user_agent"];
        $_SESSION['generated_time'] = time();

        setcookie(session_name(), session_id(), time() + Config::get('session.cookie_expiry'), Config::get('cookie.path'), Config::get('cookie.domain'), Config::get('cookie.secure'), Config::get('cookie.http'));

    }

    /**
     * @param string $message
     * @param string $key
     */
    public static function setMessage(string $message, string $key) {
        $messages = $_SESSION["messages"] ?? [];
        $messages[$key] = $message;
        $_SESSION["messages"] = $messages;
    }

    /**
     * @param $key
     * @return mixed
     */
    public static function getMessages($key) {
        $messages = $_SESSION["messages"] ?? [];
        if(isset($messages[$key])) {
            $message = $messages[$key];
            unset($messages[$key]);
            $_SESSION["messages"] = $messages;
            return $message;
        }
    }

    public static function remove(){

        // update session in database
        //$userId = user_id();
        //if(!empty($userId)){
           // self::updateSessionId(self::getUserId());
       // }

        // clear session data
        $_SESSION = array();

        // remove session cookie
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }

        // destroy session file on server(if not already)
        if(session_status() === PHP_SESSION_ACTIVE){
            session_destroy();
        }
    }

}
