<?php

namespace Tests\Infrastructure\SNS;

use PHPUnit\Framework\TestCase;
use App\Infrastructure\SNS\SNSService;
use App\Infrastructure\Environment;
use Aws\Sns\SnsClient;

final class SNSServiceTest extends TestCase
{
    protected function setUp(): void
    {
        $this->resetEnvironmentValues();
    }

    protected function tearDown(): void
    {
        $this->resetEnvironmentValues();
    }

    public function testCanItBeConstructed(): void
    {
        $this->setEnvValues([
            'SNS_ENABLED' => false,
            'AWS_SNS_FEPA_TOPIC_URL' => 'arn:test',
            'AWS_SNS_REGION' => 'eu-west-1',
            'AWS_SNS_VERSION' => 'latest',
            'AWS_SNS_ACCESS_KEY_ID' => 'x',
            'AWS_SNS_SECRET_ACCESS_KEY' => 'y',
        ]);

        $service = new SNSService();

        $this->assertInstanceOf(SNSService::class, $service);
    }

    public function testDoesItNotPublishWhenSNSIsDisabled(): void
    {
        $this->setEnvValues([
            'SNS_ENABLED' => false,
            'AWS_SNS_FEPA_TOPIC_URL' => 'arn:test',
            'AWS_SNS_REGION' => 'eu-west-1',
            'AWS_SNS_VERSION' => 'latest',
            'AWS_SNS_ACCESS_KEY_ID' => 'x',
            'AWS_SNS_SECRET_ACCESS_KEY' => 'y',
        ]);

        $service = new SNSService();

        // Should do nothing and not throw
        $service->sendSSOLoginError([
            'account_id' => 1,
            'error' => 'test error',
        ]);

        $this->assertTrue(true);
    }

    public function testDoesItPublisheMessageWhenSNSIsEnabled(): void
    {
        $this->setEnvValues([
            'SNS_ENABLED' => true,
            'AWS_SNS_FEPA_TOPIC_URL' => 'arn:aws:sns:test',
            'AWS_SNS_REGION' => 'eu-west-1',
            'AWS_SNS_VERSION' => 'latest',
            'AWS_SNS_ACCESS_KEY_ID' => 'x',
            'AWS_SNS_SECRET_ACCESS_KEY' => 'y',
        ]);

        $service = new SNSService();

        // IMPORTANT: AWS SDK uses magic methods → must explicitly add publish()
        $snsClientMock = $this->getMockBuilder(SnsClient::class)
            ->disableOriginalConstructor()
            ->addMethods(['publish'])
            ->getMock();

        $snsClientMock
            ->expects($this->once())
            ->method('publish')
            ->with($this->callback(function (array $payload) {
                return
                    isset($payload['TopicArn']) &&
                    isset($payload['Message']) &&
                    isset($payload['Subject']);
            }));

        // Inject mocked client
        $this->setPrivateProperty($service, 'client', $snsClientMock);

        $service->sendSSOLoginError([
            'account_id' => 42,
            'provider' => 'azure',
            'state' => 'abc',
            'error' => 'Invalid token',
        ]);
    }

    public function testDoesItFormatSSOErrorMessage(): void
    {
        $this->setEnvValues([
            'SNS_ENABLED' => false,
            'AWS_SNS_FEPA_TOPIC_URL' => 'arn:test',
            'AWS_SNS_REGION' => 'eu-west-1',
            'AWS_SNS_VERSION' => 'latest',
            'AWS_SNS_ACCESS_KEY_ID' => 'x',
            'AWS_SNS_SECRET_ACCESS_KEY' => 'y',
        ]);

        $service = new SNSService();

        $method = new \ReflectionMethod(SNSService::class, 'formatSSOErrorMessage');
        $method->setAccessible(true);

        $message = $method->invoke($service, [
            'timestamp' => '2025-01-01 10:00:00',
            'account_id' => 99,
            'provider' => 'azure',
            'state' => 'xyz',
            'error' => 'Something broke',
        ]);

        $this->assertStringContainsString('SSO LOGIN ERROR DETECTED', $message);
        $this->assertStringContainsString('Account ID: 99', $message);
        $this->assertStringContainsString('Provider: azure', $message);
        $this->assertStringContainsString('Something broke', $message);
    }

    // --------------------------------------------------
    // Helpers
    // --------------------------------------------------

    private function resetEnvironmentValues(): void
    {
        $reflection = new \ReflectionClass(Environment::class);
        $property = $reflection->getProperty('values');
        $property->setAccessible(true);
        $property->setValue(null, []);
    }

    private function setEnvValues(array $values): void
    {
        $reflection = new \ReflectionClass(Environment::class);
        $property = $reflection->getProperty('values');
        $property->setAccessible(true);

        $current = $property->getValue();
        $property->setValue(null, array_merge($current, $values));
    }

    private function setPrivateProperty(object $object, string $property, mixed $value): void
    {
        $reflection = new \ReflectionClass($object);
        $prop = $reflection->getProperty($property);
        $prop->setAccessible(true);
        $prop->setValue($object, $value);
    }
}
