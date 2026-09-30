<?php
namespace Api\Middleware;
use Core\Data\Shape;
use Core\Middleware\Exception as MiddlewareException;
use Core\Config;
use Core\Router\Route\Action;
use Core\Service\Manager;


class DevSession extends ApiSession
{
    /**
     * @var string
     */
    protected static string $token = '';

    /**
     * @param Action $action
     * @return string
     * @throws MiddlewareException
     *
     * For Session Config see config at APP_ROOT/config/environment/development.php
     */
    public static function getToken(Action $action) : string
    {
        try {
            $token = Parent::getToken($action);
        }
        catch (\Exception $e) {
            /**
             * Allow for an override if a token header is provided, but return a static token for testing in local for direct calls to the
             * Api
             **/
            $token = Config::get("session.dev_token");
            $autoDevLoginEnabled = Config::get("session.login.auto_login_enabled", false);
            if(!$token && ($autoDevLoginEnabled === false)) {
                throw new MiddlewareException("invalidToken", "Dev session requires a token!,
                    please set dev_token config in APP_ROOT/config/environment/development.php");
            }
            elseif(!$token) {
                /**
                 * Here we allow for a user to be configured so that we can always log in with them
                 **/
                $token = self::logDevIn()($action, "");
            }
        }

        return $token ?? "";
    }

    /**
     * @return Callable
     */
    public static function logDevIn(): Callable
    {
        return function(Action $shape) {
            $shape->set("login", [
                "username" => Config::get("session.login.email"),
                "password" => Config::get("session.login.password"),
            ]);
            self::Login()($shape);
            self::$token = $shape->get("token");
        };
    }
}
