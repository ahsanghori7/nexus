<?php
declare(strict_types=1);

namespace Tests\Domain\ApiClient;

use App\Domain\ApiClient\ApiClient;
use PHPUnit\Framework\TestCase;

class ApiClientTest extends TestCase
{
    public function testVerifySecretMatchesArgon2idHash(): void
    {
        $client = (new ApiClient())->setData([
            'client_secret_hash' => password_hash('s3cr3t', PASSWORD_ARGON2ID),
        ]);

        $this->assertTrue($client->verifySecret('s3cr3t'));
        $this->assertFalse($client->verifySecret('wrong-secret'));
    }

    public function testVerifySecretFailsWhenHashMissingOrEmpty(): void
    {
        $this->assertFalse((new ApiClient())->verifySecret('anything'));
        $this->assertFalse((new ApiClient())->setData(['client_secret_hash' => ''])->verifySecret('anything'));
    }

    public function testIsActiveReflectsActiveColumn(): void
    {
        $this->assertTrue((new ApiClient())->setData(['active' => 1])->isActive());
        $this->assertTrue((new ApiClient())->setData(['active' => '1'])->isActive());
        $this->assertFalse((new ApiClient())->setData(['active' => 0])->isActive());
        $this->assertFalse((new ApiClient())->isActive());
    }

    public function testGetScopesDecodesJsonArray(): void
    {
        $client = (new ApiClient())->setData([
            'scopes' => json_encode(['projects:read', 'projects:write']),
        ]);

        $this->assertSame(['projects:read', 'projects:write'], $client->getScopes());
    }

    public function testGetScopesReturnsEmptyArrayForInvalidOrMissing(): void
    {
        $this->assertSame([], (new ApiClient())->getScopes());
        $this->assertSame([], (new ApiClient())->setData(['scopes' => ''])->getScopes());
        $this->assertSame([], (new ApiClient())->setData(['scopes' => 'not-json'])->getScopes());
    }

    public function testGetTokenTtlSecondsDefaultsWhenUnsetOrInvalid(): void
    {
        $this->assertSame(1800, (new ApiClient())->getTokenTtlSeconds());
        $this->assertSame(1800, (new ApiClient())->setData(['token_ttl_seconds' => 0])->getTokenTtlSeconds());
        $this->assertSame(1800, (new ApiClient())->setData(['token_ttl_seconds' => -5])->getTokenTtlSeconds());
        $this->assertSame(900, (new ApiClient())->setData(['token_ttl_seconds' => 900])->getTokenTtlSeconds());
    }

    public function testSecretHashIsNeverSerialised(): void
    {
        $client = (new ApiClient())->setData([
            'id' => 5,
            'client_id' => 'abc123',
            'client_secret_hash' => password_hash('s3cr3t', PASSWORD_ARGON2ID),
            'account_id' => 100,
            'scopes' => json_encode(['projects:read']),
        ]);

        $json = $client->jsonSerialize();

        $this->assertArrayNotHasKey('client_secret_hash', $json);
        $this->assertArrayHasKey('client_id', $json);
        $this->assertArrayHasKey('account_id', $json);
    }
}
