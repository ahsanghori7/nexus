<?php

use Core\Service\S3Service;
use Core\Config;

return [
    "s3" => new S3Service(Config::getArray("services.aws.s3"))
];
