<?php

namespace Admin\Form;

use Core\Data\Shape\Validation as ShapeValidation;

class Validation
{
    /**
     * @var array<string, array<string,mixed>>
     */
    protected static array $forms = [
        "login" => [
            "username" => [
                "type"  => "string",
                "rules" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            "password" => [
                "type"  => "string",
                "rules" => [ "not_empty" => "strlen" ],
                "optional" => false
            ]
        ],
        "new_account" => [
            'company_name'    => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'company_email' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'company_address' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'company_landline' => [
                "type"  => "string",
                "optional" => true
            ],
            'company_website' => [
                "type"  => "string",
                "optional" => true
            ],
            'registered_company_number' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'first_name' => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'last_name'  => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'job_title'  => [
                "type"  => "string",
                "optional" => true
            ],
            'email'      => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            'display_name'  => [
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
            'subscription_id'   => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
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
}
