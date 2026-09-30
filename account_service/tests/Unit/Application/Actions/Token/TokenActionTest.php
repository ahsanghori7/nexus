<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Token;

use App\Application\Actions\Token\TokenAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class TokenActionTest extends TestCase
{
    public function testDisableMarksTokenInactiveWhenVerified(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->verifyResult = ['token' => 'abc'];

        $action = $this->createActionWithRepository($repository);
        $response = $action->disable($this->createRequest('POST', '/token/disable'), new Response(), ['token' => 'abc']);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(['abc'], $repository->inactiveTokens);
    }

    public function testDisableReturnsNotFoundWhenVerificationFails(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->verifyResult = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->disable($this->createRequest('POST', '/token/disable'), new Response(), ['token' => 'missing']);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testAddMetaTokenMergesPayloadAndPersists(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->tokenShouldLoad = true;
        $repository->tokenMeta = ['existing' => 'yes'];

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['new' => 'value']);

        $response = $action->addMetaToken($this->createRequest('PATCH', '/token/meta'), new Response(), ['token' => 'hash']);

        self::assertSame(203, $response->getStatusCode());
        self::assertSame(
            [
                [
                    'meta' => json_encode(['existing' => 'yes', 'new' => 'value']),
                ],
            ],
            $repository->tokenSavePayloads
        );
    }

    public function testAddMetaTokenReturnsNotFoundWhenTokenMissing(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->tokenShouldLoad = false;

        $action = $this->createActionWithRepository($repository);
        $response = $action->addMetaToken($this->createRequest('PATCH', '/token/meta'), new Response(), ['token' => 'missing']);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testCreateTokenPersistsPayloadWhenModelsLoad(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->tokenSaveReturn = ['id' => 555];
        $repository->tokenShouldLoad = true;
        $repository->tokenTypeShouldLoad = true;
        $repository->userShouldLoad = true;

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['type_id' => 5, 'user_id' => 7, 'meta' => ['foo' => 'bar']]);

        $response = $action->createToken($this->createRequest('POST', '/token'), new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame(7, $repository->lastUserLoadId);
        $saved = $repository->tokenSavePayloads[0];
        self::assertSame(7, $saved['user_id']);
        self::assertSame($repository->tokenTypeData['id'], $saved['token_type_id']);
        self::assertSame(json_encode(['foo' => 'bar']), $saved['meta']);
        self::assertNotEmpty($saved['created_at']);
        self::assertSame($repository->tokenSaveReturn, $payload['data']);
    }

    public function testCreateTokenReturnsNotFoundWhenUserMissing(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->tokenTypeShouldLoad = true;
        $repository->userShouldLoad = false;

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['type_id' => 5, 'user_id' => 7]);

        $response = $action->createToken($this->createRequest('POST', '/token'), new Response(), []);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testDeleteByUserIdDeletesTokens(): void
    {
        $repository = new TokenRepositoryStub();
        $action = $this->createActionWithRepository($repository);

        $response = $action->deleteByUserId($this->createRequest('DELETE', '/token/12'), new Response(), ['id' => '12']);

        self::assertSame([12], $repository->deletedUserIds);
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame('All tokens for user 12 deleted', $payload['data']['message']);
    }

    public function testDeleteByUserIdRequiresValidIdentifier(): void
    {
        $repository = new TokenRepositoryStub();
        $action = $this->createActionWithRepository($repository);
        $response = $action->deleteByUserId($this->createRequest('DELETE', '/token'), new Response(), []);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testListTypesReturnsConfiguredTypes(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->tokenTypeList = [
            ['id' => 1, 'label' => 'Reset'],
        ];

        $action = $this->createActionWithRepository($repository);
        $response = $action->listTypes($this->createRequest('GET', '/token/types'), new Response(), []);

        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame($repository->tokenTypeList, $payload['data']);
    }

    public function testVerifyTokenUsesLabelAndReturnsPayload(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->verifyResult = ['id' => 9];
        $repository->tokenTypeShouldLoad = true;

        $action = $this->createActionWithRepository($repository);
        $request = $this->createRequest('GET', '/token/abc')
            ->withQueryParams(['label' => 'Reset']);
        $response = $action->verifyToken($request, new Response(), ['token' => 'abc']);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame(['id' => 9], $payload['data']);
        self::assertSame([['label' => 'Reset']], $repository->tokenTypeFindCriteria);
        self::assertSame([['abc', $repository->tokenTypeData['id']]], $repository->verifyCalls);
    }

    public function testVerifyTokenReturnsNotFoundWhenVerificationFails(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->verifyResult = false;
        $repository->tokenTypeShouldLoad = false;

        $action = $this->createActionWithRepository($repository);
        $request = $this->createRequest('GET', '/token/abc')
            ->withQueryParams(['label' => 'Reset']);
        $response = $action->verifyToken($request, new Response(), ['token' => 'abc']);

        self::assertSame(404, $response->getStatusCode());
    }

    public function testListTokensReturnsRepositoryData(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->tokenList = [
            ['id' => 1, 'token' => 'abc'],
        ];

        $action = $this->createActionWithRepository($repository);
        $request = $this->createRequest('GET', '/token')
            ->withQueryParams(['active' => '1']);
        $response = $action->listTokens($request, new Response(), []);

        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame($repository->tokenList, $payload['data']);
        self::assertSame(['active' => '1'], $repository->tokenListParams);
    }

    public function testDisableBulkWithdrawsEveryIdentifierGiven(): void
    {
        $repository = new TokenRepositoryStub();
        $repository->bulkInactiveReturn = 3;

        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, ['ids' => [11, 22, 33]]);

        $response = $action->disableBulk($this->createRequest('POST', '/token/disable/bulk'), new Response(), []);

        self::assertSame(200, $response->getStatusCode());
        self::assertSame([[11, 22, 33]], $repository->bulkInactiveCalls);

        $payload = json_decode((string) $response->getBody(), true);
        self::assertSame(3, $payload['data']['revoked']);
    }

    /**
     * @dataProvider unusableBulkPayloads
     */
    public function testDisableBulkRejectsAPayloadItCannotActOn(array $data): void
    {
        $repository = new TokenRepositoryStub();
        $action = $this->createActionWithRepository($repository);
        $this->setActionData($action, $data);

        $response = $action->disableBulk($this->createRequest('POST', '/token/disable/bulk'), new Response(), []);

        self::assertSame(400, $response->getStatusCode());
        self::assertSame([], $repository->bulkInactiveCalls);
    }

    public static function unusableBulkPayloads(): array
    {
        return [
            'no ids key'   => [[]],
            'empty list'   => [['ids' => []]],
            'not a list'   => [['ids' => '11,22']],
        ];
    }

    private function createActionWithRepository(TokenRepositoryStub $repository): TokenAction
    {
        $logger = $this->createMock(LoggerInterface::class);
        $action = new TokenAction($logger);
        $this->injectRepository($action, $repository);
        return $action;
    }

    private function injectRepository(object $action, object $repository): void
    {
        $ref = new \ReflectionClass($action);
        $prop = $ref->getParentClass()->getProperty('repository');
        $prop->setAccessible(true);
        $prop->setValue($action, $repository);
    }

    private function setActionData(TokenAction $action, array $data): void
    {
        $ref = new \ReflectionClass($action);
        $prop = $ref->getParentClass()->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class TokenRepositoryStub
{
    public $verifyResult = false;
    public array $verifyCalls = [];
    public array $inactiveTokens = [];
    public array $tokenSavePayloads = [];
    public array $tokenList = [];
    public array $tokenListParams = [];
    public array $tokenTypeList = [];
    public array $tokenTypeFindCriteria = [];
    public array $deletedUserIds = [];
    public array $bulkInactiveCalls = [];
    public int $bulkInactiveReturn = 0;
    public array $tokenTypeData = ['id' => 5];
    public $tokenSaveReturn = ['id' => 321];
    public bool $tokenShouldLoad = true;
    public bool $tokenTypeShouldLoad = true;
    public bool $userShouldLoad = true;
    public array $tokenMeta = [];
    public ?int $lastUserLoadId = null;

    public function verify($token, $typeId = null)
    {
        $this->verifyCalls[] = [$token, $typeId];
        return $this->verifyResult;
    }

    public function setTokenInactive(string $token): void
    {
        $this->inactiveTokens[] = $token;
    }

    public function deleteTokensByUserId(int $uid): void
    {
        $this->deletedUserIds[] = $uid;
    }

    public function setTokensInactiveByIds(array $ids): int
    {
        $this->bulkInactiveCalls[] = $ids;

        return $this->bulkInactiveReturn;
    }

    public function getModel(string $name = 'user')
    {
        return match ($name) {
            'token' => new TokenModelStub($this),
            'tokenType' => new TokenTypeModelStub($this),
            'user' => new UserModelStub($this),
            default => new GenericModelStub(),
        };
    }
}

final class TokenModelStub
{
    public function __construct(private TokenRepositoryStub $repo)
    {
    }

    public function load($value, $field = 'id'): self
    {
        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->repo->tokenShouldLoad;
    }

    public function getMeta(): array
    {
        return $this->repo->tokenMeta;
    }

    public function save(array $data)
    {
        $payload = $data;
        $this->repo->tokenSavePayloads[] = $payload;
        return $this->repo->tokenSaveReturn;
    }

    public function all(array $params)
    {
        $this->repo->tokenListParams = $params;
        return $this->repo->tokenList;
    }
}

final class TokenTypeModelStub
{
    public function __construct(private TokenRepositoryStub $repo)
    {
    }

    public function load($id, $field = 'id'): self
    {
        return $this;
    }

    public function findOne(array $criteria)
    {
        $this->repo->tokenTypeFindCriteria[] = $criteria;
        return $this->repo->tokenTypeShouldLoad ? $this : null;
    }

    public function findAll(): array
    {
        return $this->repo->tokenTypeList;
    }

    public function isLoaded(): bool
    {
        return $this->repo->tokenTypeShouldLoad;
    }

    public function getId(): int
    {
        return $this->repo->tokenTypeData['id'];
    }
}

final class UserModelStub
{
    public function __construct(private TokenRepositoryStub $repo)
    {
    }

    public function load($id, $field = 'id'): self
    {
        $this->repo->lastUserLoadId = (int) $id;
        return $this;
    }

    public function isLoaded(): bool
    {
        return $this->repo->userShouldLoad;
    }
}

final class GenericModelStub
{
    public function __call($name, $arguments)
    {
        return $this;
    }
}
