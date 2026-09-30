<?php
namespace App\Factory;

use App\Api\Account;
use App\Api\Project;
use App\Models\User;
use App\core\Environment;

class UserFactory {

    protected static $autoUser;

    public static function setAutoUser($id, $aid, $token, $data) {
        self::$autoUser = self::getNewUser($id, $aid, $token, $data);
    }
    /**
     * @return false|mixed
     */
    public static function getUser() {
        //For development mode and CI, allow us auto test relay
        if(Environment::isDevelopment() && self::$autoUser) {
            return self::$autoUser;
        }

        /*
       * If the session is not set we need to try to get the user from the token
       */
        $token = app()->Cookie->getCookie('token');
        $ghost_id = app()->Cookie->getCookie('ghost');

        if(!$token){
          return false;
        }

        if(app()->Cookie->allowGhostMode()) {
            /*
             * If the admin make a request to go to a specific project we need to
             * get the group owner of the project so we can go in ghost mode to that account
            */
            $redirect_project = app()->Request->query['redirect_project'] ?? null;
            if($redirect_project){
                $project = Project::getProjectBySlug($redirect_project);
                if(!isset($project['group_id'])){
                    throw new \Exception(\LanguageControl::get('no_access'));
                }
                $account_id = $project['group_id'];
                $account_data = Account::getAccount($account_id);
                /*
                 * Because ghost mode works on a user id level and we only store
                 * the group_id(account_id) in DB and not the user id we will get
                 * the first user from the account user list and ghost mode to that account
                 */
                $user = array_shift($account_data['users']);
                $user_id = $user['id'];
                setcookie(app()->Cookie->getCookieNameByEnvironment('ghost'), $user_id, time() + 24 * 3600, "/", config('cookie.domain'));
                $_COOKIE[app()->Cookie->getCookieNameByEnvironment('ghost')] = $user_id; //add the cookie so the browser can see it without the user refreshing the page
            }
            else{
                if($ghost_id) {
                    $user_id = $ghost_id;
                    $account_id = Account::getAccountIdByUser($user_id);
                    if ( !$account_id ) {
                        return false;
                    }
                }else{
                    $user_session = app()->Cookie->getUserSession();
                    if(!$user_session){
                        return false;
                    }
                    $user_id = $user_session['user_id'];
                    $account_id = $user_session['user']['account_id'];
                }
            }
        }else{
          if($ghost_id){
            /*
             * If the user is not an administrator anymore but the ghost cookie is still
             * present we need to remove it
             */
            app()->Cookie->remove(app()->Cookie->getCookieNameByEnvironment('ghost'));
          }
          $user_session = app()->Cookie->getUserSession();
          if(!$user_session){
            return false;
          }
          $user_id = $user_session['user_id'];
          $account_id = $user_session['user']['account_id'];
        }

        return self::storeUserSession($user_id, $account_id, $token);
    }

    /**
     * @param $id
     * @param $aid
     * @param $token
     * @return User
     */
    public static function getNewUser($id, $aid, $token, $data=[]) {
        return (new User($id, $aid, $token))->setData($data);
    }

    /**
     * @param $id
     * @param $aid
     * @param $token
     */
    public static function storeUserSession($id, $aid, $token) {
        $user = self::getNewUser($id, $aid, $token);
        $user->loadFromApi();
        $_SESSION["user"] = $user;

        return $user;
    }

}
