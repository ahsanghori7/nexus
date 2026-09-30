<?php

namespace Prosper\Middleware;

use Core\Data\Shape;
use Core\Middleware\ServiceMiddleware;
use Core\Service\Manager;

class EmailMiddleware extends ServiceMiddleware
{

    public const SERVICE = 'email';

    /**
     * @param string $template
     * @param array $data
     * @return callable
     */
    public static function send(string $template, array $data): callable
    {
        return function (Shape $action) use ($template, $data) {
            try {
                $data['template'] = $template;
                Manager::getService('email')->write("email/send", new Shape(['data' => $data]));
                $action->set("status_email", true);
            } catch (\Exception $e) {
                $action->set("status_email", false);
            }
        };
    }
}
