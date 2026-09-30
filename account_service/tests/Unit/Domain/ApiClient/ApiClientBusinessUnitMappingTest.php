<?php

declare(strict_types=1);

namespace Tests\Domain\ApiClient;

use App\Domain\ApiClient\ApiClientBusinessUnitMapping;
use PHPUnit\Framework\TestCase;

class ApiClientBusinessUnitMappingTest extends TestCase
{
    public function testTableNameIsDerivedFromClassName(): void
    {
        $this->assertSame('api_client_business_unit_mapping', (new ApiClientBusinessUnitMapping())->getName());
    }

    public function testIsActiveReflectsActiveColumn(): void
    {
        $this->assertTrue((new ApiClientBusinessUnitMapping())->setData(['active' => 1])->isActive());
        $this->assertTrue((new ApiClientBusinessUnitMapping())->setData(['active' => '1'])->isActive());
        $this->assertFalse((new ApiClientBusinessUnitMapping())->setData(['active' => 0])->isActive());
        $this->assertFalse((new ApiClientBusinessUnitMapping())->setData(['active' => '0'])->isActive());
    }

    public function testIsActiveDefaultsToFalseWhenUnset(): void
    {
        $this->assertFalse((new ApiClientBusinessUnitMapping())->isActive());
    }

    public function testColumnsCoverTheMappingContract(): void
    {
        $columns = array_keys((new ApiClientBusinessUnitMapping())->getColumns());

        foreach (['id', 'api_client_id', 'account_group_id', 'external_code', 'external_name', 'active'] as $column) {
            $this->assertContains($column, $columns);
        }
    }

    public function testClientAccountAndCodeAreRequired(): void
    {
        $columns = (new ApiClientBusinessUnitMapping())->getColumns();

        $this->assertTrue($columns['api_client_id']['required']);
        $this->assertTrue($columns['account_group_id']['required']);
        $this->assertTrue($columns['external_code']['required']);
        $this->assertTrue($columns['external_name']['required']);
    }

    public function testExternalCodeAndNameEnforceMaxLengths(): void
    {
        $columns = (new ApiClientBusinessUnitMapping())->getColumns();

        $this->assertSame('maxlength:50', $columns['external_code']['validate']);
        $this->assertSame('maxlength:150', $columns['external_name']['validate']);
    }

    public function testMappingSerialisesItsData(): void
    {
        $mapping = (new ApiClientBusinessUnitMapping())->setData([
            'id' => 3,
            'api_client_id' => 1,
            'account_group_id' => 50,
            'external_code' => '10',
            'external_name' => 'London',
            'active' => 1,
        ]);

        $json = $mapping->jsonSerialize();

        $this->assertSame(3, $mapping->getId());
        $this->assertSame('10', $json['external_code']);
        $this->assertSame(50, $json['account_group_id']);
    }
}
