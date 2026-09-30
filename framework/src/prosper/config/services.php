<?php

use Core\Service\GoogleMapsService;
use Core\Service\HubspotService;
use Core\Service\LegacyService;
use Core\Config;
use Core\Service\S3Service;
use Core\Service\SqsService;
use Core\Service\SnsService;
use Analytics\EloquentService;

return [
    "prosper_hubspot" => new HubspotService(Config::getArray("services.hubspot.prosper")),
    "clink_hubspot" => new HubspotService(Config::getArray("services.hubspot.clink")),
    "legacy" => new LegacyService(Config::getArray("services.legacy")),
    "s3" => new S3Service(Config::getArray("services.aws.s3")),
    "sqs" => new SqsService(Config::getArray("services.aws.sqs")),
    "sns" => new SnsService(Config::getArray("services.aws.sns")),
    "eloquent" => new EloquentService(Config::getArray("eloquent.database")),
    "google_maps" => new GoogleMapsService(Config::getArray("services.google.maps")),
];
