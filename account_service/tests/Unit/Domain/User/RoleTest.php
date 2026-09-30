<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\User;

use App\Domain\User\Role;
use PHPUnit\Framework\TestCase;

class RoleTest extends TestCase
{
    public function testRoleCanBeInstantiated(): void
    {
        $role = new Role();

        $this->assertInstanceOf(Role::class, $role);
    }

    public function testGetWhereInReturnsEmptyArrayWhenValuesEmpty(): void
    {
        $role = $this->getMockBuilder(Role::class)
            ->onlyMethods(['getDb', 'getName'])
            ->getMock();

        $role->method('getDb')->willReturn(new class {
            public static function getAll()
            {
                return ['should-not-be-called'];
            }
        });

        $role->method('getName')->willReturn('roles');

        $result = $role->getWhereIn('id', []);

        $this->assertSame([], $result);
    }

    public function testGetWhereInReturnsDataWhenValuesProvided(): void
    {
        $role = $this->getMockBuilder(Role::class)
            ->onlyMethods(['getDb', 'getName'])
            ->getMock();

        $role->method('getName')->willReturn('roles');

        $role->method('getDb')->willReturn(new class {
            public static function getAll($query, $params)
            {
                return [
                    ['id' => 1, 'label' => 'Admin'],
                    ['id' => 2, 'label' => 'User']
                ];
            }
        });

        $result = $role->getWhereIn('id', [1, 2]);

        $this->assertIsArray($result);
        $this->assertCount(2, $result);
    }
}
