<?php

declare(strict_types=1);

namespace Tests\Domain\Account\SSO;

use App\Domain\Account\Provider\Login\Google;
use App\Infrastructure\Environment;
use App\Infrastructure\Security\SecretsManager;
use Aws\Result;
use Aws\SecretsManager\SecretsManagerClient;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use Tests\TestDoubles\GuzzleClientStub;

class GoogleTest extends TestCase
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
            'GOOGLE_CLIENT_ID' => 'client-123',
            'GOOGLE_CLIENT_SECRET' => 'secret-456',
            'GOOGLE_REDIRECT_URI' => 'https://app.test/callback',
            'GOOGLE_AUTHORIZE_URL' => 'https://accounts.google.com/o/oauth2/v2/auth',
            'GOOGLE_TOKEN_URL' => 'https://oauth2.googleapis.com/token',
            'GOOGLE_SCOPE' => 'openid profile email',

            'SNS_ENABLED' => '0',
            'AWS_SNS_FEPA_TOPIC_URL' => 'arn:aws:sns:us-east-1:123456789012:dummy-topic',
            'AWS_SNS_REGION' => 'us-east-1',
            'AWS_SNS_VERSION' => 'latest',
            'AWS_SNS_ACCESS_KEY_ID' => 'dummy-key',
            'AWS_SNS_SECRET_ACCESS_KEY' => 'dummy-secret',

            'AWS_DYNAMODB_VERSION' => 'latest',
            'AWS_DYNAMO_TABLE_NAME' => 'test-table',
            'AWS_DYNAMODB_REGION' => 'eu-west-2',

            'AWS_SM_REGION' => 'eu-west-2',
            'AWS_SM_VERSION' => 'latest',
        ]));
    }

    protected function tearDown(): void
    {
        $this->setEnvironment($this->originalEnv);
        GuzzleClientStub::reset();
        SecretsManager::setClient(null);
        parent::tearDown();
    }

    public function testGetRedirectUrlUsesEnvironmentConfiguration(): void
    {
        $google = new Google();

        $url = $google->get_redirect_url(0);
        $this->assertStringStartsWith('https://accounts.google.com/o/oauth2/v2/auth?', $url);

        $parts = parse_url($url);
        $this->assertSame('https', $parts['scheme'] ?? null);
        $this->assertSame('accounts.google.com', $parts['host'] ?? null);
        $this->assertSame('/o/oauth2/v2/auth', $parts['path'] ?? null);

        parse_str($parts['query'] ?? '', $query);
        $this->assertSame('client-123', $query['client_id'] ?? null);
        $this->assertSame('code', $query['response_type'] ?? null);
        $this->assertSame('https://app.test/callback', $query['redirect_uri'] ?? null);
        $this->assertSame('openid profile email', $query['scope'] ?? null);
        $this->assertSame('select_account', $query['prompt'] ?? null);
        $this->assertNotEmpty($query['state'] ?? null);
    }

    public function testGetRedirectUrlEncodesStateWithAccountIdInLocalEnvironment(): void
    {
        $google = new Google();
        $accountId = 12345;

        $url = $google->get_redirect_url($accountId);

        $parts = parse_url($url);
        parse_str($parts['query'] ?? '', $query);
        $state = $query['state'] ?? null;

        $this->assertNotEmpty($state);

        $stateData = json_decode(base64_decode($state), true);
        $this->assertSame($accountId, $stateData['account_id'] ?? null);
        $this->assertNotEmpty($stateData['nonce'] ?? null);
    }

    public function testLoginThrowsWhenCodeMissing(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Error logging in with Google: No code provided');

        (new TestableGoogle())->login([]);
    }

    public function testLoginThrowsWhenIdTokenMissing(): void
    {
        GuzzleClientStub::queueResponse(new Response(200, [], json_encode(['access_token' => 'abc', 'id_token' => null])));

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Error logging in with Google: No JWT found in Google response');

        (new TestableGoogle())->login(['code' => 'valid-code']);
    }

    public function testLoginWrapsHttpClientExceptions(): void
    {
        GuzzleClientStub::queueException(new \RuntimeException('boom'));

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Error logging in with Google: boom');

        (new TestableGoogle())->login(['code' => 'valid-code']);
    }

    public function testLoginReturnsTrueWithValidResponse(): void
    {
        GuzzleClientStub::queueResponse(new Response(200, [], json_encode(['id_token' => 'header.payload.signature'])));

        $google = new TestableGoogle();
        $google->nextDecodedPayload = [
            'aud' => 'client-123',
            'email' => 'user@example.test',
        ];

        $result = $google->login(['code' => 'valid-code', 'app' => 'prosper']);

        $this->assertTrue($result);
        $this->assertSame(['header.payload.signature'], $google->decodeJwtCalls);
        $this->assertSame(
            [
                [
                    [
                        'aud' => 'client-123',
                        'email' => 'user@example.test',
                    ],
                    'prosper',
                ],
            ],
            $google->validateAndLoginCalls
        );

        $this->assertCount(1, GuzzleClientStub::$requests);
        $this->assertSame('https://oauth2.googleapis.com/token', GuzzleClientStub::$requests[0]['url']);
        $this->assertSame('valid-code', GuzzleClientStub::$requests[0]['options']['form_params']['code']);
        $this->assertSame('client-123', GuzzleClientStub::$requests[0]['options']['form_params']['client_id']);
        $this->assertSame('secret-456', GuzzleClientStub::$requests[0]['options']['form_params']['client_secret']);
    }

    public function testValidateAcceptsMatchingAudience(): void
    {
        $google = new Google();

        $this->assertTrue($google->validate(['aud' => 'client-123']));
    }

    public function testValidateRejectsMismatchedAudience(): void
    {
        $google = new Google();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid token: incorrect audience');

        $google->validate(['aud' => 'other-client']);
    }

    public function testGetUserEmailReturnsEmail(): void
    {
        $google = new Google();

        $this->assertSame('viewer@example.test', $google->getUserEmail(['email' => 'viewer@example.test']));
    }

    public function testGetUserEmailThrowsWhenMissing(): void
    {
        $google = new Google();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('No email found in SSO Login Data');

        $google->getUserEmail([]);
    }

    public function testGetAccountIdFromStateInLocalEnvironment(): void
    {
        $google = new Google();

        $stateData = [
            'account_id' => 12345,
            'nonce' => 'random-nonce'
        ];
        $state = base64_encode(json_encode($stateData));

        $accountId = $google->getAccountIdFromState($state);

        $this->assertSame(12345, $accountId);
    }

    public function testGetAccountIdFromStateReturnsZeroWhenInvalid(): void
    {
        $google = new Google();

        $accountId = $google->getAccountIdFromState('invalid-base64-!!!');

        $this->assertSame(0, $accountId);
    }

    public function testSetMetaWithEmptyArrayUsesEnvironmentConfig(): void
    {
        $google = new Google();

        $google->setMeta([]);

        $url = $google->get_redirect_url(0);
        $parts = parse_url($url);
        parse_str($parts['query'] ?? '', $query);

        $this->assertSame('client-123', $query['client_id'] ?? null);
    }

    public function testConstructorThrowsWhenMetaIncomplete(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Incomplete meta configuration');

        new Google([
            'client_id' => 'abc',
            'accountId' => 99,
        ]);
    }

    public function testMetaConfigurationUsesSecretFromSecretsManager(): void
    {
        $awsClient = $this->createMock(SecretsManagerClient::class);

        $awsClient->method('__call')->willReturn(
            new Result([
                'SecretString' => json_encode([
                    'GOOGLE_CLIENT_SECRET' => 'meta-secret',
                ])
            ])
        );

        SecretsManager::setClient($awsClient);

        $google = new Google([
            'client_id' => 'meta-client',
            'secrets_arn' => 'arn:test',
            'redirect_uri' => 'https://meta.test/callback',
            'authorize_url' => 'https://meta.test/auth',
            'token_url' => 'https://meta.test/token',
            'scope' => 'email',
        ]);

        $url = $google->get_redirect_url(0);
        parse_str(parse_url($url, PHP_URL_QUERY), $query);

        $this->assertSame('meta-client', $query['client_id']);
    }

    public function testLoginSendsCorrectTokenRequest(): void
    {
        GuzzleClientStub::queueResponse(
            new Response(200, [], json_encode(['id_token' => 'jwt']))
        );

        $google = new TestableGoogle();
        $google->nextDecodedPayload = [
            'aud' => 'client-123',
            'email' => 'user@test.com',
        ];

        $google->login(['code' => 'abc', 'app' => 'web']);

        $request = GuzzleClientStub::$requests[0]['options']['form_params'];

        $this->assertSame('authorization_code', $request['grant_type']);
        $this->assertSame('openid profile email', $request['scope']);
    }

    public function testGetAccountIdFromStateUsesStorageInNonLocalEnv(): void
    {
        $this->setEnvironment(array_merge(
            $this->getEnvironmentValues(),
            [
                'ENVIRONMENT' => 'production',
                'AWS_DYNAMO_TABLE_NAME' => 'test-table',
                'AWS_DYNAMODB_REGION' => 'eu-west-2',
                'AWS_DYNAMODB_VERSION' => 'latest',

                'SNS_ENABLED' => '0',
                'AWS_SNS_FEPA_TOPIC_URL' => 'arn:test',
                'AWS_SNS_REGION' => 'us-east-1',
                'AWS_SNS_VERSION' => 'latest',
                'AWS_SNS_ACCESS_KEY_ID' => 'x',
                'AWS_SNS_SECRET_ACCESS_KEY' => 'y',
            ]
        ));

        $google = new Google();

        $this->assertSame(0, $google->getAccountIdFromState('some-state'));
    }

    public function testSecretManagerReturnsScalar(): void
    {
        $awsClient = $this->createMock(SecretsManagerClient::class);

        $awsClient->method('__call')->willReturn(
            new Result([
                'SecretString' => 'plain-secret',
            ])
        );

        SecretsManager::setClient($awsClient);

        $google = new Google([
            'client_id' => 'meta-client',
            'secrets_arn' => 'arn:test',
            'redirect_uri' => 'https://meta.test/callback',
            'authorize_url' => 'https://meta.test/auth',
            'token_url' => 'https://meta.test/token',
            'scope' => 'email',
        ]);

        $url = $google->get_redirect_url(0);
        parse_str(parse_url($url, PHP_URL_QUERY), $query);

        $this->assertSame('meta-client', $query['client_id']);
    }

    public function testSetMetaWithCompleteMetaUsesMetaConfiguration(): void
    {
        $awsClient = $this->createMock(SecretsManagerClient::class);
        $awsClient->method('__call')->willReturn(
            new Result(['SecretString' => json_encode(['GOOGLE_CLIENT_SECRET' => 'new-secret'])])
        );
        SecretsManager::setClient($awsClient);

        $google = new Google();

        $meta = [
            'client_id' => 'new-meta-client',
            'secrets_arn' => 'arn:aws:secretsmanager:us-east-1:123456789012:secret:new',
            'redirect_uri' => 'https://new.example.com/callback',
            'authorize_url' => 'https://new.google.com/auth',
            'token_url' => 'https://new.google.com/token',
            'scope' => 'openid',
        ];

        $google->setMeta($meta);
        $url = $google->get_redirect_url(0);

        parse_str(parse_url($url, PHP_URL_QUERY), $query);
        $this->assertSame('new-meta-client', $query['client_id']);
    }

    public function testValidateMetaThrowsWithEmptyStringValues(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Incomplete meta configuration');

        new Google([
            'client_id' => '',
            'secrets_arn' => 'arn:test',
            'redirect_uri' => 'https://test.com',
            'authorize_url' => 'https://test.com/auth',
            'token_url' => 'https://test.com/token',
            'scope' => 'openid',
            'accountId' => 789,
        ]);
    }

    public function testLoginThrowsWhenIdTokenIsEmptyString(): void
    {
        GuzzleClientStub::queueResponse(
            new Response(200, [], json_encode(['access_token' => 'abc', 'id_token' => '']))
        );

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Error logging in with Google: No JWT found in Google response');

        (new TestableGoogle())->login(['code' => 'valid-code']);
    }

    public function testLoginLogsErrorWithAccountIdAndState(): void
    {
        GuzzleClientStub::queueException(new \RuntimeException('network error'));

        try {
            (new TestableGoogle())->login([
                'code' => 'valid-code',
                'accountId' => 999,
                'state' => 'test-state-123',
            ]);
            $this->fail('Expected exception was not thrown');
        } catch (\Exception $e) {
            $this->assertStringContainsString('Error logging in with Google: network error', $e->getMessage());
        }
    }

    public function testGetUserEmailThrowsWhenEmailIsEmptyString(): void
    {
        $google = new Google();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('No email found in SSO Login Data');

        $google->getUserEmail(['email' => '']);
    }

    public function testGetAccountIdFromStateReturnsZeroWhenStateIsNotJson(): void
    {
        $google = new Google();

        $state = base64_encode('not-json-data');
        $accountId = $google->getAccountIdFromState($state);

        $this->assertSame(0, $accountId);
    }

    public function testGetConfigValueUsesDefaultWhenEnvNotSet(): void
    {
        $this->setEnvironment([
            'ENVIRONMENT' => 'local',
            'SNS_ENABLED' => '0',
            'AWS_SNS_FEPA_TOPIC_URL' => 'arn:test',
            'AWS_SNS_REGION' => 'us-east-1',
            'AWS_SNS_VERSION' => 'latest',
            'AWS_SNS_ACCESS_KEY_ID' => 'x',
            'AWS_SNS_SECRET_ACCESS_KEY' => 'y',
            'AWS_DYNAMODB_VERSION' => 'latest',
            'AWS_DYNAMO_TABLE_NAME' => 'test-table',
            'AWS_DYNAMODB_REGION' => 'eu-west-2',
            'AWS_SM_REGION' => 'eu-west-2',
            'AWS_SM_VERSION' => 'latest',
        ]);

        $google = new Google();
        $url = $google->get_redirect_url(0);

        $this->assertStringContainsString('https://login.microsoftonline.com', $url);
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

class TestableGoogle extends Google
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
        return $this->nextDecodedPayload ?: ['aud' => '', 'email' => ''];
    }

    public function validateAndLoginUser(array $data, string $app = ''): bool
    {
        $this->validateAndLoginCalls[] = [$data, $app];
        return $this->validateAndLoginReturn;
    }
}
