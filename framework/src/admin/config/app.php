<?php
use Core\System\Environment as E;
use Core\Data\Shape;
use Core\Data\Shape\Mixin;
use Core\Util\Url;

$app = [];
foreach(['prequalification','company_profile','analytics'] as $service){
    $app += Core\System\Control::loadAppFile($service, 'config/app.php');
}


return array_merge(
    [
        "react_url" => E::get("REACT_APP_URL"),
        "cookies"  => [
            "session" =>  (new Shape(
                ["cookie_domain" => E::get("ADMIN_COOKIE_DOMAIN_URL","c-link.com"), "name" => E::get("SESSION_COOKIE_NAME", "token")],
                ["expires" => new Mixin(function($shape) {
                    return time()+60*60*24*E::get("COOKIE_EXPIRY", 30);
                })]
            )),
        ],
        "handlers" => [
            "shutdown" => [function() {  }]
        ],
        "website_id" => [
            "clink" => intval(E::get("WEBSITE_CLINK_ID", 1)),
            "prosper" => intval(E::get("WEBSITE_PROSPER_ID", 2)),
        ],
        "site_favicon" => [
            [
                "image" => E::get("SITE_FAVICON_ADMIN_32X32_IMAGE"),
                "sizes" => E::get("SITE_FAVICON_ADMIN_32X32_SIZES"),
                "rel"   => E::get("SITE_FAVICON_ADMIN_32X32_REL")
            ],
            [
                "image" => E::get("SITE_FAVICON_ADMIN_192x192_IMAGE"),
                "sizes" => E::get("SITE_FAVICON_ADMIN_192X192_SIZES"),
                "rel"   => E::get("SITE_FAVICON_ADMIN_192X192_REL")
            ],
            [
                "image" => E::get("SITE_FAVICON_ADMIN_APPLE_TOUCH_IMAGE"),
                "rel"   => E::get("SITE_FAVICON_ADMIN_APPLE_TOUCH_REL"),
                "sizes" => E::get("SITE_FAVICON_ADMIN_APPLE_TOUCH_SIZES"),
            ]
        ]
    ],
    $app,
    [
        "site_url"  => E::get("ADMIN_SITE_URL"),
        "prosper_site_url"  => E::get("PROSPER_SITE_URL")
    ]
);
