<?php

namespace Prosper\Form;

use Core\Data\Shape\Validation as ShapeValidation;
use Core\Config;
use Core\Data\Validator;
use Core\Middleware\Exception as MiddlewareException;


class Validation
{
    /**
     * @var array<string, array<string,mixed>>
     */
    protected static array $forms = [
        "login" => [
            "username" => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            "password" => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen" ],
                "optional" => false
            ],
            "app" => [
                "type"  => "string",
                "optional" => true
            ],
        ],
        "password_reset" => [
            'email'      => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ]
        ],
        "new_password" => [
            'password'      => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'token'      => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ]
        ],
        "signup" => [
            'company_name'    => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'company_address' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'registered_company_number' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'email' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'password' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'firstname' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'lastname'  => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'mailing_list_consent' => [
                "type"  => "string",
                "optional" => true
            ],
            'terms_agree'   => [
                "type"  => "string",
                "optional" => false
            ],
            'privacy_agree'   => [
                "type"  => "string",
                "optional" => false
            ]
        ],
        "signup_anz" => [
            'company_name'    => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'registered_company_number' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'email' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'password' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'firstname' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'lastname'  => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'mailing_list_consent' => [
                "type"  => "string",
                "optional" => true
            ],
            'terms_agree'   => [
                "type"  => "string",
                "optional" => false
            ],
            'privacy_agree'   => [
                "type"  => "string",
                "optional" => false
            ]
        ],
        "opt_in" => [
            "token" => [
                "type"  => "string",
                "optional" => true
            ],
            "huid" => [
                "type"  => "string",
                "optional" => true
            ],
            "phone_number" => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
        ],
        "supply_chain_portal" => [
            'company_name'    => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'company_address' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'registered_company_number' => [
                "type"  => "string",
                "optional" => true
            ],
            'contact_name' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'email'      => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'telephone'  => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'password'   => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
        ],
        "team_manager" => [
            'firstname'    => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'lastname' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'password'   => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
        ],
        "prosper_reference" => [
            'project'    => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'client' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'value'   => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'completion_date'   => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'description_of_works'   => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'email'      => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'summary' => [
                "type"  => "string",
                "optional" => true
            ],
        ],
    ];

    /**
     * @param string $id
     * @return ShapeValidation
     */
    public static function getSignature(string $id) : ShapeValidation {

        if(!isset(self::$forms[$id])) {
            throw new \Exception("Invalid form id $id");
        }

        return new ShapeValidation(self::$forms[$id]);
    }

    /**
     * @param string $referer
     * @return bool|void
     * @throws MiddlewareException
     */
    public static function isValidReferer(string $referer) {
        $domain  = parse_url($referer, PHP_URL_HOST);
        $domains = Config::getArray("signup_referer_domains");
        if(!$domain || !in_array($domain, $domains)) {
            throw new MiddlewareException("authError", "invalid form referer ( $referer )");
        }

        return true;
    }
}
