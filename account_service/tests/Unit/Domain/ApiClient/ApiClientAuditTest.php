<?php
declare(strict_types=1);

namespace Tests\Domain\ApiClient;

use App\Domain\ApiClient\ApiClientAudit;
use PHPUnit\Framework\TestCase;

class ApiClientAuditTest extends TestCase
{
    public function testSanitiseStripsSensitiveTopLevelKeys(): void
    {
        $clean = ApiClientAudit::sanitise([
            'grant_type' => 'client_credentials',
            'client_secret' => 'super-secret',
            'client_secret_hash' => '$argon2id$...',
            'access_token' => 'ey.jwt.token',
            'token' => 'opaque',
            'authorization' => 'Bearer xyz',
            'password' => 'p',
            'external_id' => 'IFS-PRJ-0042',
        ]);

        $this->assertArrayNotHasKey('client_secret', $clean);
        $this->assertArrayNotHasKey('client_secret_hash', $clean);
        $this->assertArrayNotHasKey('access_token', $clean);
        $this->assertArrayNotHasKey('token', $clean);
        $this->assertArrayNotHasKey('authorization', $clean);
        $this->assertArrayNotHasKey('password', $clean);

        $this->assertSame('client_credentials', $clean['grant_type']);
        $this->assertSame('IFS-PRJ-0042', $clean['external_id']);
    }

    public function testSanitiseIsCaseInsensitive(): void
    {
        $clean = ApiClientAudit::sanitise([
            'Authorization' => 'Bearer xyz',
            'Client_Secret' => 'nope',
            'keep' => 'ok',
        ]);

        $this->assertArrayNotHasKey('Authorization', $clean);
        $this->assertArrayNotHasKey('Client_Secret', $clean);
        $this->assertSame('ok', $clean['keep']);
    }

    public function testSanitiseRecursesIntoNestedArrays(): void
    {
        $clean = ApiClientAudit::sanitise([
            'meta' => [
                'client_secret' => 'leak',
                'nested' => [
                    'access_token' => 'leak',
                    'keep' => 'value',
                ],
            ],
        ]);

        $this->assertArrayNotHasKey('client_secret', $clean['meta']);
        $this->assertArrayNotHasKey('access_token', $clean['meta']['nested']);
        $this->assertSame('value', $clean['meta']['nested']['keep']);
    }

    public function testSanitiseHandlesEmptyPayload(): void
    {
        $this->assertSame([], ApiClientAudit::sanitise([]));
    }
}
