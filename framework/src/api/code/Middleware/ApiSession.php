<?php
namespace Api\Middleware;

use Core\Config;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Middleware\Session as CoreSession;
use Core\Router\Route\Action;

class ApiSession extends CoreSession
{

   /**
    * @return Callable
    */
   public static function init() : Callable
   {
       return function(Action $shape) {

           /**
            * Allow for Child Override on getToken
            * **/
           $class = get_called_class();
           $token = $class::getToken($shape);
           $res = CoreSession::getUserDataByToken($token);

           if(!$res || (int)$res->get("code") !== 200){
               throw new MiddlewareException("invalidToken", "Failed to load user from token");
           }
           $shape->set(CoreSession::DATA_KEY, new Shape([
               'token' => $token
           ]));

            $resData = $res->getShape("json")->getShape("data");

            // check if the account type is an admin as only admins can ghost mode
            $userSubscription = $resData->get("account.membership.subscription.uid");
            // check if there is a ghost user in meta data
            $ghost_mode = CoreSession::getGhostModeUserFromToken($token);

            if ($userSubscription == "administrator" && $ghost_mode->hasData()) {
                $shape->merge($ghost_mode);
            } else {
                $shape->merge($resData);
            }
       };
   }

    /**
     * @return mixed
     * @throws \Exception
     */
   public static function getAuthorizationTokenName()
   {
       return Config::get("session.authorization.key", self::DATA_KEY);
   }

    /**
     * @param Action $action
     * @return string
     * @throws MiddlewareException
     */
   public static function getToken(Action $action) : string
   {
       $headers = array_change_key_case(getallheaders());
       if(isset($headers["authorization"])) {
           $token = $headers["authorization"];
       }
       else {
           $token = $action->getRoute()->getRequest()->getData()->get(self::getAuthorizationTokenName());
       }

       //Retrieve the token from an url args if it is not found in the headers
       $token = $action->get("uriArgs.token", $token);

       if($token) {
           $matches = array();
           if ( preg_match('/Bearer (.+)/', $token, $matches) ) {
               if ( isset($matches[1]) ) {
                   $token = $matches[1];
               }
           }
       }
       else {
           throw new MiddlewareException("invalidToken", "Authorization token not found");
       }
       return (string)$token;
   }

    /**
     * @return Callable
     */
    public static function invalidApiToken() : Callable {
        return function(MiddlewareException $ex, Action $action) {
            $action->set("headers", [
                "HTTP/1.0 401 Unauthorised" => ""
            ]);
            $action->set("json", json_encode([
                "error" => "Unauthorised",
                "message" => "Your session has expired. Please log in again.",
            ]));
        };
    }
}
