<?php

use Core\Middleware\Hubspot;
use Core\Data\Shape;


Hubspot::createObject(
    "contacts", [
        "account.name"       => "company",
        "new_user.firstname" => "firstname",
        "new_user.lastname"  => "lastname",
        "account.email"      => "email",
        "account.mobile"     => "phone",
        "arrived_from_supply_chain"
    ], "prosper_hubspot"
)(
    new Shape([
        "account"  => new Shape(["name" => "test company", "email" => "rob@test_clink.com", "mobile" => "04444"]),
        "new_user" => new Shape(["firstname" => "Rob", "lastname" => "Dean"]),
        "arrived_from_supply_chain_" => false
    ])
);

//Hubspot::email()
