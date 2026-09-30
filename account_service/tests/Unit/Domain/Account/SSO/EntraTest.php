<?php
declare(strict_types=1);

namespace Tests\Domain\Account\SSO;

use App\Domain\Account\Provider\Login\Entra;
use App\Infrastructure\Environment;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\GuzzleClientStub;

class EntraTest extends TestCase
{
    /**
     * @var array<string, string>
     */
    private array $originalEnv = [];

    protected function setUp(): void
    {
        parent::setUp();
        GuzzleClientStub::register();
        GuzzleClientStub::reset();
        $this->originalEnv = $this->getEnvironmentValues();
        $this->setEnvironment(array_merge($this->originalEnv, [
            'ENTRA_CLIENT_ID' => 'client-123',
            'ENTRA_CLIENT_SECRET' => 'secret-456',
            'ENTRA_REDIRECT_URI' => 'https://app.test/callback',
            'ENTRA_AUTHORIZE_URL' => 'https://entra.example/authorize',
            'ENTRA_TOKEN_URL' => 'https://entra.example/token',
            'ENTRA_SCOPE' => 'openid profile email',

            'SNS_ENABLED' => '0',
            'AWS_SNS_FEPA_TOPIC_URL' => 'arn:aws:sns:us-east-1:123456789012:dummy-topic',
            'AWS_SNS_REGION' => 'us-east-1',
            'AWS_SNS_VERSION' => 'latest',
            'AWS_SNS_ACCESS_KEY_ID' => 'dummy-key',
            'AWS_SNS_SECRET_ACCESS_KEY' => 'dummy-secret',
        ]));
    }

    protected function tearDown(): void
    {
        $this->setEnvironment($this->originalEnv);
        GuzzleClientStub::reset();
        parent::tearDown();
    }

    public function testGetRedirectUrlUsesEnvironmentConfiguration(): void
    {
        $entra = new Entra();

        $url = $entra->get_redirect_url(0);
        $this->assertStringStartsWith('https://entra.example/authorize?', $url);

        $parts = parse_url($url);
        $this->assertSame('https', $parts['scheme'] ?? null);
        $this->assertSame('entra.example', $parts['host'] ?? null);
        $this->assertSame('/authorize', $parts['path'] ?? null);

        parse_str($parts['query'] ?? '', $query);
        $this->assertSame('client-123', $query['client_id'] ?? null);
        $this->assertSame('code', $query['response_type'] ?? null);
        $this->assertSame('https://app.test/callback', $query['redirect_uri'] ?? null);
        $this->assertSame('openid profile email', $query['scope'] ?? null);
        $this->assertSame('select_account', $query['prompt'] ?? null);
        $this->assertNotEmpty($query['state'] ?? null);
    }

    public function testLoginThrowsWhenCodeMissing(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Error logging in with Entra: No code provided');

        (new TestableEntra())->login([]);
    }

    public function testLoginThrowsWhenIdTokenMissing(): void
    {
        GuzzleClientStub::queueResponse(new Response(200, [], json_encode(['access_token' => 'abc', 'id_token' => null])));

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Error logging in with Entra: No JWT found in Entra response');

        (new TestableEntra())->login(['code' => 'valid-code']);
    }

    public function testLoginWrapsHttpClientExceptions(): void
    {
        GuzzleClientStub::queueException(new \RuntimeException('boom'));

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Error logging in with Entra: boom');

        (new TestableEntra())->login(['code' => 'valid-code']);
    }

    public function testLoginReturnsTrueWithValidResponse(): void
    {
        GuzzleClientStub::queueResponse(new Response(200, [], json_encode(['id_token' => 'header.payload.signature'])));

        $entra = new TestableEntra();
        $entra->nextDecodedPayload = [
            'aud' => 'client-123',
            'preferred_username' => 'user@example.test',
        ];

        $result = $entra->login(['code' => 'valid-code', 'app' => 'prosper']);

        $this->assertTrue($result);
        $this->assertSame(['header.payload.signature'], $entra->decodeJwtCalls);
        $this->assertSame(
            [
                [
                    [
                        'aud' => 'client-123',
                        'preferred_username' => 'user@example.test',
                    ],
                    'prosper',
                ],
            ],
            $entra->validateAndLoginCalls
        );

        $this->assertCount(1, GuzzleClientStub::$requests);
        $this->assertSame('https://entra.example/token', GuzzleClientStub::$requests[0]['url']);
        $this->assertSame('valid-code', GuzzleClientStub::$requests[0]['options']['form_params']['code']);
        $this->assertSame('client-123', GuzzleClientStub::$requests[0]['options']['form_params']['client_id']);
        $this->assertSame('secret-456', GuzzleClientStub::$requests[0]['options']['form_params']['client_secret']);
    }

    public function testValidateAcceptsMatchingAudience(): void
    {
        $entra = new Entra();

        $this->assertTrue($entra->validate(['aud' => 'client-123']));
    }

    public function testValidateRejectsMismatchedAudience(): void
    {
        $entra = new Entra();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid token: incorrect audience');

        $entra->validate(['aud' => 'other-client']);
    }

    public function testGetUserEmailReturnsPreferredUsername(): void
    {
        $entra = new Entra();

        $this->assertSame('viewer@example.test', $entra->getUserEmail(['preferred_username' => 'viewer@example.test']));
    }

    public function testGetUserEmailThrowsWhenMissing(): void
    {
        $entra = new Entra();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('No email found in SSO Login Data');

        $entra->getUserEmail([]);
    }

    /**
     * @param array<string, string> $values
     */
    private function setEnvironment(array $values): void
    {
        $ref = new \ReflectionClass(Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        $prop->setValue(null, $values);
    }

    /**
     * @return array<string, string>
     */
    private function getEnvironmentValues(): array
    {
        $ref = new \ReflectionClass(Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        /** @var array<string, string>|null $values */
        $values = $prop->getValue();

        return $values ?? [];
    }
}

class TestableEntra extends Entra
{
    /**
     * @var array<string, mixed>
     */
    public array $nextDecodedPayload = [];

    /**
     * @var array<int, string>
     */
    public array $decodeJwtCalls = [];

    /**
     * @var array<int, array{array<string, mixed>, string}>
     */
    public array $validateAndLoginCalls = [];

    public bool $validateAndLoginReturn = true;

    public function decodeJwt(string $jwt): array
    {
        $this->decodeJwtCalls[] = $jwt;
        return $this->nextDecodedPayload ?: ['aud' => '', 'preferred_username' => ''];
    }

    public function validateAndLoginUser(array $data, string $app = ''): bool
    {
        $this->validateAndLoginCalls[] = [$data, $app];
        return $this->validateAndLoginReturn;
    }
}
