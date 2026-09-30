<?php

use Core\Service\HubspotService;
use Core\Service\LegacyService;
use Core\Config;
use Core\Service\S3Service;
use Core\Service\SnsService;

$services = [];
foreach(['prequalification','company_profile','analytics'] as $service){
    $services +=Core\System\Control::loadAppFile($service, 'config/services.php');
}

return [
    "prosper_hubspot" => new HubspotService(Config::getArray("services.hubspot.prosper")),
    "clink_hubspot" => new HubspotService(Config::getArray("services.hubspot.clink")),
    "legacy" => new LegacyService(Config::getArray("services.legacy")),
    "s3" => new S3Service(Config::getArray("services.aws.s3")),
    "sns" => new SnsService(Config::getArray("services.aws.sns")),
] + $services;
