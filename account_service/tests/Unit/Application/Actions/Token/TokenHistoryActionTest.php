<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Token;

use App\Application\Actions\Action;
use App\Application\Actions\Token\TokenHistoryAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class TokenHistoryActionTest extends TestCase
{
    public function testListTokenHistoryIssuedReturnsRecords(): void
    {
        $repository = new TokenHistoryRepositoryStub();
        $repository->tokenIssuedRecords = [['id' => 1]];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/token-history/issued')
            ->withQueryParams(['user_id' => '5']);

        $response = $action->listTokenHistoryIssued($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->tokenIssuedRecords, $payload['data']);
        self::assertSame([
            ['user_id' => '5'],
        ], $repository->tokenIssuedFindAllCalls);
    }

    public function testListTokenHistoryUsedReturnsRecords(): void
    {
        $repository = new TokenHistoryRepositoryStub();
        $repository->tokenUsedRecords = [['id' => 9]];

        $action = $this->createAction($repository);
        $request = $this->createRequest('GET', '/v1/token-history/used')
            ->withQueryParams(['account_id' => '2']);

        $response = $action->listTokenHistoryUsed($request, new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->tokenUsedRecords, $payload['data']);
        self::assertSame([
            ['account_id' => '2'],
        ], $repository->tokenUsedFindAllCalls);
    }

    public function testListTokenHistoryReturnsAggregatedModels(): void
    {
        $repository = new TokenHistoryRepositoryStub();
        $repository->tokenIssuedRecords = [['id' => 1]];
        $repository->tokenUsedRecords = [['id' => 4]];

        $action = $this->createAction($repository);
        $response = $action->listTokenHistory(
            $this->createRequest('GET', '/v1/token-history'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([
            'issued' => $repository->tokenIssuedRecords,
            'used' => $repository->tokenUsedRecords,
        ], $payload['data']);
    }

    public function testCreateTokenIssuedHistorySavesHistoryAndDisablesToken(): void
    {
        $repository = new TokenHistoryRepositoryStub();
        $repository->verificationResult = new TokenVerificationStub(7);
        $repository->userLoaded = true;
        $repository->userAccountId = 23;
        $repository->tokenIssuedSaveResult = ['id' => 33];

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'token' => 'abc123',
            'token_amount' => 5,
            'cost' => 10,
        ]);

        $response = $action->createTokenIssuedHistory(
            $this->createRequest('POST', '/v1/token-history/issued'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->tokenIssuedSaveResult, $payload['data']);
        self::assertSame([
            ['payment_request', 'label'],
        ], $repository->tokenTypeLoadCalls);
        self::assertSame([
            ['abc123', TokenHistoryTokenTypeEntityStub::TOKEN_TYPE_ID],
        ], $repository->verifyCalls);
        self::assertSame([
            [
                'account_id' => 23,
                'token_amount' => 5,
                'cost' => 10,
            ],
        ], $repository->tokenIssuedSaveCalls);
        self::assertSame(['abc123'], $repository->tokenInactiveTokens);
    }

    public function testCreateTokenIssuedHistoryReturnsNotFoundWhenVerifyThrows(): void
    {
        $repository = new TokenHistoryRepositoryStub();
        $repository->verifyThrows = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'token' => 'bad',
            'token_amount' => 1,
            'cost' => 2,
        ]);

        $response = $action->createTokenIssuedHistory(
            $this->createRequest('POST', '/v1/token-history/issued'),
            new Response(),
            []
        );

        self::assertSame(404, $response->getStatusCode());
    }

    public function testCreateTokenUsedHistorySavesRecord(): void
    {
        $repository = new TokenHistoryRepositoryStub();
        $repository->tokenUsedSaveResult = ['id' => 44];

        $action = $this->createAction($repository);
        $payload = [
            'account_id' => 12,
            'user_id' => 2,
            'project_id' => 99,
            'token_type' => 'grant',
        ];
        $this->setActionData($action, $payload);

        $response = $action->createTokenUsedHistory(
            $this->createRequest('POST', '/v1/token-history/used'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payloadData = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->tokenUsedSaveResult, $payloadData['data']);
        self::assertSame([$payload], $repository->tokenUsedSaveCalls);
    }

    public function testCreateTokenUsedHistoryReturnsNotFoundWhenSaveFails(): void
    {
        $repository = new TokenHistoryRepositoryStub();
        $repository->tokenUsedSaveThrows = true;

        $action = $this->createAction($repository);
        $this->setActionData($action, [
            'account_id' => 1,
            'user_id' => 2,
            'project_id' => 3,
            'token_type' => 'grant',
        ]);

        $response = $action->createTokenUsedHistory(
            $this->createRequest('POST', '/v1/token-history/used'),
            new Response(),
            []
        );

        self::assertSame(404, $response->getStatusCode());
    }

    private function createAction(TokenHistoryRepositoryStub $repository): TokenHistoryActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new TokenHistoryActionUnderTest($logger, $repository);
    }

    private function setActionData(TokenHistoryAction $action, mixed $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class TokenHistoryActionUnderTest extends TokenHistoryAction
{
    public function __construct(LoggerInterface $logger, private TokenHistoryRepositoryStub $repositoryStub)
    {
        parent::__construct($logger);
        $this->repository = $repositoryStub;
    }
}

final class TokenHistoryRepositoryStub
{
    public array $tokenIssuedRecords = [];
    public array $tokenUsedRecords = [];
    public array $tokenIssuedFindAllCalls = [];
    public array $tokenUsedFindAllCalls = [];
    public array $tokenIssuedSaveCalls = [];
    public array $tokenUsedSaveCalls = [];
    public array $tokenInactiveTokens = [];
    public array $tokenTypeLoadCalls = [];
    public array $verifyCalls = [];
    public bool $verifyThrows = false;
    public bool $tokenIssuedSaveThrows = false;
    public bool $tokenUsedSaveThrows = false;
    public ?TokenVerificationStub $verificationResult = null;
    public bool $userLoaded = true;
    public int $userAccountId = 0;
    public array $tokenUsedSaveResult = [];
    public array $tokenIssuedSaveResult = [];

    public function getModel(string $name = '')
    {
        return match ($name) {
            'tokenIssued' => new TokenIssuedModelStub($this),
            'tokenUsed' => new TokenUsedModelStub($this),
            'tokenType' => new TokenHistoryTokenTypeModelStub($this),
            'token' => new TokenHistoryTokenModelStub($this),
            'user' => new TokenHistoryUserModelStub($this),
            default => new class {
                public function __call(string $name, array $arguments)
                {
                    return null;
                }
            },
        };
    }

    public function verify(string $token, int $tokenTypeId)
    {
        if ($this->verifyThrows) {
            throw new \Exception('verify failed');
        }

        $this->verifyCalls[] = [$token, $tokenTypeId];
        return $this->verificationResult;
    }
}

final class TokenIssuedModelStub
{
    public function __construct(private TokenHistoryRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        $this->repository->tokenIssuedFindAllCalls[] = $filters;
        return $this->repository->tokenIssuedRecords;
    }

    public function save(array $data)
    {
        if ($this->repository->tokenIssuedSaveThrows) {
            throw new \Exception('save failed');
        }

        $this->repository->tokenIssuedSaveCalls[] = $data;
        return $this->repository->tokenIssuedSaveResult;
    }
}

final class TokenUsedModelStub
{
    public function __construct(private TokenHistoryRepositoryStub $repository)
    {
    }

    public function findAll(array $filters = []): array
    {
        $this->repository->tokenUsedFindAllCalls[] = $filters;
        return $this->repository->tokenUsedRecords;
    }

    public function save(array $data)
    {
        if ($this->repository->tokenUsedSaveThrows) {
            throw new \Exception('save failed');
        }

        $this->repository->tokenUsedSaveCalls[] = $data;
        return $this->repository->tokenUsedSaveResult;
    }
}

final class TokenHistoryTokenTypeModelStub
{
    public function __construct(private TokenHistoryRepositoryStub $repository)
    {
    }

    public function load(string $value, string $field)
    {
        $this->repository->tokenTypeLoadCalls[] = [$value, $field];
        return new TokenHistoryTokenTypeEntityStub();
    }
}

final class TokenHistoryTokenTypeEntityStub
{
    public const TOKEN_TYPE_ID = 15;

    public function getId(): int
    {
        return self::TOKEN_TYPE_ID;
    }
}

final class TokenHistoryTokenModelStub
{
    public function __construct(private TokenHistoryRepositoryStub $repository)
    {
    }

    public function load(string $token, string $field): TokenHistoryTokenStub
    {
        return new TokenHistoryTokenStub($token, $this->repository);
    }
}

final class TokenHistoryTokenStub
{
    public function __construct(private string $token, private TokenHistoryRepositoryStub $repository)
    {
    }

    public function setTokenInactive(): void
    {
        $this->repository->tokenInactiveTokens[] = $this->token;
    }
}

final class TokenHistoryUserModelStub
{
    public function __construct(private TokenHistoryRepositoryStub $repository)
    {
    }

    public function load(int $userId, string $field): TokenHistoryUserEntityStub
    {
        return new TokenHistoryUserEntityStub($this->repository->userLoaded, $this->repository->userAccountId);
    }
}

final class TokenHistoryUserEntityStub
{
    public function __construct(private bool $loaded, private int $accountId)
    {
    }

    public function isLoaded(): bool
    {
        return $this->loaded;
    }

    public function getData(string $key)
    {
        if ($key === 'account_id') {
            return $this->accountId;
        }

        return null;
    }
}

final class TokenVerificationStub
{
    public function __construct(private int $userId)
    {
    }

    public function getData(string $key)
    {
        if ($key === 'user_id') {
            return $this->userId;
        }

        return null;
    }
}
