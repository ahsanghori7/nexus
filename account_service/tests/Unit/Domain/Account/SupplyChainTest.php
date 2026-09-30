<?php
declare(strict_types=1);

namespace Tests\Domain\Account;

use App\Domain\Account\Account;
use App\Domain\Account\SupplyChain;
use App\Infrastructure\Environment;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

class SupplyChainTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        DB::addConnection('r', FakeRedBean::class);
        FakeRedBean::reset();
        $this->setEnvironment([
            'CLINK_URL' => 'https://clink.test',
            'LOGO_MEDIA_HOST' => 'https://cdn.test/',
        ]);
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->setEnvironment([]);
    }

    public function testAppendStaticMediaUrlPrefixesHost(): void
    {
        $chain = new SupplyChain();
        $this->assertSame(
            'https://cdn.test/images/logo.png',
            $chain->appendStaticMediaUrl('/images/logo.png')
        );
    }

    public function testGetAccountFieldsMergesMetaOverrides(): void
    {
        $chain = new SupplyChain();
        $data = [
            'id' => 15,
            'name' => 'Acme',
            'logo' => 'row-logo.png',
            'type_id' => 3,
        ];
        $meta = [
            'slogan' => 'We build',
            'logo' => 'meta-logo.png',
            'website' => 'https://acme.test',
        ];

        $fields = $chain->getAccountFields($data, $meta);

        $this->assertSame('meta-logo.png', $fields['logo']);
        $this->assertSame('We build', $fields['slogan']);
        $this->assertSame('https://acme.test', $fields['website']);
        $this->assertSame('', $fields['landline']);
    }

    public function testAddRegionMappingAnnotatesTradeEntries(): void
    {
        $chain = new SupplyChain();
        $this->setTradeIndex($chain, [
            8 => [
                ['id' => 10, 'name' => 'Acme'],
                ['id' => 11, 'name' => 'Beta'],
            ],
        ]);

        $chain->addRegionMapping([
            10 => ['North', 'South'],
        ]);

        $tradeIndex = $this->getTradeIndex($chain);
        $this->assertSame(['North', 'South'], $tradeIndex[8][0]['region']);
        $this->assertSame(['*'], $tradeIndex[8][1]['region']);
    }

    public function testGetChildIdsReturnsUniqueIds(): void
    {
        $chain = new SupplyChain();
        $this->setTradeIndex($chain, [
            9 => [
                ['id' => 10],
                ['id' => 11],
                ['id' => 10],
            ],
        ]);

        $this->assertSame([10, 11], $chain->getChildIds());
    }

    public function testInitSubAccountFieldsBuildsRenderablePayload(): void
    {
        $account = (new Account())->setData([
            'meta' => json_encode([
                7 => [
                    'logo' => 'meta-logo.png',
                ],
            ]),
        ]);

        $row = [
            'id' => 22,
            'parent_id' => 7,
            'type_id' => 3,
            'logo' => 'row-logo.png',
            'name' => 'Acme',
        ];

        $chain = new SupplyChain();
        $fields = $chain->initSubAccountFields($account, $row);

        $this->assertSame('Acme', $fields['name']);
        $this->assertSame([], $fields['trades']);
        $this->assertSame(7, $fields['parent_id']);
        $this->assertStringContainsString('https://clink.test', $fields['logo']);
        $this->assertStringStartsWith('https://cdn.test/', $fields['logo']);
    }

    private function setTradeIndex(SupplyChain $chain, array $index): void
    {
        $prop = new \ReflectionProperty(SupplyChain::class, 'tradeIndex');
        $prop->setAccessible(true);
        $prop->setValue($chain, $index);
    }

    private function getTradeIndex(SupplyChain $chain): array
    {
        $prop = new \ReflectionProperty(SupplyChain::class, 'tradeIndex');
        $prop->setAccessible(true);
        return $prop->getValue($chain);
    }

    private function setEnvironment(array $values): void
    {
        $ref = new \ReflectionClass(Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        $prop->setValue(null, $values);
    }
}
