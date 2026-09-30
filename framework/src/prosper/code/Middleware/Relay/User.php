<?php

namespace Prosper\Middleware\Relay;

use Prosper\Middleware\Relay;
use Core\Data\Shape;
use Core\Service\Manager;
use Core\Middleware\Exception as MiddlewareException;
use Core\Service\Exception\RestException;

class User
{

    public const MEMBERSHIP_FLEXI_ID = 11;

    /**
     * @return Callable
     */
    public static function flatten(): callable
    {
        return Relay::flattenData(function (array $account): array {
            $data = [];
            foreach ($account["users"] as $user) {
                $data[] = [
                    "id"              => (int) $user["id"],
                    "account_id"      => (int) $user["account_id"],
                    "company"         => $account["name"],
                    "name"            => $user["display_name"],
                    "subscription_id" => (int) $account["subscription_id"],
                    "subscription" => $account["subscription"],
                    "frequency" => $account["subscription_type"],
                    "created_at"      => $account["created_at"]
                ];
            }
            return $data;
        });
    }

    /**
     * @return callable
     */
    public static function updateMembershipTokens(): callable
    {
        return function ($action) {

            $user = $action->getShape("session")->getShape("user");
            $aid = $user->get("account_id");
            $membership =  Manager::getService('account')->fetch("account/$aid/membership")->getShape("data");
            $meta = strval($membership->get("meta", ''));
            $meta = (array)json_decode($meta, true);

            if(isset($meta['tokens']) && $meta['tokens'] > 0) {
                $meta['tokens']--;
                Manager::getService('account')->update("account/$aid/membership", new Shape([
                    'data' => [
                        "meta" => json_encode($meta),
                    ],
                    'options' => [
                        CURLOPT_CUSTOMREQUEST => "PATCH"
                    ]
                ]));
                $action->set("tokens", $meta['tokens']);
            }
        };

    }

    /**
     * @param string $regex
     * @return callable
     */
    public static function validatePassword(string $regex = '/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}\S+$/m'): callable {
        return function ($action) use($regex){
            $data = $action->getRoute()->getRequest()->getData();
            $json = $data->getShape("json");
            $password = $json->get("password");
            $repeat_password = $json->get("repeat_password");

            if($password == $repeat_password) {
                /*
                 * If we need to check the regex
                 */
                if(!$regex || (preg_match($regex, $password))) {
                    $action->setItems([
                        "validate" => true,
                        "password" => $password
                    ]);
                    return;
                }
            }

            throw new MiddlewareException(
                "passwordValidate",
                "The password is not valid"
            );

        };
    }

    /**
     * @return callable
     */
    public static function changePassword(): callable {
        return function ($action) {
            if($action->get("validate")) {
                $user = $action->getShape("session")->getShape("user");
                $uid = (int)$user->get("id");

                $data = $action->getRoute()->getRequest()->getData();
                $json = $data->getShape("json");
                $current_password = $json->get("current_password");

                $res = Manager::getService('account')->fetch('user/check_password', ['uid' => $uid, 'password' => $current_password])->getShape("data");
                if ($res->get("success")) {
                    try{
                        Manager::getService('account')->update("user/$uid/profile", new Shape([
                            'data' => [
                                "password" => $action->get("password"),
                            ]
                        ]));
                        $success = true;
                    }catch (\Exception $e){
                        $success = false;
                    }
                }
                $action->set("success", $success ?? false);
            }
        };
    }
}
