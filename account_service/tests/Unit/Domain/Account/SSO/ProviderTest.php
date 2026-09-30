<?php

namespace Tests\Domain\Account\SSO;

use PHPUnit\Framework\TestCase;
use App\Domain\Account\Provider\Provider;
use App\Domain\Account\Provider\Login\Local;
use App\Domain\Account\Provider\Login\Entra;

class ProviderTest extends TestCase
{
    public function testColumnsDefinition()
    {
        $provider = new Provider();
        $reflection = new \ReflectionClass($provider);
        $property = $reflection->getProperty('columns');
        $property->setAccessible(true);
        $columns = $property->getValue($provider);

        $this->assertArrayHasKey('id', $columns);
        $this->assertArrayHasKey('label', $columns);
        $this->assertArrayHasKey('type_id', $columns);
        $this->assertArrayHasKey('created_at', $columns);
        $this->assertTrue($columns['label']['required']);
        $this->assertTrue($columns['type_id']['required']);
    }

    public function testGetProviderServiceReturnsLocalWhenNotLoaded()
    {
        $provider = $this->getMockBuilder(Provider::class)
            ->onlyMethods(['isLoaded'])
            ->getMock();

        $provider->method('isLoaded')->willReturn(false);

        $service = $provider->getProviderService('login');
        $this->assertInstanceOf(Local::class, $service);
    }

    public function testGetProviderServiceReturnsLocalWhenClassDoesNotExist()
    {
        $provider = $this->getMockBuilder(Provider::class)
            ->onlyMethods(['isLoaded', 'getData'])
            ->getMock();

        $provider->method('isLoaded')->willReturn(true);
        $provider->method('getData')->with('label')->willReturn('NonExistentProvider');

        $service = $provider->getProviderService('login');
        $this->assertInstanceOf(Local::class, $service);
    }

    public function testGetProviderServiceReturnsCorrectProviderClass()
    {
        $provider = $this->getMockBuilder(Provider::class)
            ->onlyMethods(['isLoaded', 'getData'])
            ->getMock();

        $provider->method('isLoaded')->willReturn(true);
        $provider->method('getData')->with('label')->willReturn('entra');

        $service = $provider->getProviderService('login');
        $this->assertInstanceOf(Entra::class, $service);
    }
}
