<?php

use Core\Config;
use Core\Service\S3Service;
use Email\Service\EloquentService;

return [
    "eloquent" => new EloquentService(Config::getArray("eloquent.database")),
    "s3" => new S3Service(Config::getArray("services.aws.s3")),
];
