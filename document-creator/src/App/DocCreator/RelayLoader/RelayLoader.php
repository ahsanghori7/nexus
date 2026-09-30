<?php

namespace App\DocCreator\RelayLoader;

use App\Api\Account;
use App\Api\Document\Template as TemplateApi;
use App\Models\User;

class RelayLoader
{

    protected static $relay = [
        'template' => TemplateApi::class,
        'account' => Account::class,
    ];

    public static function load(array $args, User $user)
    {

        //Load user id if is not loaded before (CRON)
        if(!$user->getAccountData()){
            $user = new User($user->getId(), $user->getAccountId(), $user->getToken());
        }

        if(isset(self::$relay[$args['action']])){
            $relay = self::$relay[$args['action']];
            if(method_exists($relay, $args['method'])){
                $request = new Request($args);
                $output = call_user_func_array([$relay, $args['method']],[$request, $user, $args]);
                return $output->getData();
            }
            throw new \Exception('Invalid method');
        }
        throw new \Exception('Invalid relay');
    }

}
