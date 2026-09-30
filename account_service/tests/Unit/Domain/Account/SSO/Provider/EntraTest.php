<?php

namespace Tests\Domain\Account\SSO\Provider;

use PHPUnit\Framework\TestCase;
use App\Domain\Account\Provider\Login\Entra;
use App\Infrastructure\Environment;

class EntraTest extends TestCase
{
    protected function setUp(): void
    {
        $this->setEnvironmentValues([
            'ENTRA_CLIENT_ID' => 'test_client_id',
            'ENTRA_CLIENT_SECRET' => 'test_client_secret',
            'ENTRA_REDIRECT_URI' => 'https://example.com/redirect',
            'ENTRA_AUTHORIZE_URL' => 'https://auth.example.com/authorize',
            'ENTRA_TOKEN_URL' => 'https://auth.example.com/token',
            'ENTRA_SCOPE' => 'openid profile email',
        ]);
    }

    protected function tearDown(): void
    {
        $this->setEnvironmentValues([]);
    }

    public function testConstructorSetsPropertiesFromEnvironment()
    {
        $entra = new Entra();

        $this->assertEquals('test_client_id', $this->getProperty($entra, 'client_id'));
        $this->assertEquals('test_client_secret', $this->getProperty($entra, 'client_secret'));
        $this->assertEquals('https://example.com/redirect', $this->getProperty($entra, 'redirect_uri'));
        $this->assertEquals('https://auth.example.com/authorize', $this->getProperty($entra, 'authorize_url'));
        $this->assertEquals('https://auth.example.com/token', $this->getProperty($entra, 'token_url'));
        $this->assertEquals('openid profile email', $this->getProperty($entra, 'scope'));
        $this->assertNotEmpty($this->getProperty($entra, 'state'));
    }

    public function testGetRedirectUrlReturnsExpectedUrl()
    {
        $entra = new Entra();
        $entraReflection = new \ReflectionClass($entra);
        $state = $entraReflection->getProperty('state');
        $state->setAccessible(true);
        $stateValue = $state->getValue($entra);

        $expected = sprintf(
            'https://auth.example.com/authorize?client_id=%s&response_type=code&redirect_uri=%s&scope=%s',
            'test_client_id',
            'https://example.com/redirect',
            'openid profile email',
            $stateValue
        );
        $actual = $entra->get_redirect_url();
        $this->assertStringContainsString('https://auth.example.com/authorize?client_id=test_client_id',$actual);
        $this->assertStringContainsString('redirect_uri=' . urlencode('https://example.com/redirect'),$actual);
        $this->assertStringContainsString('scope=openid+profile+email',$actual);

    }

    public function testGetUserEmailReturnsEmail()
    {
        $entra = new Entra();
        $data = ['preferred_username' => 'user@example.com'];
        $this->assertEquals('user@example.com', $entra->getUserEmail($data));
    }

    public function testGetUserEmailThrowsIfMissing()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('No email found in SSO Login Data');
        $entra = new Entra();
        $entra->getUserEmail([]);
    }

    public function testValidateReturnsTrueForCorrectAudience()
    {
        $entra = new Entra();
        $clientId = $this->getProperty($entra, 'client_id');
        $data = ['aud' => $clientId];
        $this->assertTrue($entra->validate($data));
    }

    public function testValidateThrowsForIncorrectAudience()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid token: incorrect audience');
        $entra = new Entra();
        $entra->validate(['aud' => 'wrong_client_id']);
    }

    private function getProperty($object, $property)
    {
        $reflection = new \ReflectionClass($object);
        $prop = $reflection->getProperty($property);
        $prop->setAccessible(true);
        return $prop->getValue($object);
    }

    private function setEnvironmentValues(array $values): void
    {
        $reflection = new \ReflectionClass(Environment::class);
        $property = $reflection->getProperty('values');
        $property->setAccessible(true);
        $property->setValue(null, $values);
    }
}
