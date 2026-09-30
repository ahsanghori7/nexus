<?php
declare(strict_types=1);

namespace Tests\Application\Actions\ApiClient;

require_once __DIR__ . '/../Support/ActionOverrides.php';

use App\Application\Actions\ApiClient\ApiClientAction;
use App\Infrastructure\Persistence\DB;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\Application\Actions\Support\PhpInput;
use Tests\TestCase;
use Tests\TestDoubles\FakeRedBean;

class ApiClientActionTest extends TestCase
{
    private ApiClientAction $action;

    protected function setUp(): void
    {
        parent::setUp();
        FakeRedBean::reset();
        DB::addConnection('r', FakeRedBean::class);
        PhpInput::clear();
        $this->action = new ApiClientAction($this->createMock(LoggerInterface::class));
    }

    protected function tearDown(): void
    {
        PhpInput::clear();
        parent::tearDown();
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

    private function decode(ResponseInterface $response): array
    {
        return json_decode((string) $response->getBody(), true) ?? [];
    }

    public function testAuthenticateReturnsContextForValidCredentials(): void
    {
        $this->stubClientRow();
        PhpInput::set(json_encode(['client_id' => 'PUBLICCLIENTID0000000000000000AA', 'client_secret' => 's3cr3t']));

        $response = $this->action->authenticate(
            $this->createRequest('POST', '/v1/api_client/authenticate'),
            new Response(),
            []
        );

        $this->assertSame(200, $response->getStatusCode());
        $data = $this->decode($response)['data'];
        $this->assertSame(42, $data['id']);
        $this->assertSame(100, $data['account_id']);
        $this->assertSame(['projects:read', 'projects:write'], $data['scopes']);
        $this->assertArrayNotHasKey('client_secret_hash', $data);
    }

    public function testAuthenticateReturns401ForWrongSecret(): void
    {
        $this->stubClientRow();
        PhpInput::set(json_encode(['client_id' => 'PUBLICCLIENTID0000000000000000AA', 'client_secret' => 'wrong']));

        $response = $this->action->authenticate($this->createRequest('POST', '/v1/api_client/authenticate'), new Response(), []);

        $this->assertSame(401, $response->getStatusCode());
    }

    public function testAuthenticateReturns401ForUnknownClient(): void
    {
        FakeRedBean::$getRowHook = static fn() => null;
        PhpInput::set(json_encode(['client_id' => 'nope', 'client_secret' => 's3cr3t']));

        $response = $this->action->authenticate($this->createRequest('POST', '/v1/api_client/authenticate'), new Response(), []);

        $this->assertSame(401, $response->getStatusCode());
    }

    public function testAuthenticateReturns401ForMissingCredentials(): void
    {
        PhpInput::set(json_encode([]));

        $response = $this->action->authenticate($this->createRequest('POST', '/v1/api_client/authenticate'), new Response(), []);

        $this->assertSame(401, $response->getStatusCode());
    }

    public function testLoadByIdReturnsContextWhenFound(): void
    {
        $this->stubClientRow();

        $response = $this->action->loadById($this->createRequest('GET', '/v1/api_client/42'), new Response(), ['id' => 42]);

        $this->assertSame(200, $response->getStatusCode());
        $data = $this->decode($response)['data'];
        $this->assertSame(42, $data['id']);
        $this->assertTrue($data['active']);
        $this->assertArrayNotHasKey('client_secret_hash', $data);
    }

    public function testLoadByIdReturns404WhenMissing(): void
    {
        FakeRedBean::$getRowHook = static fn() => null;

        $response = $this->action->loadById($this->createRequest('GET', '/v1/api_client/999'), new Response(), ['id' => 999]);

        $this->assertSame(404, $response->getStatusCode());
    }

    public function testWriteAuditReturnsIdAndSanitisesSnapshot(): void
    {
        $stored = null;
        FakeRedBean::$storeHook = static function ($bean) use (&$stored) {
            $stored = $bean;
            return 55;
        };
        PhpInput::set(json_encode([
            'jti' => 'jti-1',
            'method' => 'POST',
            'request_snapshot' => ['grant_type' => 'client_credentials', 'client_secret' => 'leak'],
            'response_code' => 200,
        ]));

        $response = $this->action->writeAudit($this->createRequest('POST', '/v1/api_client/5/audit'), new Response(), ['id' => 5]);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(55, $this->decode($response)['data']['id']);

        $snapshot = json_decode((string) $stored->request_snapshot, true);
        $this->assertSame('client_credentials', $snapshot['grant_type']);
        $this->assertArrayNotHasKey('client_secret', $snapshot);
    }

    public function testWriteAuditReturns400ForInvalidId(): void
    {
        $response = $this->action->writeAudit($this->createRequest('POST', '/v1/api_client/0/audit'), new Response(), ['id' => 0]);

        $this->assertSame(400, $response->getStatusCode());
    }
}
