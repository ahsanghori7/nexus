<?php

namespace Prequalification\Form;

use Core\Data\Shape\Validation as ShapeValidation;
use Core\Data\Validator;

class Validation
{
    /**
     * @var array<string, array<string,mixed>>
     */
    protected static array $forms = [
        "work_reference" => [
            "project_name" => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen"],
                "optional" => false
            ],
            "client_name" => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen" ],
                "optional" => false
            ],
            "contract_value" => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen" ],
                "optional" => false
            ],
            "contact_name" => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen" ],
                "optional" => false
            ],
            "contact_email" => [
                "type"  => "string",
                "test" => [
                    "not_empty" => "strlen",
                    "is_email"  => [Validator::class, "isEmail"]
                ],
                "optional" => false
            ],
            "sow" => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen" ],
                "optional" => false
            ],
            "completion_date" => [
                "type"  => "string",
                "test" => [ "not_empty" => "strlen" ],
                "optional" => false
            ]
        ]
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
