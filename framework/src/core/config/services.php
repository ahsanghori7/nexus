<?php

use Core\Service\RestService;
use Core\Config;
use Core\Service\SqsService;

$account = new RestService(Config::getArray("services.account"));
$account_v2  = clone $account;
$account_v2->set("url", str_replace("v1", "v2", $account_v2->get("url")));

return [
    "account"    => $account,
    "account_v2" => $account_v2,
    "project"  => new RestService(Config::getArray("services.project")),
    "document"  => new RestService(Config::getArray("services.document")),
    "vertex"  => new RestService(Config::getArray("services.vertex")),
    "comms"    => new RestService(Config::getArray("services.comms")),
    "hubspot_prosper"  => new RestService(Config::getArray("services.hubspot.prosper")),
    "hubspot_clink"  => new RestService(Config::getArray("services.hubspot.clink")),
    "legacy"         => new RestService(Config::getArray("services.legacy")),
    "company_house"  => new RestService(Config::getArray("services.company_house")),
    "stripe"  => new \Core\Service\StripeService(Config::getArray("services.stripe")),
    "analytics"  => new RestService(Config::getArray("services.analytics")),
    "hubspot" => new RestService(Config::getArray("services.hubspot.framework")),
    "google_maps" => new RestService(Config::getArray("services.google.maps")),
    "email" => new RestService(Config::getArray("services.email")),
    "sqs" => new SqsService(Config::getArray("services.aws.sqs")),
];
