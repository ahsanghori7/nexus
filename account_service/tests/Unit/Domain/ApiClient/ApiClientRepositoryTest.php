<?php

declare(strict_types=1);

namespace Tests\Domain\ApiClient;

use App\Domain\ApiClient\ApiClient;
use App\Domain\ApiClient\ApiClientBusinessUnitMapping;
use App\Domain\ApiClient\ApiClientRepository;
use App\Infrastructure\Persistence\DB;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\FakeRedBean;

class ApiClientRepositoryTest extends TestCase
{
    private ApiClientRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        FakeRedBean::reset();
        DB::addConnection('r', FakeRedBean::class);
        $this->repository = new ApiClientRepository();
    }

    private function stubClientRow(array $overrides = []): void
    {
        $row = array_merge([
            'id' => 42,
            'provider_id' => 7,
            'name' => 'McLaren',
            'client_id' => 'PUBLICCLIENTID0000000000000000AA',
            'client_secret_hash' => password_hash('s3cr3t', PASSWORD_ARGON2ID),
            'account_id' => 100,
            'scopes' => json_encode(['projects:read', 'projects:write']),
            'active' => 1,
            'token_ttl_seconds' => 1800,
        ], $overrides);

        FakeRedBean::$getRowHook = static function (string $sql, array $params) use ($row) {
            return stripos($sql, 'from api_client') !== false ? $row : null;
        };
    }

    public function testAuthenticateReturnsClientForValidCredentials(): void
    {
        $this->stubClientRow();

        $client = $this->repository->authenticate('PUBLICCLIENTID0000000000000000AA', 's3cr3t');

        $this->assertInstanceOf(ApiClient::class, $client);
        $this->assertSame(42, $client->getId());
        $this->assertSame(['projects:read', 'projects:write'], $client->getScopes());
    }

    public function testAuthenticateReturnsNullForWrongSecret(): void
    {
        $this->stubClientRow();

        $this->assertNull($this->repository->authenticate('PUBLICCLIENTID0000000000000000AA', 'wrong-secret'));
    }

    public function testAuthenticateReturnsNullForUnknownClient(): void
    {
        FakeRedBean::$getRowHook = static fn() => null;

        $this->assertNull($this->repository->authenticate('does-not-exist', 's3cr3t'));
    }

    public function testUnknownClientAndWrongSecretAreIndistinguishable(): void
    {
        $this->stubClientRow();
        $wrongSecret = $this->repository->authenticate('PUBLICCLIENTID0000000000000000AA', 'wrong-secret');

        FakeRedBean::$getRowHook = static fn() => null;
        $unknownClient = $this->repository->authenticate('nope', 's3cr3t');

        $this->assertNull($wrongSecret);
        $this->assertNull($unknownClient);
        $this->assertSame($wrongSecret, $unknownClient);
    }

    public function testAuthenticateReturnsNullForInactiveClient(): void
    {
        $this->stubClientRow(['active' => 0]);

        $this->assertNull($this->repository->authenticate('PUBLICCLIENTID0000000000000000AA', 's3cr3t'));
    }

    public function testLoadByIdReturnsClientWhenFound(): void
    {
        $this->stubClientRow();

        $client = $this->repository->loadById(42);

        $this->assertInstanceOf(ApiClient::class, $client);
        $this->assertSame(42, $client->getId());
    }

    public function testLoadByIdReturnsNullWhenMissing(): void
    {
        FakeRedBean::$getRowHook = static fn() => null;

        $this->assertNull($this->repository->loadById(999));
    }

    public function testTouchLastUsedIssuesUpdate(): void
    {
        $this->repository->touchLastUsed(42);

        $execCalls = array_filter(
            FakeRedBean::$calls,
            static fn(array $call) => $call[0] === 'exec' && stripos($call[1], 'update api_client set last_used_at') !== false
        );
        $this->assertNotEmpty($execCalls);
    }

    public function testWriteAuditPersistsSanitisedSnapshotAndReturnsId(): void
    {
        $stored = null;
        FakeRedBean::$storeHook = static function ($bean) use (&$stored) {
            $stored = $bean;
            return 55;
        };

        $id = $this->repository->writeAudit([
            'api_client_id' => 42,
            'jti' => 'jti-1',
            'method' => 'POST',
            'endpoint' => '/api/partner/v1/oauth/token',
            'request_snapshot' => [
                'grant_type' => 'client_credentials',
                'client_secret' => 'leak-me',
            ],
            'response_code' => 200,
        ]);

        $this->assertSame(55, $id);
        $this->assertNotNull($stored);

        $snapshot = json_decode((string) $stored->request_snapshot, true);
        $this->assertSame('client_credentials', $snapshot['grant_type']);
        $this->assertArrayNotHasKey('client_secret', $snapshot);
    }

    public function testWriteAuditToleratesNonArraySnapshot(): void
    {
        $stored = null;
        FakeRedBean::$storeHook = static function ($bean) use (&$stored) {
            $stored = $bean;
            return 7;
        };

        $id = $this->repository->writeAudit([
            'api_client_id' => 42,
            'request_snapshot' => 'not-an-array',
        ]);

        $this->assertSame(7, $id);
        $this->assertSame([], json_decode((string) $stored->request_snapshot, true));
    }

    private function stubMappingRow(?array $overrides = []): void
    {
        $row = $overrides === null ? null : array_merge([
            'id' => 9,
            'api_client_id' => 42,
            'account_group_id' => 100,
            'external_code' => '10',
            'external_name' => 'London',
            'active' => 1,
        ], $overrides);

        FakeRedBean::$getRowHook = static function (string $sql, array $params) use ($row) {
            return stripos($sql, 'api_client_business_unit_mapping') !== false ? $row : null;
        };
    }

    public function testResolveBusinessUnitReturnsActiveMapping(): void
    {
        $this->stubMappingRow();

        $mapping = $this->repository->resolveBusinessUnit(42, '10');

        $this->assertInstanceOf(ApiClientBusinessUnitMapping::class, $mapping);
        $this->assertSame(9, $mapping->getId());
        $this->assertSame(100, (int) $mapping->getData('account_group_id'));
        $this->assertSame('London', $mapping->getData('external_name'));
    }

    public function testResolveBusinessUnitScopesQueryToClientAndCode(): void
    {
        $this->stubMappingRow();

        $this->repository->resolveBusinessUnit(42, '10');

        $mappingQueries = array_values(array_filter(
            FakeRedBean::$calls,
            static fn(array $call) => $call[0] === 'getRow'
                && stripos($call[1], 'api_client_business_unit_mapping') !== false
        ));

        $this->assertNotEmpty($mappingQueries);
        $this->assertSame([42, '10'], $mappingQueries[0][2]);
    }

    public function testResolveBusinessUnitReturnsNullForUnknownCode(): void
    {
        $this->stubMappingRow(null);

        $this->assertNull($this->repository->resolveBusinessUnit(42, 'NOPE'));
    }

    public function testResolveBusinessUnitReturnsNullForInactiveMapping(): void
    {
        $this->stubMappingRow(['active' => 0]);

        $this->assertNull($this->repository->resolveBusinessUnit(42, '10'));
    }

    public function testUnknownAndInactiveMappingsAreIndistinguishable(): void
    {
        $this->stubMappingRow(['active' => 0]);
        $inactive = $this->repository->resolveBusinessUnit(42, '10');

        $this->stubMappingRow(null);
        $unknown = $this->repository->resolveBusinessUnit(42, 'NOPE');

        $this->assertNull($inactive);
        $this->assertNull($unknown);
    }

    public function testListBusinessUnitsReturnsRowsForClient(): void
    {
        $rows = [
            ['id' => 9, 'external_code' => '10', 'external_name' => 'London', 'active' => 1],
            ['id' => 10, 'external_code' => '20', 'external_name' => 'Romania', 'active' => 0],
        ];
        FakeRedBean::$getAllHook = static function (string $sql, array $params) use ($rows) {
            return stripos($sql, 'api_client_business_unit_mapping') !== false ? $rows : [];
        };

        $result = $this->repository->listBusinessUnits(42);

        $this->assertCount(2, $result);
        $this->assertSame('London', $result[0]['external_name']);
        $this->assertSame(0, $result[1]['active']);
    }

    public function testListBusinessUnitsScopesQueryToClient(): void
    {
        FakeRedBean::$getAllHook = static fn() => [];

        $this->repository->listBusinessUnits(42);

        $queries = array_values(array_filter(
            FakeRedBean::$calls,
            static fn(array $call) => $call[0] === 'getAll'
                && stripos($call[1], 'api_client_business_unit_mapping') !== false
        ));

        $this->assertNotEmpty($queries);
        $this->assertSame([42], $queries[0][2]);
    }

    public function testListBusinessUnitsReturnsEmptyArrayWhenNoneConfigured(): void
    {
        FakeRedBean::$getAllHook = static fn() => [];

        $this->assertSame([], $this->repository->listBusinessUnits(42));
    }

    public function testListBusinessUnitsByAccountReturnsMappingsWithProvider(): void
    {
        FakeRedBean::$getAllHook = static fn() => [
            ['id' => 9, 'api_client_id' => 42, 'account_id' => 100, 'external_code' => '10', 'provider_id' => 3],
        ];

        $result = $this->repository->listBusinessUnitsByAccount(100);

        $this->assertCount(1, $result);
        $this->assertSame(9, $result[0]['id']);
        $this->assertSame(3, $result[0]['provider_id']);
    }

    public function testListBusinessUnitsByAccountIsScopedToTheAccount(): void
    {
        FakeRedBean::$getAllHook = static fn() => [];

        $this->repository->listBusinessUnitsByAccount(100);

        $queries = array_values(array_filter(
            FakeRedBean::$calls,
            static fn(array $call) => $call[0] === 'getAll'
                && stripos($call[1], 'api_client_business_unit_mapping') !== false
        ));

        $this->assertNotEmpty($queries);
        $this->assertSame([100], $queries[0][2]);
        // Business units are account groups, so the account is reached through the join.
        $this->assertStringContainsString('account_group', $queries[0][1]);
        $this->assertStringContainsString('g.account_id = ?', $queries[0][1]);
    }

    /**
     * A deactivated mapping or client must not authorise linking, so the
     * exclusion is asserted on the query itself.
     */
    public function testListBusinessUnitsByAccountExcludesInactiveMappingsAndClients(): void
    {
        FakeRedBean::$getAllHook = static fn() => [];

        $this->repository->listBusinessUnitsByAccount(100);

        $sql = FakeRedBean::$calls[0][1] ?? '';

        $this->assertStringContainsString('m.active = 1', $sql);
        $this->assertStringContainsString('c.active = 1', $sql);
    }

    public function testListBusinessUnitsByAccountReturnsEmptyArrayWhenNoneMapped(): void
    {
        FakeRedBean::$getAllHook = static fn() => [];

        $this->assertSame([], $this->repository->listBusinessUnitsByAccount(100));
    }
}
