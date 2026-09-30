<?php

namespace Prosper\Middleware\Cron;

use Core\Data\Shape;

abstract class AbstractPrequalificationMiddleware
{

    /**
     * @param int $id
     * @return array
     */
    public abstract function checkStatus(int $id): array;
}
