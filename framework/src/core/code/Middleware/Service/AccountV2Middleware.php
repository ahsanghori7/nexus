<?php
namespace Core\Middleware\Service;

use Core\Middleware\Service\AccountMiddleware;
use Core\Service\Manager;
use Core\Service\ServiceAbstract;

class AccountMiddlewareV2 extends AccountMiddleware
{
    const SERVICE = 'account_v2';

    public static function getService(): ServiceAbstract
    {
        return Manager::getService(self::SERVICE);
    }
}
