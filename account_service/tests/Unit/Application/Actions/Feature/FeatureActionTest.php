<?php
declare(strict_types=1);

namespace Tests\Application\Actions\Feature;

use App\Application\Actions\Action;
use App\Application\Actions\Feature\FeatureAction;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Response;
use Tests\TestCase;

final class FeatureActionTest extends TestCase
{
    public function testFetchFeaturesReturnsRepositoryData(): void
    {
        $repository = new FeatureRepositoryStub();
        $repository->features = [['id' => 1]];

        $action = $this->createAction($repository);
        $response = $action->fetchFeatures(
            $this->createRequest('GET', '/v1/feature'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->features, $payload['data']);
    }

    public function testUpdateAccountsFeaturesPassesPayload(): void
    {
        $repository = new FeatureRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, ['features' => [1, 2]]);

        $response = $action->updateAccountsFeatures(
            $this->createRequest('PATCH', '/v1/feature'),
            new Response(),
            []
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['features' => [1, 2]], $payload['data']);
        self::assertSame([['features' => [1, 2]]], $repository->updateFeaturesCalls);
    }

    public function testFetchAccountsWithFeaturesReturnsPayload(): void
    {
        $repository = new FeatureRepositoryStub();
        $repository->accountsWithFeatures[5] = ['feature_ids' => [7, 9]];

        $action = $this->createAction($repository);
        $response = $action->fetchAccountsWithFeatures(
            $this->createRequest('GET', '/v1/feature/accounts/5'),
            new Response(),
            ['aid' => '5']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($repository->accountsWithFeatures[5], $payload['data']);
    }

    public function testDeleteAccountsFeaturesReturnsRepositoryPayload(): void
    {
        $repository = new FeatureRepositoryStub();
        $action = $this->createAction($repository);

        $response = $action->deleteAccountsFeatures(
            $this->createRequest('DELETE', '/v1/feature/accounts/7'),
            new Response(),
            ['aid' => '7']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['deleted' => 7], $payload['data']);
        self::assertSame([7], $repository->deleteFeatureCalls);
    }

    public function testFetchAccountEnvelopesReturnsRepositoryData(): void
    {
        $repository = new FeatureRepositoryStub();
        $repository->envelopesByAccount[4] = ['limit' => 3];

        $action = $this->createAction($repository);
        $response = $action->fetchAccountEnvelopes(
            $this->createRequest('GET', '/v1/feature/accounts/4/envelopes'),
            new Response(),
            ['aid' => '4']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['limit' => 3], $payload['data']);
    }

    public function testUpdateEnvelopesReturnsRepositoryData(): void
    {
        $repository = new FeatureRepositoryStub();
        $action = $this->createAction($repository);
        $this->setActionData($action, ['limit' => 6]);

        $response = $action->updateEnvelopes(
            $this->createRequest('PATCH', '/v1/feature/accounts/2/envelopes'),
            new Response(),
            ['aid' => '2']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['limit' => 6], $payload['data']);
        self::assertSame([['aid' => 2, 'data' => ['limit' => 6]]], $repository->updateEnvelopesCalls);
    }

    public function testUpdateAccountsFeaturesMappingCallsRepository(): void
    {
        $repository = new FeatureRepositoryStub();
        $action = $this->createAction($repository);

        $response = $action->updateAccountsFeaturesMapping(
            $this->createRequest('PATCH', '/v1/feature/accounts/3/mapping/4'),
            new Response(),
            ['maid' => '3', 'feature' => '4']
        );

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['maid' => 3, 'feature' => 4], $payload['data']);
        self::assertSame([['maid' => 3, 'feature' => 4]], $repository->mappingCalls);
    }

    private function createAction(FeatureRepositoryStub $repository): FeatureActionUnderTest
    {
        $logger = $this->createMock(LoggerInterface::class);
        return new FeatureActionUnderTest($logger, $repository);
    }

    private function setActionData(FeatureAction $action, array $data): void
    {
        $ref = new \ReflectionClass(Action::class);
        $prop = $ref->getProperty('data');
        $prop->setAccessible(true);
        $prop->setValue($action, $data);
    }
}

final class FeatureActionUnderTest extends FeatureAction
{
    public function __construct(LoggerInterface $logger, FeatureRepositoryStub $repository)
    {
        parent::__construct($logger);
        $this->repository = $repository;
    }
}

final class FeatureRepositoryStub
{
    public array $features = [];
    public array $updateFeaturesCalls = [];
    public array $accountsWithFeatures = [];
    public array $deleteFeatureCalls = [];
    public array $envelopesByAccount = [];
    public array $updateEnvelopesCalls = [];
    public array $mappingCalls = [];

    public function getFeatures(): array
    {
        return $this->features;
    }

    public function getAccountsWithFeatures(int $aid): array
    {
        return $this->accountsWithFeatures[$aid] ?? [];
    }

    public function deleteAccountsFeatures(int $aid): array
    {
        $this->deleteFeatureCalls[] = $aid;
        return ['deleted' => $aid];
    }

    public function updateAccountsFeatures(array $payload): array
    {
        $this->updateFeaturesCalls[] = $payload;
        return $payload;
    }

    public function getAccountEnvelopes(int $aid): array
    {
        return $this->envelopesByAccount[$aid] ?? [];
    }

    public function updateEnvelopes(int $aid, array $data): array
    {
        $this->updateEnvelopesCalls[] = ['aid' => $aid, 'data' => $data];
        return $data;
    }

    public function updateAccountsFeaturesMapping(int $maid, int $feature): array
    {
        $this->mappingCalls[] = ['maid' => $maid, 'feature' => $feature];
        return ['maid' => $maid, 'feature' => $feature];
    }
}
