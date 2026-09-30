<?php

namespace Tests\Domain\Account\SSO;

use PHPUnit\Framework\TestCase;
use App\Domain\Account\Provider\ProviderAccountMapping;

class ProviderAccountMappingTest extends TestCase
{
    public function testColumnsDefinition()
    {
        $mapping = new ProviderAccountMapping();
        $reflection = new \ReflectionClass($mapping);
        $property = $reflection->getProperty('columns');
        $property->setAccessible(true);
        $columns = $property->getValue($mapping);

        $this->assertArrayHasKey('account_id', $columns);
        $this->assertArrayHasKey('provider_id', $columns);
        $this->assertArrayHasKey('meta', $columns);
        $this->assertTrue($columns['provider_id']['required']);
        $this->assertFalse($columns['meta']['required']);
    }
}
