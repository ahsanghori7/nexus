<?php

use SupplyChain\EloquentService;
use Core\Config;

return [
    "eloquent" => new EloquentService(Config::getArray("database"))
];
