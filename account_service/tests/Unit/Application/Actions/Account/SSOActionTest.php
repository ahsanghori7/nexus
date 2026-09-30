<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Account;

use App\Application\Actions\Account\SSOAction;
use Psr\Log\LoggerInterface;
use Slim\Exception\HttpNotFoundException;
use Slim\Psr7\Response;
use Tests\TestCase;

final class SSOActionTest extends TestCase
{
    public function testSsoLoginReturnsTokenAndUser(): void
    {
        $repository = new SsoRepositoryStub();
        $repository->providerLoadedOnLabel = true;
        $repository->service->loginResult = true;
        $repository->service->token = 'jwt';
        $repository->service->user = ['id' => 5];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/account/sso/okta')
            ->withQueryParams(['code' => 'abc']);
        $response = $action->sso_login($request, new Response(), ['provider' => 'okta']);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['token' => 'jwt', 'user' => ['id' => 5]], $payload['data']);
        self::assertSame([['code' => 'abc']], $repository->loginCalls);
    }

    public function testSsoLoginRaisesNotFoundWhenProviderMissing(): void
    {
        $repository = new SsoRepositoryStub();
        $repository->providerLoadedOnLabel = false;

        $action = $this->createAction($repository);
        self::expectException(HttpNotFoundException::class);
        $action->sso_login(
            $this->createRequest('GET', '/v1/account/sso/unknown'),
            new Response(),
            ['provider' => 'unknown']
        );
    }

    public function testGetSsoProviderAccountMappingReturnsConfiguredProvider(): void
    {
        $repository = new SsoRepositoryStub();
        $repository->mappingShouldLoad = true;
        $repository->mappingData = [['provider_id' => 9, 'meta' => null]];
        $repository->providerLoadedOnId = true;
        $repository->providerData = ['label' => 'azure'];
        $repository->service->redirectUrl = 'https://login.example';

        $action = $this->createAction($repository);
        $response = $action->getSSOProviderAccountMapping(
            $this->createRequest('GET', '/v1/account/4/sso'),
            new Response(),
            ['id' => '4']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(
            ['provider' => 'azure', 'redirect_url' => 'https://login.example'],
            $payload['data']
        );
    }

    private function createAction(SsoRepositoryStub $repository): SSOActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new SSOActionUnderTest($logger, $repository);
    }
}

final class SSOActionUnderTest extends SSOAction
{
    public function __construct(LoggerInterface $logger, SsoRepositoryStub $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }
}

final class SsoRepositoryStub
{
    public bool $providerLoadedOnLabel = true;
    public bool $providerLoadedOnId = true;
    public array $providerData = ['label' => 'local'];
    public bool $mappingShouldLoad = false;
    public array $mappingData = ['provider_id' => 0];
    public array $loginCalls = [];
    public array $mappingLoadCalls = [];
    public array $providerLoadCalls = [];
    public SsoProviderServiceStub $service;
    public array $providerAll = [];

    public function __construct()
    {
        $this->service = new SsoProviderServiceStub($this);
    }

    public function getModel(string $name = '')
    {
        return match ($name) {
            'provider' => new SsoProviderModelStub($this),
            'provider_account_mapping' => new SsoProviderAccountMappingStub($this),
            default => new class {
                public function __call(string $name, array $arguments)
                {
                    return [];
                }
            },
        };
    }

    public function recordLogin(array $data): void
    {
        $this->loginCalls[] = $data;
    }
}

final class SsoProviderModelStub
{
    private bool $loaded = false;

    public function __construct(private SsoRepositoryStub $repository)
    {
    }

    public function load($value, string $field = 'id'): self
    {
        if ($field === 'label') {
            $this->loaded = $this->repository->providerLoadedOnLabel;
        } else {
            $this->loaded = $this->repository->providerLoadedOnId;
        }
        $this->repository->providerLoadCalls[] = [$field, $value];
        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getProviderService(string $providerType = 'login'): SsoProviderServiceStub
    {
        return $this->repository->service;
    }

    public function getData(string $key)
    {
        return $this->repository->providerData[$key] ?? null;
    }

    public function all(): array
    {
        return $this->repository->providerAll;
    }

    public function findAll(array $criteria = []): array
    {
        return $this->repository->providerAll;
    }
}

final class SsoProviderAccountMappingStub
{
    private bool $loaded = false;

    public function __construct(private SsoRepositoryStub $repository)
    {
    }

    public function load($value, string $field = 'id'): self
    {
        $this->loaded = $this->repository->mappingShouldLoad;
        $this->repository->mappingLoadCalls[] = [$field, $value];
        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getData(string $key)
    {
        return $this->repository->mappingData[$key] ?? null;
    }

    public function findOne(array $filters): self
    {
        $this->loaded = $this->repository->mappingShouldLoad;
        return $this;
    }

    public function findAll(array $filters = [], int $limit = null): array
    {
        return $this->repository->mappingData;
    }
}

final class SsoProviderServiceStub
{
    public bool $loginResult = true;
    public string $token = '';
    public array $user = [];
    public string $redirectUrl = 'https://example.test';
    public array $loginCalls = [];

    public function __construct(private SsoRepositoryStub $repository)
    {
    }

    public function login(array $data): bool
    {
        $this->loginCalls[] = $data;
        $this->repository->recordLogin($data);
        return $this->loginResult;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function getUser(): array
    {
        return $this->user;
    }

    public function get_redirect_url(): string
    {
        return $this->redirectUrl;
    }
}
