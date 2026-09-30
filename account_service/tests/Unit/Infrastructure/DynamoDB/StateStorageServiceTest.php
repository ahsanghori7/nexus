<?php

namespace Tests\Unit\Infrastructure\DynamoDB;

use PHPUnit\Framework\TestCase;
use App\Infrastructure\DynamoDB\StateStorageService;
use App\Infrastructure\SNS\SNSService;
use App\Infrastructure\Environment;
use Aws\DynamoDb\DynamoDbClient;
use Aws\DynamoDb\Exception\DynamoDbException;
use Aws\CommandInterface;

final class StateStorageServiceTest extends TestCase
{
    protected function setUp(): void
    {
        $this->resetEnvironmentValues();

        $this->setEnvValues([
            'AWS_DYNAMO_TABLE_NAME' => 'test-table',
        ]);
    }

    protected function tearDown(): void
    {
        $this->resetEnvironmentValues();
    }

    public function testItStoresValueSuccessfully(): void
    {
        $dynamoMock = $this->getMockBuilder(DynamoDbClient::class)
            ->disableOriginalConstructor()
            ->addMethods(['putItem'])
            ->getMock();

        $dynamoMock
            ->expects($this->once())
            ->method('putItem')
            ->with($this->callback(function (array $payload) {
                return
                    $payload['TableName'] === 'test-table' &&
                    isset($payload['Item']['state']) &&
                    isset($payload['Item']['accountId']) &&
                    isset($payload['Item']['expires_at']);
            }));

        $snsMock = $this->createMock(SNSService::class);
        $snsMock->expects($this->never())->method('sendSSOLoginError');

        $service = new StateStorageService($dynamoMock, $snsMock);

        $service->store('state', 'abc', 'accountId', '123');

        $this->assertTrue(true); // no exception = success
    }

    public function testItSendsSNSAndThrowsExceptionWhenStoreFails(): void
    {
        $dynamoMock = $this->getMockBuilder(DynamoDbClient::class)
            ->disableOriginalConstructor()
            ->addMethods(['putItem'])
            ->getMock();

        $dynamoMock
            ->method('putItem')
            ->willThrowException(
                new DynamoDbException(
                    'fail',
                    $this->createMock(CommandInterface::class)
                )
            );

        $snsMock = $this->createMock(SNSService::class);
        $snsMock
            ->expects($this->once())
            ->method('sendSSOLoginError')
            ->with($this->arrayHasKey('error'));

        $service = new StateStorageService($dynamoMock, $snsMock);

        $this->expectException(\Exception::class);

        $service->store('state', 'abc', 'accountId', '123');
    }

    public function testItFetchesStringValueSuccessfully(): void
    {
        $dynamoMock = $this->getMockBuilder(DynamoDbClient::class)
            ->disableOriginalConstructor()
            ->addMethods(['getItem'])
            ->getMock();

        $dynamoMock
            ->method('getItem')
            ->willReturn([
                'Item' => [
                    'value' => ['S' => 'test@example.com'],
                ],
            ]);

        $snsMock = $this->createMock(SNSService::class);

        $service = new StateStorageService($dynamoMock, $snsMock);

        $result = $service->fetch('state', 'abc', 'value');

        $this->assertSame('test@example.com', $result);
    }

    public function testItFetchesNumericValueSuccessfully(): void
    {
        $dynamoMock = $this->getMockBuilder(DynamoDbClient::class)
            ->disableOriginalConstructor()
            ->addMethods(['getItem'])
            ->getMock();

        $dynamoMock
            ->method('getItem')
            ->willReturn([
                'Item' => [
                    'value' => ['N' => '42'],
                ],
            ]);

        $snsMock = $this->createMock(SNSService::class);

        $service = new StateStorageService($dynamoMock, $snsMock);

        $result = $service->fetch('state', 'abc', 'value');

        $this->assertSame('42', $result);
    }

    public function testItReturnsNullWhenItemDoesNotExist(): void
    {
        $dynamoMock = $this->getMockBuilder(DynamoDbClient::class)
            ->disableOriginalConstructor()
            ->addMethods(['getItem'])
            ->getMock();

        $dynamoMock
            ->method('getItem')
            ->willReturn([]);

        $snsMock = $this->createMock(SNSService::class);

        $service = new StateStorageService($dynamoMock, $snsMock);

        $this->assertNull(
            $service->fetch('state', 'abc', 'value')
        );
    }

    public function testItSendsSNSAndThrowsExceptionWhenFetchFails(): void
    {
        $dynamoMock = $this->getMockBuilder(DynamoDbClient::class)
            ->disableOriginalConstructor()
            ->addMethods(['getItem'])
            ->getMock();

        $dynamoMock
            ->method('getItem')
            ->willThrowException(
                new DynamoDbException(
                    'fail',
                    $this->createMock(CommandInterface::class)
                )
            );

        $snsMock = $this->createMock(SNSService::class);
        $snsMock
            ->expects($this->once())
            ->method('sendSSOLoginError');

        $service = new StateStorageService($dynamoMock, $snsMock);

        $this->expectException(\Exception::class);

        $service->fetch('state', 'abc', 'value');
    }

    public function testItInitializesDefaultClientsInConstructor(): void
    {
        $dynamoMock = $this->getMockBuilder(DynamoDbClient::class)
            ->disableOriginalConstructor()
            ->getMock();

        $snsMock = $this->getMockBuilder(SNSService::class)
            ->disableOriginalConstructor()
            ->getMock();

        $service = new StateStorageService($dynamoMock, $snsMock);

        $reflection = new \ReflectionClass($service);

        $clientProp = $reflection->getProperty('client');
        $clientProp->setAccessible(true);

        $snsProp = $reflection->getProperty('snsService');
        $snsProp->setAccessible(true);

        $this->assertSame($dynamoMock, $clientProp->getValue($service));
        $this->assertSame($snsMock, $snsProp->getValue($service));
    }

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

        $current = $property->getValue() ?? [];
        $property->setValue(null, array_merge($current, $values));
    }
}
