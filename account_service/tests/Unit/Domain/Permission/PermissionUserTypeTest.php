<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Permission;

use App\Domain\Permission\PermissionUserType;
use PHPUnit\Framework\TestCase;

final class PermissionUserTypeTest extends TestCase
{
    public function testPermissionUserTypeCanBeInstantiated(): void
    {
        $model = new PermissionUserType();

        $this->assertInstanceOf(PermissionUserType::class, $model);
    }

    public function testPermissionUserTypeHasCorrectColumns(): void
    {
        $model = new PermissionUserType();
        $reflection = new \ReflectionClass($model);
        $property = $reflection->getProperty('columns');
        $property->setAccessible(true);
        $columns = $property->getValue($model);

        $this->assertIsArray($columns);
        $this->assertArrayHasKey('id', $columns);
        $this->assertArrayHasKey('permission_id', $columns);
        $this->assertArrayHasKey('user_type_id', $columns);
        $this->assertArrayHasKey('is_checked', $columns);
    }

    public function testPermissionUserTypeIdColumnIsRequired(): void
    {
        $model = new PermissionUserType();
        $reflection = new \ReflectionClass($model);
        $property = $reflection->getProperty('columns');
        $property->setAccessible(true);
        $columns = $property->getValue($model);

        $this->assertTrue($columns['id']['required']);
        $this->assertSame('int', $columns['id']['type']);
    }

    public function testPermissionUserTypePermissionIdColumnIsRequired(): void
    {
        $model = new PermissionUserType();
        $reflection = new \ReflectionClass($model);
        $property = $reflection->getProperty('columns');
        $property->setAccessible(true);
        $columns = $property->getValue($model);

        $this->assertTrue($columns['permission_id']['required']);
        $this->assertSame('int', $columns['permission_id']['type']);
    }

    public function testPermissionUserTypeUserTypeIdColumnIsRequired(): void
    {
        $model = new PermissionUserType();
        $reflection = new \ReflectionClass($model);
        $property = $reflection->getProperty('columns');
        $property->setAccessible(true);
        $columns = $property->getValue($model);

        $this->assertTrue($columns['user_type_id']['required']);
        $this->assertSame('int', $columns['user_type_id']['type']);
    }

    public function testPermissionUserTypeIsCheckedColumnIsNotRequired(): void
    {
        $model = new PermissionUserType();
        $reflection = new \ReflectionClass($model);
        $property = $reflection->getProperty('columns');
        $property->setAccessible(true);
        $columns = $property->getValue($model);

        $this->assertFalse($columns['is_checked']['required']);
        $this->assertSame('bool', $columns['is_checked']['type']);
    }
}
