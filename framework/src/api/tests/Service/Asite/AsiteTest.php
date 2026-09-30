<?php

use Api\Model\Document\Provider\Provider;
use PHPUnit\Framework\TestCase;

class AsiteTest extends TestCase
{

    /**
     * @return void
     * @throws Exception
     */
    public function testXmlToArrayThrowException(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Failed to parse XML');
        Provider::getProvider("asite")->xmlToArray("WRONG XML");
    }

    /**
     * @return void
     * @throws Exception
     */
    public function testXmlToArray(): void
    {
        $provider = Provider::getProvider("asite");

        $this->assertSame($provider->xmlToArray('<?xml version="1.0" encoding="UTF-8"?>
            <test>
                <item>ABC</item>
            </test>
        '),
         ['item' => 'ABC']);

        $this->assertSame(
            $provider->xmlToArray('<?xml version="1.0" encoding="UTF-8"?>
            <test>
                <item>1</item>
                <item>2</item>
            </test>
        '),
         ['item' => ['1', '2']]);

        $this->assertSame($provider->xmlToArray('<?xml version="1.0" encoding="UTF-8"?>
            <test>
                <items>
                    <item>A1</item>
                    <item>A2</item>
                </items>
                <item>2</item>
            </test>
        '), [
            'items' => [
                'item' => ['A1', 'A2']
            ],
            'item' => '2'
        ]);

        $this->assertSame($provider->xmlToArray('<?xml version="1.0" encoding="UTF-8"?>
            <test>
                <items>
                    <item>A1</item>
                    <item>A2</item>
                </items>
                <item>2</item>
                <abc></abc>
                <tests>
                    <first>
                        <subfirst>First</subfirst>
                    </first>
                    <second>Second</second>
                </tests>
            </test>
        '), [
            'items' => [
                'item' => ['A1', 'A2']
            ],
            'item'  => '2',
            'abc'   => [],
            'tests' => [
                'first'  => ['subfirst' => 'First'],
                'second' => 'Second'
            ]
        ]);
    }

    /**
     * @return void
     */
    public function testGetProviderName(): void
    {
        $provider = Provider::getProvider("asite");
        $this->assertEquals("asite", $provider->getProviderName());

        $provider = Provider::getProvider("provider_not_exist");
        $this->assertNull($provider, 'Provider not exist should return null');

        $provider = Provider::getProvider("");
        $this->assertNull($provider, 'Provider not exist should return null');
    }

    /**
     * @return void
     */
    public function testGetStorageConfig(): void
    {
        $provider = Provider::getProvider("asite");
        $provider->setConfig([
            "new_key"     => "new_value",
            "another_key" => "another_value"
        ]);
        $this->assertEquals("new_value", $provider->getCredentialStorage()::getConfigKey("new_key"));
        $this->assertNotEquals("new_value", $provider->getCredentialStorage()::getConfigKey("another_key"));
        $this->assertEquals("another_value", $provider->getCredentialStorage()::getConfigKey("another_key"));
        $this->assertEquals(null, $provider->getCredentialStorage()::getConfigKey("key_not_exist"));
    }
}
