<?php
use Core\System\Environment as E;

return [
    "handlers" => [
        "shutdown" => [function() {  }]
    ],
    "website_id" => [
        "clink" => intval(E::get("WEBSITE_CLINK_ID", 1)),
        "prosper" => intval(E::get("WEBSITE_PROSPER_ID", 2)),
    ],
];
