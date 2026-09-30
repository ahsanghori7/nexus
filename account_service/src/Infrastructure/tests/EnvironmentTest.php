<?php

namespace App\Infrastructure\Tests;
use \App\Infrastructure\Environment as E;

E::loadEnvFile(__DIR__, "test_envs");

class EnvironmentTest extends \PHPUnit\Framework\TestCase
{
    public function testCanGetDefault()
    {
        $this->assertEquals(
            E::getValue("DOESNT_EXISTS", false),
            false
        );

        $this->assertEquals(
            E::getValue("DOESNT_EXISTS", true),
            true
        );
    }

    public function testCanGetGroup()
    {

        $group = E::getValueGroup("TEST");
        $test = [
            "VALUE_ONE" => "test",
            "VALUE_TWO" => "test_two",
            "VALUE_THREE" => "test_three"
        ];
        $this->assertEquals($group, $test);
    }

    public function testCanCast()
    {
        $this->assertEquals(E::cast("1"), 1);
        $this->assertEquals(E::cast("1.0"), 1.0);
        $this->assertEquals(E::cast("true"), true);
        $this->assertEquals(E::cast("false"), false);
        $this->assertEquals(E::cast("test"), "test");
    }

    public function testGetValues()
    {
        $ref = new \ReflectionClass(\App\Infrastructure\Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        $prop->setValue([
            "TEST_VALUE_ONE" => "test",
            "TEST_VALUE_TWO" => "test_two",
            "TEST_VALUE_THREE" => "test_three",
        ]);

        $env = new \App\Infrastructure\Environment();

        $expected = [
            "TEST_VALUE_ONE" => "test",
            "TEST_VALUE_TWO" => "test_two",
            "TEST_VALUE_THREE" => "test_three",
        ];

        $this->assertEquals($expected, $env->getValues());
    }

    public function testIsDocker()
    {
        $ref = new \ReflectionClass(\App\Infrastructure\Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        $prop->setValue(["DOCKERISED" => true]);

        $this->assertTrue(\App\Infrastructure\Environment::isDocker());
    }

    public function testIsProduction()
    {
        $ref = new \ReflectionClass(\App\Infrastructure\Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);

        // case 1: no ENVIRONMENT set => true
        $prop->setValue([]);
        $this->assertTrue(\App\Infrastructure\Environment::isProduction());

        // case 2: ENVIRONMENT = production => true
        $prop->setValue(["ENVIRONMENT" => "production"]);
        $this->assertTrue(\App\Infrastructure\Environment::isProduction());

        // case 3: ENVIRONMENT = something else => false
        $prop->setValue(["ENVIRONMENT" => "development"]);
        $this->assertFalse(\App\Infrastructure\Environment::isProduction());
    }
}
