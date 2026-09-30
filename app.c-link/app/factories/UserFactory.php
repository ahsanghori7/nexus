<?php
namespace App\factories;

use App\Models\User;

class UserFactory {

    public $user;

    public function __construct()
    {
        $roleParent = user_role(true);
        $classUser = ucfirst($roleParent) . "User";

        if(class_exists($classUser)){
            $this->user = new $classUser();
        }
    }

    /**
     * @return false|mixed
     */
    public static function getUserFromSession() {
        return $_SESSION["user"] ?? false;
    }

    /**
     * @param $id
     * @param $aid
     * @param $token
     * @return User
     */
    public static function getUser($id, $aid, $token, $data=[]) {
        return (new User($id, $aid, $token))->setData($data);
    }

    /**
     * @param $id
     * @param $aid
     * @param $token
     */
    public static function saveUser($id, $aid, $token, $data=[]) {
        $user = self::getUser($id, $aid, $token, $data);
        $user->setData($data);
        $_SESSION["user"] = $user;
    }

    public function __call($name, $params)
    {
        if(isset($this->user)){
            return $this->user->$name(...$params);
        }

        redirect(SITE_URL);
    }
}
