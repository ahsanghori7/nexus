<?php

namespace Tests\Domain\Account\SSO\Provider;

use PHPUnit\Framework\TestCase;
use App\Domain\Account\Provider\Login\LoginServiceAbstract;
use App\Domain\User\User;
use App\Domain\User\Token;
use App\Domain\User\UserRepository;

class ProviderServiceAbstractConcrete extends LoginServiceAbstract
{
    public function get_redirect_url(int $accountId = 0): string { return 'redirect_url'; }
    public function login(array $data): bool { return true; }
    public function validate(array $data): bool { return true; }
    public function getUserEmail(array $data): string { return $data['email'] ?? ''; }
}

class ProviderServiceAbstractTest extends TestCase
{
    public function testDecodeJwtReturnsPayloadArray()
    {
        $payload = ['sub' => '123', 'email' => 'test@example.com'];
        $jwt = $this->generateJwt($payload);

        $service = new ProviderServiceAbstractConcrete();
        $result = $service->decodeJwt($jwt);

        $this->assertEquals($payload, $result);
    }

    public function testGetUserAndTokenAndIsLoggedIn()
    {
        $service = new ProviderServiceAbstractConcrete();

        $user = $this->createMock(User::class);
        $token = $this->createMock(Token::class);

        $reflection = new \ReflectionClass($service);
        $userProp = $reflection->getProperty('user');
        $userProp->setAccessible(true);
        $userProp->setValue($service, $user);

        $tokenProp = $reflection->getProperty('token');
        $tokenProp->setAccessible(true);
        $tokenProp->setValue($service, $token);

        $isLoggedInProp = $reflection->getProperty('isLoggedIn');
        $isLoggedInProp->setAccessible(true);
        $isLoggedInProp->setValue($service, true);

        $this->assertSame($user, $service->getUser());
        $this->assertSame($token, $service->getToken());
        $this->assertTrue($service->isLoggedIn());
    }

    public function testGetUserRepositoryReturnsConcreteRepository()
    {
        $service = new ProviderServiceAbstractConcrete();

        $this->assertInstanceOf(UserRepository::class, $service->getUserRepository());
    }

    public function testLoadUserReturnsUserIfLoaded()
    {
        $service = $this->getMockBuilder(ProviderServiceAbstractConcrete::class)
            ->onlyMethods(['getUserRepository'])
            ->getMock();

        $user = $this->createMock(User::class);
        $user->method('isLoaded')->willReturn(true);

        $repo = $this->createMock(UserRepository::class);
        $repo->method('getUser')->with('test@example.com')->willReturn($user);

        $service->method('getUserRepository')->willReturn($repo);

        $result = $service->loadUser('test@example.com');
        $this->assertSame($user, $result);
    }

    public function testLoadUserThrowsIfNotLoaded()
    {
        $service = $this->getMockBuilder(ProviderServiceAbstractConcrete::class)
            ->onlyMethods(['getUserRepository'])
            ->getMock();

        $user = $this->createMock(User::class);
        $user->method('isLoaded')->willReturn(false);

        $repo = $this->createMock(UserRepository::class);
        $repo->method('getUser')->with('notfound@example.com')->willReturn($user);

        $service->method('getUserRepository')->willReturn($repo);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('User Not Found');
        $service->loadUser('notfound@example.com');
    }

    public function testValidateAndLoginUserSuccess()
    {
        $service = $this->getMockBuilder(ProviderServiceAbstractConcrete::class)
            ->onlyMethods(['validate', 'loadUser', 'getUserRepository'])
            ->getMock();

        $service->method('validate')->willReturn(true);

        $user = $this->createMock(User::class);
        $service->method('loadUser')->willReturn($user);

        $token = $this->createMock(Token::class);
        $repo = $this->createMock(UserRepository::class);
        $repo->method('createSSOSession')->with($user, 'app')->willReturn($token);

        $service->method('getUserRepository')->willReturn($repo);

        $result = $service->validateAndLoginUser(['email' => 'test@example.com'], 'app');
        $this->assertTrue($result);

        $this->assertSame($user, $service->getUser());
        $this->assertSame($token, $service->getToken());
        $this->assertTrue($service->isLoggedIn());
    }

    public function testValidateAndLoginUserThrowsOnInvalid()
    {
        $service = $this->getMockBuilder(ProviderServiceAbstractConcrete::class)
            ->onlyMethods(['validate'])
            ->getMock();

        $service->method('validate')->willReturn(false);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Failed To validate SSO Login Data');
        $service->validateAndLoginUser(['email' => 'test@example.com'], 'app');
    }

    private function generateJwt(array $payload): string
    {
        $header = base64_encode(json_encode(['alg' => 'none', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode($payload));
        $signature = '';
        return sprintf('%s.%s.%s', rtrim(strtr($header, '+/', '-_'), '='), rtrim(strtr($payload, '+/', '-_'), '='), $signature);
    }
}
