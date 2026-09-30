<?php
declare(strict_types=1);

namespace Tests\Infrastructure\Security;

use PHPUnit\Framework\TestCase;
use App\Infrastructure\Security\SecretsManager;
use App\Infrastructure\Environment;
use Aws\SecretsManager\SecretsManagerClient;
use Aws\Result;
use Aws\Exception\AwsException;

class SecretsManagerTest extends TestCase
{
    private $mockClient;
    private $secretsManager;
    private array $originalEnvironmentValues = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->originalEnvironmentValues = $this->getEnvironmentValues();

        // Create a mock of the SecretsManagerClient with addMethods for magic methods
        $this->mockClient = $this->getMockBuilder(SecretsManagerClient::class)
            ->disableOriginalConstructor()
            ->addMethods(['getSecretValue'])
            ->getMock();

        // Inject the mock client into the SecretsManager
        SecretsManager::setClient($this->mockClient);

        // Create an instance of SecretsManager
        $this->secretsManager = new SecretsManager();
    }

    protected function tearDown(): void
    {
        // Reset the static client after each test
        SecretsManager::setClient(null);
        $this->setEnvironmentValues($this->originalEnvironmentValues);
        parent::tearDown();
    }

    public function testGetClientReturnsSameInstance()
    {
        $client1 = SecretsManager::getClient();
        $client2 = SecretsManager::getClient();

        $this->assertInstanceOf(SecretsManagerClient::class, $client1);
        $this->assertSame($client1, $client2, 'getClient should return the same instance');
    }

    public function testGetClientCreatesClientWhenNull()
    {
        $this->setEnvironmentValues(array_merge($this->originalEnvironmentValues, [
            'AWS_SM_VERSION' => '2017-10-17',
            'AWS_SM_REGION' => 'us-east-1',
            'AWS_SM_ACCESS_KEY_ID' => 'test-access-key',
            'AWS_SM_SECRET_ACCESS_KEY' => 'test-secret-key',
        ]));

        SecretsManager::setClient(null);

        $client = SecretsManager::getClient();

        $this->assertInstanceOf(SecretsManagerClient::class, $client);
        $this->assertSame($client, SecretsManager::getClient());
    }

    public function testSetClientReplacesClient()
    {
        $newMockClient = $this->getMockBuilder(SecretsManagerClient::class)
            ->disableOriginalConstructor()
            ->getMock();

        SecretsManager::setClient($newMockClient);

        $this->assertSame($newMockClient, SecretsManager::getClient());
    }

    public function testGetSecretReturnsJsonDecodedArray()
    {
        $secretName = 'test-secret';
        $secretData = ['client_secret' => 'secret123'];
        $secretString = json_encode($secretData);

        // Create a mock Result object
        $mockResult = new Result([
            'SecretString' => $secretString
        ]);

        $this->mockClient
            ->expects($this->once())
            ->method('getSecretValue')
            ->with(['SecretId' => $secretName])
            ->willReturn($mockResult);

        $result = $this->secretsManager->getSecret($secretName);

        $this->assertIsArray($result);
        $this->assertEquals($secretData, $result);
        $this->assertArrayHasKey('client_secret', $result);
    }

    public function testGetSecretReturnsPlainStringWhenNotJson()
    {
        $secretName = 'test-secret';
        $secretString = 'plain-text-secret-value';

        $mockResult = new Result([
            'SecretString' => $secretString
        ]);

        $this->mockClient
            ->expects($this->once())
            ->method('getSecretValue')
            ->with(['SecretId' => $secretName])
            ->willReturn($mockResult);

        $result = $this->secretsManager->getSecret($secretName);

        $this->assertIsString($result);
        $this->assertEquals($secretString, $result);
    }

    public function testGetSecretThrowsExceptionOnAwsError()
    {
        $secretName = 'test-secret';

        $awsException = $this->createMock(AwsException::class);

        $this->mockClient
            ->expects($this->once())
            ->method('getSecretValue')
            ->with(['SecretId' => $secretName])
            ->willThrowException($awsException);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Unable to retrieve configuration. Please contact support.');

        $this->secretsManager->getSecret($secretName);
    }

    private function setEnvironmentValues(array $values): void
    {
        $reflection = new \ReflectionClass(Environment::class);
        $property = $reflection->getProperty('values');
        $property->setAccessible(true);
        $property->setValue(null, $values);
    }

    private function getEnvironmentValues(): array
    {
        $reflection = new \ReflectionClass(Environment::class);
        $property = $reflection->getProperty('values');
        $property->setAccessible(true);
        return $property->getValue();
    }
}
