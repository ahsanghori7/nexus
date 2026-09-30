<?php
declare(strict_types=1);

namespace Tests\Domain\Account\SSO\Provider;

use App\Domain\Account\Provider\Login\Local;
use App\Infrastructure\Environment;
use PHPUnit\Framework\TestCase;

final class LocalTest extends TestCase
{
    protected function setUp(): void
    {
        $this->setEnvironmentValues([
            'DEFAULT_REDIRECT_LOGIN_URL' => 'https://accounts.example.com/login',
        ]);
    }

    protected function tearDown(): void
    {
        $this->setEnvironmentValues([]);
    }

    public function testGetRedirectUrlReturnsConfiguredValue(): void
    {
        $provider = new Local();
        self::assertSame('https://accounts.example.com/login', $provider->get_redirect_url(0));
    }

    public function testLoginThrowsException(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Local Login via password is not implemented via sso routes');
        (new Local())->login([]);
    }

    public function testGetUserEmailThrowsException(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Local Login via password is not implemented via sso routes');
        (new Local())->getUserEmail([]);
    }

    public function testValidateThrowsException(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Local Login via password is not implemented via sso routes');
        (new Local())->validate([]);
    }

    private function setEnvironmentValues(array $values): void
    {
        $ref = new \ReflectionClass(Environment::class);
        $prop = $ref->getProperty('values');
        $prop->setAccessible(true);
        $prop->setValue(null, $values);
    }
}
