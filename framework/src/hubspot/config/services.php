<?php

use Core\Service\HubspotService;
use Core\Config;

return [
    "prosper_hubspot" => new HubspotService(Config::getArray("services.hubspot.prosper")),
];
