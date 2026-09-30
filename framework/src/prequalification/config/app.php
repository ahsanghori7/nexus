<?php

use Core\System\Environment as E;

return [
    "site_url"      => E::get("PROSPER_SITE_URL"),
    "s3" => [
        "assets" => E::get("AWS_ASSETS_URL"),
        "documents" => E::get("AWS_DOCUMENTS_URL")
    ],
    "logo" => [
        'clink' => E::get("LOGO_CLINK_URL"),
        'account' => E::get("LOGO_ACCOUNT_URL"),
        'prosper' => E::get("LOGO_PROSPER_URL"),
    ],
    "pdf" => [
        "header" => E::get("PDF_HEADER_LOGO_URL"),
        "footer" => E::get("PDF_FOOTER_LOGO_URL"),
    ],
    "document" => [
        'save' => [
            'temp' => E::get("DOCUMENT_SAVE_DIRECTORY"),
            'permission' => E::get("DOCUMENT_SAVE_PERMISSION"),
            "tmp" =>  E::get("DOCUMENT_SAVE_TMP"),
        ],
    ],
    "handlers" => [
        "shutdown" => [function() {  }]
    ],
];
